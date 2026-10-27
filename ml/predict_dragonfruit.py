
from pathlib import Path
import sys

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

MODEL_PATH = Path("ml/models/dragonfruit_grade_model.pth")

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

CLASSES = ["Grade A", "Grade B", "Grade C"]


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH.resolve()}"
        )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True,
    )

    class_to_idx = checkpoint.get(
        "class_to_idx",
        {"grade_a": 0, "grade_b": 1, "grade_c": 2},
    )

    # Rebuild the same EfficientNet-B0 architecture.
    model = models.efficientnet_b0(weights=None)
    input_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(input_features, 3)

    state_dict = checkpoint.get(
        "model_state_dict", checkpoint
    )
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    idx_to_class = {
        index: name for name, index in class_to_idx.items()
    }

    return model, idx_to_class


def predict(image_path):
    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path.resolve()}"
        )

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    model, idx_to_class = load_model()

    with Image.open(image_path) as image:
        tensor = transform(
            image.convert("RGB")
        ).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        probabilities = torch.softmax(
            model(tensor), dim=1
        )[0]

    predicted_idx = int(probabilities.argmax().item())
    predicted_class = idx_to_class[predicted_idx]

    grade_mapping = {
        "grade_a": "A",
        "grade_b": "B",
        "grade_c": "C",
    }

    grade = grade_mapping[predicted_class.lower()]
    confidence = float(probabilities[predicted_idx].item())

    return {
        "commodity": "Dragon Fruit",
        "grade": grade,
        "confidence": round(confidence * 100, 2),
        "probabilities": {
            grade_mapping[idx_to_class[i].lower()]:
                round(float(probabilities[i].item()) * 100, 2)
            for i in range(len(probabilities))
        },
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            'Usage: python ml/predict_dragonfruit.py "path\\to\\image.jpg"'
        )
        sys.exit(1)

    try:
        result = predict(sys.argv[1])
        print(result)
    except Exception as exc:
        print(f"Prediction failed: {exc}", file=sys.stderr)
        sys.exit(1)
