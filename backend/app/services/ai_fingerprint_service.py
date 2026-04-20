import hashlib
import io
import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image


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
        local_ml_python = cls._project_root().parent / "ml-venv" / "bin" / "python"
        if local_ml_python.exists():
            return local_ml_python
        return Path(sys.executable)

    @classmethod
    def _infer_script(cls) -> Path:
        return cls._project_root() / "ml" / "scripts" / "infer.py"

    @classmethod
    def _run_trained_model(cls, image_bytes: bytes) -> dict[str, Any]:
        ml_python = cls._ml_python()
        infer_script = cls._infer_script()

        if not ml_python.exists() or not infer_script.exists():
            raise RuntimeError("Trained AI runtime is not available")

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
                raise RuntimeError(payload["error"])
            return payload
        except Exception as exc:
            raise RuntimeError(f"Trained AI inference failed: {exc}") from exc
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass

    @classmethod
    def generate_fingerprint(cls, image_bytes: bytes) -> dict[str, Any]:
        trained_result = cls._run_trained_model(image_bytes)
        return {
            "version": cls.VERSION,
            "algorithm": "resnet18_embedding",
            "signature": trained_result["signature"],
            "embedding_dim": trained_result["embedding_dim"],
            "embedding": trained_result["embedding"],
            "model_name": trained_result["model_name"],
        }

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

        if stored_algorithm != "resnet18_embedding" or candidate_algorithm != "resnet18_embedding":
            return {
                "available": False,
                "match": False,
                "similarity": None,
                "reason": "trained ai fingerprint unavailable",
            }

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
