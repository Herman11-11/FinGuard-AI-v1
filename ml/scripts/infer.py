from pathlib import Path
from pprint import pprint
import json
import sys

import torch
from PIL import Image
from torchvision import transforms

from config import EMBEDDING_DIM, IMAGE_SIZE, MODEL_NAME, MODELS_DIR
from model import DocumentEmbeddingModel, embedding_to_signature


MODEL_PATH = MODELS_DIR / "document_embedding_resnet18.pt"


def build_inference_transform():
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def load_model(model_path: Path = MODEL_PATH, device: str | None = None):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(model_path, map_location=device)

    model = DocumentEmbeddingModel(embedding_dim=checkpoint.get("embedding_dim", EMBEDDING_DIM))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    return model, checkpoint, device


def infer_image(image_path: Path, model_path: Path = MODEL_PATH):
    model, checkpoint, device = load_model(model_path)
    transform = build_inference_transform()

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model(tensor)[0]

    signature = embedding_to_signature(embedding)
    embedding_list = [round(float(value), 6) for value in embedding.detach().cpu().tolist()]

    return {
        "model_name": checkpoint.get("model_name", MODEL_NAME),
        "embedding_dim": checkpoint.get("embedding_dim", EMBEDDING_DIM),
        "image_size": checkpoint.get("image_size", IMAGE_SIZE),
        "image_path": str(image_path),
        "signature": signature,
        "embedding": embedding_list,
    }


def main():
    if len(sys.argv) > 1:
        image_path = Path(sys.argv[1])
        if not image_path.exists():
            print(json.dumps({"error": f"Image not found: {image_path}"}))
            raise SystemExit(1)
        result = infer_image(image_path)
        print(json.dumps(result))
        return

    sample_image = Path("ml/data/raw/LAND-SYN-001/scan_clean.png")
    if not sample_image.exists():
        print("Sample image not found:", sample_image)
        return

    result = infer_image(sample_image)
    pprint(
        {
            "model_name": result["model_name"],
            "embedding_dim": result["embedding_dim"],
            "image_path": result["image_path"],
            "signature": result["signature"],
            "embedding_preview": result["embedding"][:8],
        }
    )


if __name__ == "__main__":
    main()
