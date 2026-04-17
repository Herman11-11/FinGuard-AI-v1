from pathlib import Path
from pprint import pprint

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from config import (
    BATCH_SIZE,
    EMBEDDING_DIM,
    IMAGE_SIZE,
    LEARNING_RATE,
    LOGS_DIR,
    MODEL_NAME,
    MODELS_DIR,
    NUM_EPOCHS,
)
from dataset import SiameseDocumentDataset, summarize_dataset
from model import DocumentEmbeddingModel


class ContrastiveLoss(nn.Module):
    def __init__(self, margin: float = 1.0):
        super().__init__()
        self.margin = margin

    def forward(self, embedding_a, embedding_b, labels):
        distances = torch.nn.functional.pairwise_distance(embedding_a, embedding_b)
        positive_loss = labels * torch.pow(distances, 2)
        negative_loss = (1 - labels) * torch.pow(torch.clamp(self.margin - distances, min=0.0), 2)
        return torch.mean(positive_loss + negative_loss)


def main():
    summary = summarize_dataset()
    siamese_dataset = SiameseDocumentDataset()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("FinGuard-AI Training Setup")
    print("==========================")
    pprint(
        {
            "model": MODEL_NAME,
            "embedding_dim": EMBEDDING_DIM,
            "image_size": IMAGE_SIZE,
            "batch_size": BATCH_SIZE,
            "num_epochs": NUM_EPOCHS,
            "learning_rate": LEARNING_RATE,
            "dataset": summary,
            "training_pairs": len(siamese_dataset),
            "device": str(device),
        }
    )

    if summary["documents"] == 0:
        print("\nNo training documents found yet.")
        print("Add folders under ml/data/raw/LAND-XXX with image files inside them.")
        return

    if len(siamese_dataset) == 0:
        print("\nDataset found, but not enough multi-image documents to form training pairs.")
        return

    dataloader = DataLoader(siamese_dataset, batch_size=BATCH_SIZE, shuffle=True)
    model = DocumentEmbeddingModel(embedding_dim=EMBEDDING_DIM).to(device)
    criterion = ContrastiveLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    epoch_losses = []

    print("\nStarting prototype training...")
    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0

        for batch in dataloader:
            image_a = batch["image_a"].to(device)
            image_b = batch["image_b"].to(device)
            labels = batch["label"].float().to(device)

            optimizer.zero_grad()
            embedding_a = model(image_a)
            embedding_b = model(image_b)
            loss = criterion(embedding_a, embedding_b, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        avg_loss = running_loss / max(len(dataloader), 1)
        epoch_losses.append(avg_loss)
        print(f"Epoch {epoch + 1}/{NUM_EPOCHS} - loss: {avg_loss:.4f}")

    model_path = MODELS_DIR / "document_embedding_resnet18.pt"
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "embedding_dim": EMBEDDING_DIM,
            "model_name": MODEL_NAME,
            "image_size": IMAGE_SIZE,
            "loss_history": epoch_losses,
        },
        model_path,
    )

    log_path = LOGS_DIR / "train_log.txt"
    log_lines = [
        "FinGuard-AI prototype training log",
        f"model={MODEL_NAME}",
        f"embedding_dim={EMBEDDING_DIM}",
        f"image_size={IMAGE_SIZE}",
        f"batch_size={BATCH_SIZE}",
        f"num_epochs={NUM_EPOCHS}",
        f"learning_rate={LEARNING_RATE}",
        f"device={device}",
        f"training_pairs={len(siamese_dataset)}",
        f"loss_history={epoch_losses}",
    ]
    log_path.write_text("\n".join(log_lines), encoding="utf-8")

    print(f"\nTraining complete. Model saved to: {model_path}")
    print(f"Training log saved to: {log_path}")


if __name__ == "__main__":
    main()
