import sys
import json
import base64
import io
from pathlib import Path

import torch
from torchvision import models, transforms
from PIL import Image


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


# --------------------------------------------------
# Device
# --------------------------------------------------

device = torch.device("cpu")


# --------------------------------------------------
# Class mapping
# --------------------------------------------------

CLASS_NAMES = {
    0: "A",
    1: "B",
    2: "C"
}


# --------------------------------------------------
# Image preprocessing
# Same preprocessing used during training
# --------------------------------------------------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# --------------------------------------------------
# Load model
# --------------------------------------------------


def load_model(commodity):
    commodity = commodity.strip().lower()

    if commodity == "apple":
        model_path = MODEL_DIR / "apple_grade_model.pth"

    elif commodity == "tomato":
        model_path = MODEL_DIR / "tomato_grade_model.pth"

    elif commodity in ("dragonfruit", "dragon fruit"):
        model_path = MODEL_DIR / "dragonfruit_grade_model.pth"

    else:
        raise ValueError(
            f"Unsupported commodity: {commodity}. "
            "Supported commodities: apple, tomato, dragonfruit."
        )

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(
        model.classifier[1].in_features, 3
    )

    checkpoint = torch.load(
        model_path,
        map_location=device,
        weights_only=True
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.to(device)
    model.eval()

    return model


# --------------------------------------------------
# Decode image
# --------------------------------------------------

def decode_image(image_data):

    # Base64 data URL
    if image_data.startswith("data:image"):
        image_data = image_data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_data)

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        return image

    except Exception as e:
        raise ValueError(
            f"Could not decode image: {e}"
        )


# --------------------------------------------------
# Predict
# --------------------------------------------------

def predict(image_data, commodity):

    image = decode_image(image_data)

    model = load_model(commodity)

    # Preprocess
    input_tensor = transform(image)

    # Add batch dimension
    input_tensor = input_tensor.unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():

        outputs = model(input_tensor)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )[0]

    # Predicted class
    predicted_index = torch.argmax(
        probabilities
    ).item()

    grade = CLASS_NAMES[predicted_index]

    confidence = (
        probabilities[predicted_index].item() * 100
    )

    # All class probabilities
    probabilities_result = {
        "A": round(
            probabilities[0].item() * 100,
            2
        ),
        "B": round(
            probabilities[1].item() * 100,
            2
        ),
        "C": round(
            probabilities[2].item() * 100,
            2
        )
    }

    return {
        "commodity": commodity.capitalize(),
        "grade": grade,
        "confidence": round(confidence, 2),
        "probabilities": probabilities_result
    }


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():

    if len(sys.argv) < 2:
        print(
            json.dumps({
                "status": "error",
                "error": "No commodity provided"
            })
        )
        sys.exit(1)

    commodity = sys.argv[1]

    # Read image from stdin
    image_data = sys.stdin.read().strip()

    if not image_data:

        print(
            json.dumps({
                "status": "error",
                "error": "No image data provided"
            })
        )

        sys.exit(1)

    try:

        result = predict(
            image_data,
            commodity
        )

        result["status"] = "success"

        print(
            json.dumps(result)
        )

    except Exception as e:

        print(
            json.dumps({
                "status": "error",
                "error": str(e)
            })
        )

        sys.exit(1)

def predict_image_file(image_path, commodity):

    image = Image.open(image_path).convert("RGB")

    model = load_model(commodity)

    input_tensor = transform(image)
    input_tensor = input_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    predicted_index = torch.argmax(probabilities).item()

    return {
        "commodity": commodity.capitalize(),
        "grade": CLASS_NAMES[predicted_index],
        "confidence": round(
            probabilities[predicted_index].item() * 100, 2
        ),
        "probabilities": {
            "A": round(probabilities[0].item() * 100, 2),
            "B": round(probabilities[1].item() * 100, 2),
            "C": round(probabilities[2].item() * 100, 2)
        }
    }
if __name__ == "__main__":
    main()