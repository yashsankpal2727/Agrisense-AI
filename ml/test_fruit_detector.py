from pathlib import Path
import torch
from PIL import Image
from torchvision import transforms, models
import torch.nn as nn


# ============================================================
# MODEL PATH
# ============================================================

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "fruit_detection_model.pth"
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ============================================================
# LOAD MODEL
# ============================================================

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=False
)

classes = checkpoint["classes"]

print("Classes:", classes)

model = models.efficientnet_b0(weights=None)

num_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    num_features,
    len(classes)
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(DEVICE)
model.eval()


# ============================================================
# IMAGE TRANSFORM
# ============================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict(image_path):

    image_path = Path(image_path)

    image = Image.open(image_path).convert("RGB")

    image_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():

        output = model(image_tensor)

        probabilities = torch.softmax(output, dim=1)

        confidence, predicted = torch.max(
            probabilities,
            dim=1
        )

    predicted_class = classes[predicted.item()]

    confidence = confidence.item() * 100

    print("\n----------------------------------------")
    print("Image:", image_path.name)
    print("Prediction:", predicted_class)
    print(f"Confidence: {confidence:.2f}%")

    print("\nProbabilities:")

    for class_name, probability in zip(
        classes,
        probabilities[0]
    ):
        print(
            f"  {class_name}: "
            f"{probability.item() * 100:.2f}%"
        )

    print("----------------------------------------")


# ============================================================
# TEST IMAGE
# ============================================================

image_path = input(
    "\nEnter the full path of an image: "
).strip().strip('"')

predict(image_path)