from dataclasses import dataclass
from pathlib import Path
import random
from typing import List

from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

from config import IMAGE_EXTENSIONS, IMAGE_SIZE, RAW_DATA_DIR, SEED


@dataclass
class DocumentSample:
    document_id: str
    image_paths: List[Path]


def list_document_folders(root: Path = RAW_DATA_DIR) -> List[Path]:
    if not root.exists():
        return []
    return sorted([path for path in root.iterdir() if path.is_dir()])


def list_document_images(document_dir: Path) -> List[Path]:
    return sorted(
        [
            path
            for path in document_dir.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ]
    )


def load_document_samples(root: Path = RAW_DATA_DIR) -> List[DocumentSample]:
    samples: List[DocumentSample] = []
    for document_dir in list_document_folders(root):
        images = list_document_images(document_dir)
        if images:
            samples.append(DocumentSample(document_id=document_dir.name, image_paths=images))
    return samples


def summarize_dataset(root: Path = RAW_DATA_DIR) -> dict:
    samples = load_document_samples(root)
    return {
        "documents": len(samples),
        "images": sum(len(sample.image_paths) for sample in samples),
        "documents_with_multiple_images": sum(1 for sample in samples if len(sample.image_paths) > 1),
    }


def build_train_transforms():
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ColorJitter(brightness=0.12, contrast=0.12, saturation=0.08),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


class SiameseDocumentDataset(Dataset):
    def __init__(self, root: Path = RAW_DATA_DIR, transform=None, pairs_per_document: int = 6):
        self.samples = load_document_samples(root)
        self.transform = transform or build_train_transforms()
        self.pairs_per_document = pairs_per_document
        self.random = random.Random(SEED)
        self.pairs = self._build_pairs()

    def _build_pairs(self):
        pairs = []
        if len(self.samples) < 2:
            return pairs

        multi_image_samples = [sample for sample in self.samples if len(sample.image_paths) >= 2]
        for sample in multi_image_samples:
            other_samples = [candidate for candidate in self.samples if candidate.document_id != sample.document_id]
            if not other_samples:
                continue

            for _ in range(self.pairs_per_document):
                positive_left, positive_right = self.random.sample(sample.image_paths, 2)
                pairs.append((positive_left, positive_right, 1.0))

                negative_left = self.random.choice(sample.image_paths)
                negative_sample = self.random.choice(other_samples)
                negative_right = self.random.choice(negative_sample.image_paths)
                pairs.append((negative_left, negative_right, 0.0))

        self.random.shuffle(pairs)
        return pairs

    def __len__(self):
        return len(self.pairs)

    def _load_image(self, path: Path):
        image = Image.open(path).convert("RGB")
        return self.transform(image)

    def __getitem__(self, index):
        left_path, right_path, label = self.pairs[index]
        left_image = self._load_image(left_path)
        right_image = self._load_image(right_path)
        return {
            "image_a": left_image,
            "image_b": right_image,
            "label": label,
            "path_a": str(left_path),
            "path_b": str(right_path),
        }
