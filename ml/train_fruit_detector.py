import copy
import time
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, WeightedRandomSampler

# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(r"D:\data-set\Fruit_Detection_Training")
DRAGONFRUIT_DATA_DIR = Path(r"D:\data-set\DragonFruit_Training")
MODEL_PATH = Path(__file__).resolve().parent / "models" / "fruit_detection_model.pth"

IMAGE_SIZE = 224
BATCH_SIZE = 16
NUM_EPOCHS = 3
LEARNING_RATE = 0.0001

torch.set_num_threads(2)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("=" * 60)
print("AGRISENSE AI - FRUIT DETECTION TRAINING")
print("=" * 60)

print(f"Device: {DEVICE}")
print(f"Dataset: {DATA_DIR}")
print(f"Model will be saved to: {MODEL_PATH}")


# ============================================================
# DATA TRANSFORMS
# ============================================================

train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(15),
    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


val_test_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


class FruitDetectionDataset(torch.utils.data.Dataset):
    def __init__(self, split, transform):
        fruit_dataset = datasets.ImageFolder(
            DATA_DIR / split,
            transform=transform
        )
        dragonfruit_dataset = datasets.ImageFolder(
            DRAGONFRUIT_DATA_DIR / split,
            transform=transform
        )

        if fruit_dataset.classes != ["apple", "other", "tomato"]:
            raise ValueError(
                f"Unexpected fruit detector classes: {fruit_dataset.classes}"
            )
        if dragonfruit_dataset.classes != ["grade_a", "grade_b", "grade_c"]:
            raise ValueError(
                "Dragon Fruit data must contain grade_a, grade_b, and "
                f"grade_c folders; found {dragonfruit_dataset.classes}"
            )

        self.fruit_dataset = fruit_dataset
        self.dragonfruit_dataset = dragonfruit_dataset
        self.classes = ["apple", "dragonfruit", "other", "tomato"]
        self.class_to_idx = {
            class_name: index
            for index, class_name in enumerate(self.classes)
        }
        self.targets = [
            self.class_to_idx[fruit_dataset.classes[target]]
            for target in fruit_dataset.targets
        ] + [
            self.class_to_idx["dragonfruit"]
            for _ in dragonfruit_dataset.targets
        ]

    def __len__(self):
        return len(self.targets)

    def __getitem__(self, index):
        if index < len(self.fruit_dataset):
            image, target = self.fruit_dataset[index]
            fruit_name = self.fruit_dataset.classes[target]
            return image, self.class_to_idx[fruit_name]

        image, _ = self.dragonfruit_dataset[
            index - len(self.fruit_dataset)
        ]
        return image, self.class_to_idx["dragonfruit"]


# ============================================================
# LOAD DATASETS
# ============================================================

train_dataset = FruitDetectionDataset("train", train_transform)
val_dataset = FruitDetectionDataset("val", val_test_transform)
test_dataset = FruitDetectionDataset("test", val_test_transform)


print("\nClasses:")
print(train_dataset.class_to_idx)

print("\nDataset sizes:")
print(f"Train: {len(train_dataset)}")
print(f"Validation: {len(val_dataset)}")
print(f"Test: {len(test_dataset)}")


# ============================================================
# DATALOADERS
# ============================================================

class_counts = torch.bincount(
    torch.tensor(train_dataset.targets),
    minlength=len(train_dataset.classes)
).float()
sample_weights = torch.tensor(
    [1.0 / class_counts[target] for target in train_dataset.targets],
    dtype=torch.double
)
train_sampler = WeightedRandomSampler(
    sample_weights,
    num_samples=len(train_dataset),
    replacement=True
)

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    sampler=train_sampler,
    num_workers=0
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)


# ============================================================
# MODEL
# ============================================================

print("\nLoading EfficientNet-B0...")

model = models.efficientnet_b0(weights=None)

# Replace classifier for all supported produce and the reject class.
num_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    num_features,
    len(train_dataset.classes)
)

# Reuse the existing fruit detector's learned features and known fruit
# output rows, while keeping a newly initialized Dragon Fruit output row.
checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=False
)
old_state = (
    checkpoint["model_state_dict"]
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint
    else checkpoint
)
old_classes = (
    checkpoint.get("classes", ["apple", "other", "tomato"])
    if isinstance(checkpoint, dict)
    else ["apple", "other", "tomato"]
)
model_state = model.state_dict()
for key, value in old_state.items():
    if key in model_state and model_state[key].shape == value.shape:
        model_state[key] = value
model.load_state_dict(model_state)

old_class_to_idx = {
    class_name: index for index, class_name in enumerate(old_classes)
}
with torch.no_grad():
    for class_name in ("apple", "other", "tomato"):
        old_index = old_class_to_idx[class_name]
        new_index = train_dataset.class_to_idx[class_name]
        model.classifier[1].weight[new_index].copy_(
            old_state["classifier.1.weight"][old_index]
        )
        model.classifier[1].bias[new_index].copy_(
            old_state["classifier.1.bias"][old_index]
        )

model = model.to(DEVICE)


# ============================================================
# LOSS + OPTIMIZER
# ============================================================

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# ============================================================
# TRAINING FUNCTIONS
# ============================================================

def train_one_epoch(model, loader, criterion, optimizer):

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs, labels)

        loss.backward()

        optimizer.step()

        running_loss += loss.item() * images.size(0)

        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)

        correct += (predicted == labels).sum().item()

    epoch_loss = running_loss / total
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy


def validate(model, loader, criterion):

    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)

            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)

            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)

            correct += (predicted == labels).sum().item()

    epoch_loss = running_loss / total
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy


# ============================================================
# TRAIN
# ============================================================

best_val_accuracy = 0.0
best_model_weights = copy.deepcopy(model.state_dict())

print("\nStarting training...")
print("=" * 60)

start_time = time.time()

for epoch in range(NUM_EPOCHS):

    epoch_start = time.time()

    train_loss, train_accuracy = train_one_epoch(
        model,
        train_loader,
        criterion,
        optimizer
    )

    val_loss, val_accuracy = validate(
        model,
        val_loader,
        criterion
    )

    epoch_time = time.time() - epoch_start

    print(
        f"Epoch [{epoch + 1}/{NUM_EPOCHS}] "
        f"| Train Loss: {train_loss:.4f} "
        f"| Train Acc: {train_accuracy * 100:.2f}% "
        f"| Val Loss: {val_loss:.4f} "
        f"| Val Acc: {val_accuracy * 100:.2f}% "
        f"| Time: {epoch_time:.1f}s"
    )

    if val_accuracy > best_val_accuracy:

        best_val_accuracy = val_accuracy

        best_model_weights = copy.deepcopy(
            model.state_dict()
        )

        print(
            f"  New best validation accuracy: "
            f"{best_val_accuracy * 100:.2f}%"
        )


# ============================================================
# RESTORE BEST MODEL
# ============================================================

model.load_state_dict(best_model_weights)

total_time = time.time() - start_time

print("\n" + "=" * 60)
print("TRAINING COMPLETED")
print("=" * 60)

print(
    f"Best Validation Accuracy: "
    f"{best_val_accuracy * 100:.2f}%"
)

print(
    f"Total Training Time: "
    f"{total_time / 60:.2f} minutes"
)


# ============================================================
# TEST
# ============================================================

test_loss, test_accuracy = validate(
    model,
    test_loader,
    criterion
)

print("\nTEST RESULTS")
print("-" * 60)

print(f"Test Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy * 100:.2f}%")


# ============================================================
# SAVE MODEL
# ============================================================

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

torch.save(
    {
        "model_state_dict": model.state_dict(),
        "class_to_idx": train_dataset.class_to_idx,
        "classes": train_dataset.classes,
        "image_size": IMAGE_SIZE
    },
    MODEL_PATH
)

print("\n" + "=" * 60)
print("MODEL SAVED SUCCESSFULLY")
print("=" * 60)

print(MODEL_PATH)

print("\nClasses:")
print(train_dataset.classes)