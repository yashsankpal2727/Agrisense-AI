from pathlib import Path
import shutil
import random

# Source and destination
SOURCE = Path(r"D:\data-set\Fruit_Detection")
DEST = Path(r"D:\data-set\Fruit_Detection_Training")

CLASSES = ["apple", "tomato", "other"]
EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

random.seed(42)

# Create folders
for split in ["train", "val", "test"]:
    for class_name in CLASSES:
        (DEST / split / class_name).mkdir(parents=True, exist_ok=True)

# Split each class
for class_name in CLASSES:

    source_folder = SOURCE / class_name

    images = [
        f for f in source_folder.rglob("*")
        if f.is_file() and f.suffix.lower() in EXTENSIONS
    ]

    random.shuffle(images)

    total = len(images)

    train_end = int(total * 0.70)
    val_end = int(total * 0.85)

    train_images = images[:train_end]
    val_images = images[train_end:val_end]
    test_images = images[val_end:]

    print(f"\n{class_name.upper()}")
    print(f"Total: {total}")
    print(f"Train: {len(train_images)}")
    print(f"Validation: {len(val_images)}")
    print(f"Test: {len(test_images)}")

    # Copy files
    for image in train_images:
        shutil.copy2(
            image,
            DEST / "train" / class_name / image.name
        )

    for image in val_images:
        shutil.copy2(
            image,
            DEST / "val" / class_name / image.name
        )

    for image in test_images:
        shutil.copy2(
            image,
            DEST / "test" / class_name / image.name
        )

print("\n===================================")
print("Dataset split completed successfully!")
print("===================================")