import hashlib
import io
import json
import math
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageFilter, ImageOps


class AIFingerprintService:
    VERSION = 2

    @staticmethod
    def _open_image(image_bytes: bytes) -> Image.Image:
        image = Image.open(io.BytesIO(image_bytes))
        return image.convert("RGB")

    @classmethod
    def _project_root(cls) -> Path:
        return Path(__file__).resolve().parents[3]

    @classmethod
    def _ml_python(cls) -> Path:
        override = os.getenv("FINGUARD_ML_PYTHON")
        if override:
            return Path(override)
        return cls._project_root().parent / "ml-venv" / "bin" / "python"

    @classmethod
    def _infer_script(cls) -> Path:
        return cls._project_root() / "ml" / "scripts" / "infer.py"

    @classmethod
    def _run_trained_model(cls, image_bytes: bytes) -> dict[str, Any] | None:
        ml_python = cls._ml_python()
        infer_script = cls._infer_script()

        if not ml_python.exists() or not infer_script.exists():
            return None

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = Path(tmp.name)

        try:
            result = subprocess.run(
                [str(ml_python), str(infer_script), str(tmp_path)],
                check=True,
                capture_output=True,
                text=True,
            )
            payload = json.loads(result.stdout)
            if payload.get("error"):
                return None
            return payload
        except Exception as exc:
            print(f"⚠️ ML inference fallback triggered: {exc}")
            return None
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass

    @staticmethod
    def _difference_hash(image: Image.Image, size: int = 16) -> str:
        grayscale = ImageOps.grayscale(image)
        resized = grayscale.resize((size + 1, size), Image.Resampling.LANCZOS)
        pixels = list(resized.getdata())

        bits = []
        row_width = size + 1
        for row in range(size):
            row_start = row * row_width
            for col in range(size):
                left_pixel = pixels[row_start + col]
                right_pixel = pixels[row_start + col + 1]
                bits.append("1" if left_pixel > right_pixel else "0")

        return "".join(bits)

    @staticmethod
    def _hex_histogram_signature(image: Image.Image) -> str:
        thumb = image.resize((64, 64), Image.Resampling.LANCZOS)
        histogram = thumb.histogram()

        reduced = []
        for channel_start in (0, 256, 512):
            channel = histogram[channel_start:channel_start + 256]
            bucket_size = 16
            for i in range(0, 256, bucket_size):
                reduced.append(sum(channel[i:i + bucket_size]))

        histogram_string = ",".join(str(value) for value in reduced)
        return hashlib.sha256(histogram_string.encode("utf-8")).hexdigest()

    @staticmethod
    def _edge_density(image: Image.Image) -> float:
        grayscale = ImageOps.grayscale(image).resize((128, 128), Image.Resampling.LANCZOS)
        edges = grayscale.filter(ImageFilter.FIND_EDGES)
        pixels = list(edges.getdata())
        threshold = 24
        edge_pixels = sum(1 for pixel in pixels if pixel >= threshold)
        density = edge_pixels / max(len(pixels), 1)
        return round(edge_pixels / max(len(pixels), 1), 6)

    @staticmethod
    def _average_brightness(image: Image.Image) -> float:
        grayscale = ImageOps.grayscale(image).resize((64, 64), Image.Resampling.LANCZOS)
        pixels = list(grayscale.getdata())
        brightness = sum(pixels) / max(len(pixels), 1)
        return round(brightness / 255, 6)

    @classmethod
    def _fallback_fingerprint(cls, image_bytes: bytes) -> dict[str, Any]:
        image = cls._open_image(image_bytes)
        dhash_bits = cls._difference_hash(image)
        hist_hash = cls._hex_histogram_signature(image)
        edge_density = cls._edge_density(image)
        brightness = cls._average_brightness(image)

        signature_source = json.dumps(
            {
                "dhash": dhash_bits,
                "hist_hash": hist_hash,
                "edge_density": edge_density,
                "brightness": brightness,
            },
            sort_keys=True,
        )

        return {
            "version": 1,
            "algorithm": "phase1_visual_fingerprint",
            "signature": hashlib.sha256(signature_source.encode("utf-8")).hexdigest(),
            "dhash": dhash_bits,
            "hist_hash": hist_hash,
            "edge_density": edge_density,
            "brightness": brightness,
        }

    @classmethod
    def generate_fingerprint(cls, image_bytes: bytes) -> dict[str, Any]:
        trained_result = cls._run_trained_model(image_bytes)
        if trained_result:
            return {
                "version": cls.VERSION,
                "algorithm": "resnet18_embedding",
                "signature": trained_result["signature"],
                "embedding_dim": trained_result["embedding_dim"],
                "embedding": trained_result["embedding"],
                "model_name": trained_result["model_name"],
            }

        return cls._fallback_fingerprint(image_bytes)

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right:
            return 0.0
        max_len = min(len(left), len(right))
        left = left[:max_len]
        right = right[:max_len]
        dot = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(a * a for a in left))
        right_norm = math.sqrt(sum(b * b for b in right))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return dot / (left_norm * right_norm)

    @staticmethod
    def _hamming_distance(left: str, right: str) -> int:
        if len(left) != len(right):
            max_len = max(len(left), len(right))
            left = left.ljust(max_len, "0")
            right = right.ljust(max_len, "0")
        return sum(1 for a, b in zip(left, right) if a != b)

    @classmethod
    def compare_fingerprints(
        cls,
        stored_fingerprint: dict[str, Any] | None,
        candidate_fingerprint: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if not stored_fingerprint or not candidate_fingerprint:
            return {
                "available": False,
                "match": False,
                "similarity": None,
                "reason": "missing fingerprint",
            }

        stored_algorithm = stored_fingerprint.get("algorithm")
        candidate_algorithm = candidate_fingerprint.get("algorithm")

        if stored_algorithm == "resnet18_embedding" and candidate_algorithm == "resnet18_embedding":
            similarity = round(
                cls._cosine_similarity(
                    stored_fingerprint.get("embedding", []),
                    candidate_fingerprint.get("embedding", []),
                ),
                4,
            )
            return {
                "available": True,
                "match": similarity >= 0.92,
                "similarity": similarity,
                "comparison_type": "cosine_embedding",
                "stored_signature": stored_fingerprint.get("signature"),
                "candidate_signature": candidate_fingerprint.get("signature"),
            }

        stored_dhash = stored_fingerprint.get("dhash", "")
        candidate_dhash = candidate_fingerprint.get("dhash", "")
        dhash_distance = cls._hamming_distance(stored_dhash, candidate_dhash)
        max_bits = max(len(stored_dhash), len(candidate_dhash), 1)
        dhash_score = 1 - (dhash_distance / max_bits)

        hist_match = 1.0 if stored_fingerprint.get("hist_hash") == candidate_fingerprint.get("hist_hash") else 0.0

        stored_edge = float(stored_fingerprint.get("edge_density", 0))
        candidate_edge = float(candidate_fingerprint.get("edge_density", 0))
        edge_score = max(0.0, 1 - min(abs(stored_edge - candidate_edge) / 0.2, 1))

        stored_brightness = float(stored_fingerprint.get("brightness", 0))
        candidate_brightness = float(candidate_fingerprint.get("brightness", 0))
        brightness_score = max(0.0, 1 - min(abs(stored_brightness - candidate_brightness) / 0.25, 1))

        similarity = round(
            (dhash_score * 0.5) +
            (hist_match * 0.2) +
            (edge_score * 0.2) +
            (brightness_score * 0.1),
            4,
        )

        return {
            "available": True,
            "match": similarity >= 0.82,
            "similarity": similarity,
            "comparison_type": "fallback_visual",
            "dhash_score": round(dhash_score, 4),
            "histogram_match": bool(hist_match),
            "edge_score": round(edge_score, 4),
            "brightness_score": round(brightness_score, 4),
            "stored_signature": stored_fingerprint.get("signature"),
            "candidate_signature": candidate_fingerprint.get("signature"),
        }
