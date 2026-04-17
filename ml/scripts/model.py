import hashlib
import json

import torch
import torch.nn as nn
from torchvision import models

from config import EMBEDDING_DIM


class DocumentEmbeddingModel(nn.Module):
    def __init__(self, embedding_dim: int = EMBEDDING_DIM):
        super().__init__()
        backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone
        self.head = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, embedding_dim),
        )

    def forward(self, x):
        features = self.backbone(x)
        embedding = self.head(features)
        return nn.functional.normalize(embedding, p=2, dim=1)


def embedding_to_signature(embedding_tensor: torch.Tensor) -> str:
    flat = embedding_tensor.detach().cpu().flatten().tolist()
    serialized = json.dumps([round(value, 6) for value in flat], separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
