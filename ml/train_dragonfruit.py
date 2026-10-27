import copy
from pathlib import Path
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B0_Weights
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = Path(r"D:\data-set\DragonFruit_Training")
MODEL_PATH = BASE_DIR / "ml" / "models" / "dragonfruit_grade_model.pth"
IMAGE_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 15
LEARNING_RATE = 0.0001
SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("AGRISENSE AI - DRAGON FRUIT GRADE TRAINING")
print("Device:", DEVICE)

train_tf = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.10, contrast=0.10, saturation=0.10),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
eval_tf = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

train_ds = datasets.ImageFolder(DATASET_PATH / "train", transform=train_tf)
val_ds = datasets.ImageFolder(DATASET_PATH / "val", transform=eval_tf)
test_ds = datasets.ImageFolder(DATASET_PATH / "test", transform=eval_tf)
expected = ["grade_a", "grade_b", "grade_c"]
if train_ds.classes != expected:
    raise ValueError(f"Expected folders {expected}, found {train_ds.classes}")
if val_ds.class_to_idx != train_ds.class_to_idx or test_ds.class_to_idx != train_ds.class_to_idx:
    raise ValueError("Train/val/test class mappings must match")
if min(len(train_ds), len(val_ds), len(test_ds)) == 0:
    raise ValueError("One or more data splits are empty")
print("Class mapping:", train_ds.class_to_idx)
print(f"Train={len(train_ds)} | Val={len(val_ds)} | Test={len(test_ds)}")
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

try:
    model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
except Exception as exc:
    raise RuntimeError("Pretrained EfficientNet-B0 weights could not be downloaded. Check internet access.") from exc
model.classifier[1] = nn.Linear(model.classifier[1].in_features, 3)
model.to(DEVICE)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
best_acc = -1.0
best_state = copy.deepcopy(model.state_dict())

for epoch in range(EPOCHS):
    model.train(); total_loss = 0.0; correct = 0; total = 0
    for images, labels in train_loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad(); outputs = model(images); loss = criterion(outputs, labels)
        loss.backward(); optimizer.step()
        total_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item(); total += labels.size(0)
    train_loss = total_loss / total; train_acc = correct / total
    model.eval(); val_loss_sum = 0.0; val_correct = 0; val_total = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images); loss = criterion(outputs, labels)
            val_loss_sum += loss.item() * images.size(0)
            val_correct += (outputs.argmax(1) == labels).sum().item(); val_total += labels.size(0)
    val_loss = val_loss_sum / val_total; val_acc = val_correct / val_total
    print(f"Epoch [{epoch+1}/{EPOCHS}] Train Loss {train_loss:.4f} Acc {train_acc:.2%} | Val Loss {val_loss:.4f} Acc {val_acc:.2%}")
    if val_acc > best_acc:
        best_acc = val_acc; best_state = copy.deepcopy(model.state_dict())
        torch.save({"model_state_dict": best_state, "class_to_idx": train_ds.class_to_idx,
                    "image_size": IMAGE_SIZE, "architecture": "efficientnet_b0"}, MODEL_PATH)
        print("Saved best model:", MODEL_PATH)

model.load_state_dict(best_state); model.eval(); y_true=[]; y_pred=[]
with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images.to(DEVICE))
        y_pred.extend(outputs.argmax(1).cpu().tolist()); y_true.extend(labels.tolist())
print("\nTEST REPORT")
print(classification_report(y_true, y_pred, labels=[0,1,2], target_names=["Grade A", "Grade B", "Grade C"], zero_division=0))
print("Confusion matrix:\n", confusion_matrix(y_true, y_pred, labels=[0,1,2]))
print(f"Best validation accuracy: {best_acc:.2%}")
print("Model saved to:", MODEL_PATH)
