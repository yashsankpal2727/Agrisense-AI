import os
import copy
import torch
import torch.nn as nn

from torchvision import datasets, transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from torch.utils.data import DataLoader

from sklearn.metrics import classification_report, confusion_matrix


# ============================================================
# CONFIGURATION
# ============================================================

DATASET_PATH = r"D:\data-set\Apple_Training"

MODEL_DIR = r"D:\OneDrive\Desktop\Aggre2\ml\models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "apple_grade_model.pth"
)

IMAGE_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 15
LEARNING_RATE = 0.0001


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("=" * 60)
print("APPLE GRADE CLASSIFICATION")
print("=" * 60)

print("Device:", DEVICE)

if torch.cuda.is_available():
    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )


# ============================================================
# CREATE MODEL DIRECTORY
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# IMAGE TRANSFORMS
# ============================================================

train_transform = transforms.Compose([

    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.RandomHorizontalFlip(),

    transforms.RandomRotation(15),

    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),

    transforms.RandomResizedCrop(
        IMAGE_SIZE,
        scale=(0.8, 1.0)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


validation_transform = transforms.Compose([

    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# DATASET PATHS
# ============================================================

train_path = os.path.join(
    DATASET_PATH,
    "train"
)

validation_path = os.path.join(
    DATASET_PATH,
    "validation"
)

test_path = os.path.join(
    DATASET_PATH,
    "test"
)


# ============================================================
# LOAD DATASETS
# ============================================================

print("\nLoading datasets...")


train_dataset = datasets.ImageFolder(
    train_path,
    transform=train_transform
)


validation_dataset = datasets.ImageFolder(
    validation_path,
    transform=validation_transform
)


test_dataset = datasets.ImageFolder(
    test_path,
    transform=validation_transform
)


print("\nClass mapping:")

print(
    train_dataset.class_to_idx
)


print("\nDataset sizes:")

print(
    "Training:",
    len(train_dataset)
)

print(
    "Validation:",
    len(validation_dataset)
)

print(
    "Testing:",
    len(test_dataset)
)


# ============================================================
# DATA LOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0
)


validation_loader = DataLoader(
    validation_dataset,
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
# LOAD EFFICIENTNET-B0
# ============================================================

print("\nLoading EfficientNet-B0...")


weights = EfficientNet_B0_Weights.DEFAULT


model = efficientnet_b0(
    weights=weights
)


# ============================================================
# CHANGE FINAL LAYER
# ============================================================

NUMBER_OF_CLASSES = 3


model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    NUMBER_OF_CLASSES
)


model = model.to(DEVICE)


# ============================================================
# LOSS FUNCTION
# ============================================================

criterion = nn.CrossEntropyLoss()


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=0.0001
)


# ============================================================
# TRAINING VARIABLES
# ============================================================

best_validation_accuracy = 0.0

best_model_weights = copy.deepcopy(
    model.state_dict()
)


# ============================================================
# TRAINING
# ============================================================

print("\nStarting training...")

print("=" * 60)


for epoch in range(EPOCHS):

    # --------------------------------------------------------
    # TRAINING
    # --------------------------------------------------------

    model.train()

    running_loss = 0.0

    correct = 0

    total = 0


    for images, labels in train_loader:

        images = images.to(DEVICE)

        labels = labels.to(DEVICE)


        optimizer.zero_grad()


        outputs = model(images)


        loss = criterion(
            outputs,
            labels
        )


        loss.backward()


        optimizer.step()


        running_loss += loss.item()


        predictions = torch.argmax(
            outputs,
            dim=1
        )


        total += labels.size(0)


        correct += (
            predictions == labels
        ).sum().item()


    train_accuracy = (
        correct / total
    ) * 100


    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    model.eval()

    validation_correct = 0

    validation_total = 0

    validation_loss = 0.0


    with torch.no_grad():

        for images, labels in validation_loader:

            images = images.to(DEVICE)

            labels = labels.to(DEVICE)


            outputs = model(images)


            loss = criterion(
                outputs,
                labels
            )


            validation_loss += loss.item()


            predictions = torch.argmax(
                outputs,
                dim=1
            )


            validation_total += labels.size(0)


            validation_correct += (
                predictions == labels
            ).sum().item()


    validation_accuracy = (
        validation_correct /
        validation_total
    ) * 100


    # --------------------------------------------------------
    # PRINT RESULTS
    # --------------------------------------------------------

    print(
        f"Epoch [{epoch + 1}/{EPOCHS}] | "
        f"Train Loss: "
        f"{running_loss / len(train_loader):.4f} | "
        f"Train Acc: "
        f"{train_accuracy:.2f}% | "
        f"Val Loss: "
        f"{validation_loss / len(validation_loader):.4f} | "
        f"Val Acc: "
        f"{validation_accuracy:.2f}%"
    )


    # --------------------------------------------------------
    # SAVE BEST MODEL
    # --------------------------------------------------------

    if validation_accuracy > best_validation_accuracy:

        best_validation_accuracy = (
            validation_accuracy
        )


        best_model_weights = copy.deepcopy(
            model.state_dict()
        )


        torch.save(
            model.state_dict(),
            MODEL_PATH
        )


        print(
            f"  Best model saved! "
            f"Validation Accuracy: "
            f"{validation_accuracy:.2f}%"
        )


# ============================================================
# LOAD BEST MODEL
# ============================================================

print("\nLoading best model...")


model.load_state_dict(
    best_model_weights
)


# ============================================================
# TEST
# ============================================================

print("\nTesting model...")

print("=" * 60)


model.eval()


all_predictions = []

all_labels = []


with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(DEVICE)


        outputs = model(images)


        predictions = torch.argmax(
            outputs,
            dim=1
        )


        all_predictions.extend(
            predictions.cpu().numpy()
        )


        all_labels.extend(
            labels.numpy()
        )


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

class_names = [
    "Grade A",
    "Grade B",
    "Grade C"
]


print("\nClassification Report:")


print(
    classification_report(
        all_labels,
        all_predictions,
        target_names=class_names,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")


cm = confusion_matrix(
    all_labels,
    all_predictions
)


print(cm)


# ============================================================
# FINISHED
# ============================================================

print("\n" + "=" * 60)

print("TRAINING COMPLETED!")

print(
    "Best Validation Accuracy:",
    f"{best_validation_accuracy:.2f}%"
)

print(
    "Model saved at:"
)

print(
    MODEL_PATH
)

print("=" * 60)