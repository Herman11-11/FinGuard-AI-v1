from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = PROJECT_ROOT / "ml" / "data"
RAW_DATA_DIR = DATA_ROOT / "raw"
PROCESSED_DATA_DIR = DATA_ROOT / "processed"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
LOGS_DIR = PROJECT_ROOT / "ml" / "logs"


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


MODEL_NAME = "resnet18"
EMBEDDING_DIM = 128
IMAGE_SIZE = 224
BATCH_SIZE = 8
NUM_EPOCHS = 10
LEARNING_RATE = 1e-4
TRAIN_SPLIT = 0.8
SEED = 42
