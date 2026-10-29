#!/usr/bin/env python3

import sys
import json
import base64
import io
import os
from pathlib import Path

# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from torchvision import models, transforms
# pyrefly: ignore [missing-import]
from PIL import Image


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "ml" / "models"

APPLE_MODEL_PATH = MODEL_DIR / "apple_grade_model.pth"
TOMATO_MODEL_PATH = MODEL_DIR / "tomato_grade_model.pth"
DRAGONFRUIT_MODEL_PATH = MODEL_DIR / "dragonfruit_grade_model.pth"

FRUIT_DETECTION_MODEL_PATH = MODEL_DIR / "fruit_detection_model.pth"

# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device("cpu")


# ============================================================
# GRADE CLASS MAPPING
# ============================================================

GRADE_CLASS_NAMES = {
    0: "A",
    1: "B",
    2: "C"
}


# ============================================================
# FRUIT DETECTION CLASS MAPPING
# ============================================================

FRUIT_CLASSES = [
    "apple",
    "other",
    "tomato"
]

FRUIT_DISPLAY_NAMES = {
    "apple": "Apple",
    "other": "Other",
    "tomato": "Tomato",
    "dragonfruit": "Dragon Fruit"
}

MIN_FRUIT_DETECTION_CONFIDENCE = 80.0
MIN_FRUIT_DETECTION_MARGIN = 20.0
MIN_IMAGE_COLOR_VARIATION = 8.0
MAX_IMAGE_NEIGHBOR_DIFFERENCE = 45.0


# ============================================================
# IMAGE TRANSFORM
# ============================================================

IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# CREATE EFFICIENTNET MODEL
# ============================================================

def create_model(num_classes=3):

    model = models.efficientnet_b0(weights=None)

    model.classifier[1] = torch.nn.Linear(
        model.classifier[1].in_features,
        num_classes
    )

    return model


# ============================================================
# LOAD GRADE MODEL
# ============================================================


def load_grade_model(commodity):
    commodity = commodity.lower().strip()

    if commodity == "apple":
        model_path = APPLE_MODEL_PATH
    elif commodity == "tomato":
        model_path = TOMATO_MODEL_PATH
    elif commodity in ["dragonfruit", "dragon fruit"]:
        model_path = DRAGONFRUIT_MODEL_PATH
    else:
        raise ValueError(
            f"Unsupported grading commodity: {commodity}"
        )

    if not model_path.exists():
        raise FileNotFoundError(
            f"Grade model not found: {model_path}"
        )

    model = create_model(3)

    checkpoint = torch.load(
        model_path,
        map_location=DEVICE,
        weights_only=False
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.to(DEVICE)
    model.eval()

    return model


# ============================================================
# LOAD FRUIT DETECTION MODEL
# ============================================================

def load_fruit_detection_model():

    if not FRUIT_DETECTION_MODEL_PATH.exists():

        raise FileNotFoundError(
            f"Fruit detection model not found: "
            f"{FRUIT_DETECTION_MODEL_PATH}"
        )

    checkpoint = torch.load(
        FRUIT_DETECTION_MODEL_PATH,
        map_location=DEVICE,
        weights_only=False
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint

    classes = (
        checkpoint.get("classes", FRUIT_CLASSES)
        if isinstance(checkpoint, dict)
        else FRUIT_CLASSES
    )
    if len(classes) != state_dict["classifier.1.weight"].shape[0]:
        raise ValueError(
            "Fruit detector class metadata does not match its output layer."
        )

    model = create_model(len(classes))
    model.load_state_dict(state_dict)

    model.to(DEVICE)
    model.eval()

    return model, classes


# ============================================================
# DECODE IMAGE
# ============================================================

def decode_image(raw_data):

    if not raw_data:
        raise ValueError(
            "No image data received"
        )

    if raw_data.startswith("data:image"):

        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]

    try:

        image_bytes = base64.b64decode(raw_data)

    except Exception as e:

        raise ValueError(
            f"Invalid base64 image data: {e}"
        )

    try:

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except Exception as e:

        raise ValueError(
            f"Could not open image: {e}"
        )

    return image


# ============================================================
# DETECT FRUIT
# ============================================================

def detect_fruit(image):

    model, classes = load_fruit_detection_model()

    image_sample = np.asarray(
        image.convert("RGB").resize((224, 224)),
        dtype=np.float32
    )
    color_variation = float(image_sample.std())
    neighbor_difference = float(
        (
            np.abs(image_sample[:, 1:] - image_sample[:, :-1]).mean()
            + np.abs(image_sample[1:, :] - image_sample[:-1, :]).mean()
        ) / 2
    )

    image_tensor = IMAGE_TRANSFORM(
        image
    ).unsqueeze(0).to(DEVICE)

    with torch.no_grad():

        outputs = model(
            image_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )[0]

    predicted_index = torch.argmax(
        probabilities
    ).item()

    detected_fruit = classes[predicted_index]
    sorted_probabilities = torch.sort(
        probabilities,
        descending=True
    ).values
    confidence = float(sorted_probabilities[0].item() * 100)
    confidence_margin = float(
        (sorted_probabilities[0] - sorted_probabilities[1]).item() * 100
    )
    image_quality_ok = (
        color_variation >= MIN_IMAGE_COLOR_VARIATION
        and neighbor_difference <= MAX_IMAGE_NEIGHBOR_DIFFERENCE
    )
    is_supported = (
        image_quality_ok
        and detected_fruit != "other"
        and confidence >= MIN_FRUIT_DETECTION_CONFIDENCE
        and confidence_margin >= MIN_FRUIT_DETECTION_MARGIN
    )

    fruit_probabilities = {
        FRUIT_DISPLAY_NAMES.get(class_name, class_name.title()): round(
            probabilities[index].item() * 100,
            2
        )
        for index, class_name in enumerate(classes)
    }

    return {

        "fruit": detected_fruit,

        "confidence": round(
            confidence,
            2
        ),

        "confidence_margin": round(
            confidence_margin,
            2
        ),

        "is_supported": is_supported,

        "image_quality": {
            "color_variation": round(color_variation, 2),
            "neighbor_difference": round(neighbor_difference, 2),
            "passes_basic_checks": image_quality_ok
        },

        "probabilities": fruit_probabilities
    }


# ============================================================
# PREDICT GRADE
# ============================================================

def predict_grade(image, commodity):

    model = load_grade_model(
        commodity
    )

    image_tensor = IMAGE_TRANSFORM(
        image
    ).unsqueeze(0).to(DEVICE)

    with torch.no_grad():

        outputs = model(
            image_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )[0]

    predicted_index = torch.argmax(
        probabilities
    ).item()

    predicted_grade = GRADE_CLASS_NAMES[
        predicted_index
    ]

    probability_a = (
        probabilities[0].item() * 100
    )

    probability_b = (
        probabilities[1].item() * 100
    )

    probability_c = (
        probabilities[2].item() * 100
    )

    confidence = (
        probabilities[
            predicted_index
        ].item() * 100
    )

    return {

        "grade": predicted_grade,

        "confidence": round(
            confidence,
            2
        ),

        "probabilities": {

            "A": round(
                probability_a,
                2
            ),

            "B": round(
                probability_b,
                2
            ),

            "C": round(
                probability_c,
                2
            )
        }
    }


# ============================================================
# QUALITY SCORE
# ============================================================

def calculate_quality_score(probabilities):

    a = probabilities["A"]
    b = probabilities["B"]
    c = probabilities["C"]

    score = (
        a * 1.0
        + b * 0.70
        + c * 0.40
    )

    return round(
        max(
            0,
            min(
                100,
                score
            )
        ),
        1
    )


# ============================================================
# GRADE LABEL
# ============================================================

def get_grade_label(grade):

    if grade == "A":
        return "High Quality"

    if grade == "B":
        return "Standard Quality"

    return "Needs Sorting"


# ============================================================
# SHELF LIFE
# ============================================================

def get_shelf_life(
    commodity,
    grade
):

    if commodity == "tomato":

        if grade == "A":
            return "5 - 7 Days"

        if grade == "B":
            return "3 - 4 Days"

        return "1 - 2 Days"

    if grade == "A":
        return "14 - 21 Days"

    if grade == "B":
        return "7 - 10 Days"

    return "3 - 5 Days"


# ============================================================
# GENERATE METRICS
# ============================================================

def generate_metrics(probabilities):

    a = probabilities["A"]
    b = probabilities["B"]
    c = probabilities["C"]

    # Overall quality tendency
    quality_strength = (
        a * 1.0
        + b * 0.70
        + c * 0.40
    )

    quality_strength = max(
        0,
        min(
            100,
            quality_strength
        )
    )

    # --------------------------------------------------------
    # Positive quality metrics
    # Higher = better
    # --------------------------------------------------------

    freshness = round(
        quality_strength,
        1
    )

    color = round(
        max(
            20,
            min(
                100,
                quality_strength + (a - c) * 0.20
            )
        ),
        1
    )

    shape_consistency = round(
        max(
            20,
            min(
                100,
                quality_strength + (a - c) * 0.15
            )
        ),
        1
    )

    # --------------------------------------------------------
    # Defect metrics
    # Lower = better
    # --------------------------------------------------------

    visible_defects = round(
        max(
            0,
            min(
                100,
                100 - quality_strength
            )
        ),
        1
    )

    bruising = round(
        max(
            0,
            min(
                100,
                (100 - quality_strength) * 0.80
            )
        ),
        1
    )

    return {

        "freshness": freshness,

        "color": color,

        "visible_defects": visible_defects,

        "bruising": bruising,

        "shape_consistency": shape_consistency
    }


# ============================================================
# DYNAMIC DESCRIPTION
# ============================================================

def generate_dynamic_description(
    commodity,
    grade,
    freshness,
    color,
    visible_defects,
    bruising,
    shape_consistency
):

    fruit = commodity.lower()

    # ========================================================
    # Identify strongest and weakest characteristics
    # ========================================================

    positive_metrics = {
        "freshness": freshness,
        "color development": color,
        "shape consistency": shape_consistency
    }

    negative_metrics = {
        "visible surface defects": visible_defects,
        "bruising": bruising
    }

    strongest = max(
        positive_metrics,
        key=positive_metrics.get
    )

    weakest_positive = min(
        positive_metrics,
        key=positive_metrics.get
    )

    highest_problem = max(
        negative_metrics,
        key=negative_metrics.get
    )

    highest_problem_value = negative_metrics[
        highest_problem
    ]

    # ========================================================
    # Grade A
    # ========================================================

    if grade == "A":

        if highest_problem_value < 20:

            return (
                f"The {fruit} shows strong overall condition, "
                f"particularly in {strongest}, with limited visible "
                f"quality concerns. The freshness, appearance and "
                f"physical characteristics are consistent with "
                f"Grade A quality."
            )

        return (
            f"The {fruit} demonstrates good overall quality, "
            f"with {strongest} being one of its stronger "
            f"characteristics. Some {highest_problem} are present, "
            f"but the overall condition remains consistent with "
            f"Grade A quality."
        )

    # ========================================================
    # Grade B
    # ========================================================

    if grade == "B":

        if highest_problem_value >= 50:

            return (
                f"The {fruit} shows acceptable overall quality, "
                f"with {strongest} providing a positive characteristic. "
                f"However, {highest_problem} are relatively noticeable. "
                f"The combination of these characteristics is "
                f"consistent with Grade B quality."
            )

        if positive_metrics[weakest_positive] < 55:

            return (
                f"The {fruit} has a generally acceptable appearance, "
                f"although {weakest_positive} is comparatively reduced. "
                f"Other characteristics remain within an acceptable "
                f"range, supporting the Grade B classification."
            )

        return (
            f"The {fruit} presents a balanced quality profile with "
            f"good {strongest} and generally acceptable physical "
            f"characteristics. The overall condition is consistent "
            f"with Grade B quality."
        )

    # ========================================================
    # Grade C
    # ========================================================

    if grade == "C":

        # Find the two most important weaknesses
        weaknesses = []

        if freshness < 50:
            weaknesses.append(
                "reduced freshness"
            )

        if color < 50:
            weaknesses.append(
                "weak color development"
            )

        if visible_defects >= 50:
            weaknesses.append(
                "noticeable surface defects"
            )

        if bruising >= 50:
            weaknesses.append(
                "significant bruising"
            )

        if shape_consistency < 50:
            weaknesses.append(
                "low shape consistency"
            )

        # ----------------------------------------------------
        # Several significant weaknesses
        # ----------------------------------------------------

        if len(weaknesses) >= 3:

            return (
                f"The {fruit} shows {weaknesses[0]}, "
                f"{weaknesses[1]}, and {weaknesses[2]}. "
                f"These characteristics indicate reduced overall "
                f"quality and are consistent with Grade C. "
                f"The sample may require sorting before further use."
            )

        # ----------------------------------------------------
        # Two significant weaknesses
        # ----------------------------------------------------

        if len(weaknesses) == 2:

            return (
                f"The {fruit} shows {weaknesses[0]} together with "
                f"{weaknesses[1]}. These characteristics indicate "
                f"reduced overall quality consistent with Grade C "
                f"and suggest that sorting may be required."
            )

        # ----------------------------------------------------
        # One significant weakness
        # ----------------------------------------------------

        if len(weaknesses) == 1:

            return (
                f"The {fruit} retains some acceptable characteristics, "
                f"but shows {weaknesses[0]}. This reduced condition is "
                f"consistent with Grade C quality and may require "
                f"sorting."
            )

        # ----------------------------------------------------
        # Fallback
        # ----------------------------------------------------

        return (
            f"The {fruit} has been classified as Grade C based on "
            f"the overall characteristics detected by the trained "
            f"classification model."
        )

    # ========================================================
    # Unknown grade
    # ========================================================

    return (
        f"The {fruit} was classified as Grade {grade} based on "
        f"the trained classification model."
    )
# ============================================================
# MAIN GRADING PIPELINE
# ============================================================

def run_grading_pipeline(
    image_data,
    commodity_hint="auto",
    district="Kolhapur"
):

    image = decode_image(
        image_data
    )

    commodity = (
        commodity_hint
        or "auto"
    ).lower().strip()

    detection = detect_fruit(image)
    detected_fruit = detection["fruit"]
    supported_commodities = [
        "apple",
        "tomato",
        "dragonfruit",
        "dragon fruit"
    ]

    if not detection["is_supported"]:
        return {
            "status": "rejected",
            "commodity": "Other",
            "grade": None,
            "confidence": detection["confidence"],
            "message": (
                "The image is unsupported or could not be confidently "
                "identified as a clear supported fruit. Please upload a "
                "clear Apple, Tomato, or Dragon Fruit image."
            ),
            "fruit_detection": detection,
            "technical_inspection": {
                "pipeline": (
                    "Fruit Detection → "
                    "Unsupported or Low-Confidence Rejection"
                ),
                "model": "fruit_detection_model.pth",
                "image_resolution": f"{image.width}x{image.height}"
            }
        }

    if commodity == "auto":
        commodity = detected_fruit
    elif commodity not in supported_commodities:
        raise ValueError(
            "Unsupported commodity. "
            "Use auto, Apple, Tomato, or Dragon Fruit."
        )
    elif commodity != detected_fruit:
        return {
            "status": "rejected",
            "commodity": "Other",
            "grade": None,
            "confidence": detection["confidence"],
            "message": (
                f"The image appears to contain "
                f"{FRUIT_DISPLAY_NAMES.get(detected_fruit, detected_fruit)}, "
                f"not {FRUIT_DISPLAY_NAMES.get(commodity, commodity)}. "
                "Select the detected fruit or use Auto Detect."
            ),
            "fruit_detection": detection,
            "technical_inspection": {
                "pipeline": "Fruit Detection → Commodity Mismatch Rejection",
                "model": "fruit_detection_model.pth",
                "image_resolution": f"{image.width}x{image.height}"
            }
        }

    # ========================================================
    # GRADE PREDICTION
    # ========================================================

    prediction = predict_grade(
        image,
        commodity
    )

    grade = prediction[
        "grade"
    ]

    confidence = prediction[
        "confidence"
    ]

    probabilities = prediction[
        "probabilities"
    ]

    # ========================================================
    # QUALITY INFORMATION
    # ========================================================

    quality_score = calculate_quality_score(
        probabilities
    )

    grade_label = get_grade_label(
        grade
    )

    # Generate all metrics
    metrics = generate_metrics(
        probabilities
    )

    # Extract metrics for description
    freshness = metrics[
        "freshness"
    ]

    color = metrics[
        "color"
    ]

    visible_defects = metrics[
        "visible_defects"
    ]

    bruising = metrics[
        "bruising"
    ]

    shape_consistency = metrics[
        "shape_consistency"
    ]

    # ========================================================
    # DYNAMIC DESCRIPTION
    # ========================================================

    description = generate_dynamic_description(

        commodity=commodity,

        grade=grade,

        freshness=freshness,

        color=color,

        visible_defects=visible_defects,

        bruising=bruising,

        shape_consistency=shape_consistency
    )

    # ========================================================
    # SHELF LIFE
    # ========================================================

    shelf_life = get_shelf_life(
        commodity,
        grade
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    result = {

        "status": "success",

        "commodity": FRUIT_DISPLAY_NAMES.get(
            commodity,
            commodity.title()
        ),

       "variety": {
    "apple": "Apple",
    "tomato": "Tomato",
    "dragonfruit": "Dragon Fruit",
    "dragon fruit": "Dragon Fruit"
}.get(commodity, commodity.title()),

        "grade": grade,

        "grade_label": grade_label,

        "quality_score": quality_score,

        "max_score": 100,

        "metrics": metrics,

        "shelf_life": shelf_life,

        "confidence": confidence,

        "description": description,

        "model_probabilities": probabilities,

        "technical_inspection": {

            "pipeline": (
                "Fruit Detection → "
                "EfficientNet-B0 Grade Classification"
            ),

            "fruit_detection_model": (
                "fruit_detection_model.pth"
            ),

           "grade_model": {
    "apple": "apple_grade_model.pth",
    "tomato": "tomato_grade_model.pth",
    "dragonfruit": "dragonfruit_grade_model.pth",
    "dragon fruit": "dragonfruit_grade_model.pth"
}.get(commodity, "unknown"),

            "image_resolution": (
                f"{image.width}x{image.height}"
            )
        },

        "market_price_summary": {

            "district": district,

            "note": (
                "Market price data is supplied "
                "by the application and is not "
                "predicted by the ML model."
            )
        }
    }

    result["fruit_detection"] = detection

    return result


# ============================================================
# MAIN
# ============================================================

def main():

    try:

        input_data = sys.stdin.read().strip()

        if not input_data:

            raise ValueError(
                "No image data received from Node.js."
            )

        commodity = os.environ.get(
            "AGRISENSE_COMMODITY",
            "auto"
        )

        district = os.environ.get(
            "AGRISENSE_DISTRICT",
            "Kolhapur"
        )

        result = run_grading_pipeline(
            input_data,
            commodity,
            district
        )

        print(
            json.dumps(
                result,
                ensure_ascii=False
            )
        )

    except Exception as e:

        error_response = {

            "status": "error",

            "error": str(e),

            "confidence": 0.0
        }

        print(
            json.dumps(
                error_response,
                ensure_ascii=False
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()