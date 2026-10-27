
from pathlib import Path
from collections import Counter
import random
import shutil

SOURCE = Path(r"D:\data-set\original_dataset\dragonfruit")
DEST = Path(r"D:\data-set\DragonFruit_Training")

EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
SEED = 42

SOURCE_LABELS = {
    "grade_a": ["grade_a", "grade a", "a", "good"],
    "grade_b": ["grade_b", "grade b", "b", "medium"],
    "grade_c": ["grade_c", "grade c", "c", "bad"],
}

if not SOURCE.exists():
    raise FileNotFoundError(f"Dataset source not found: {SOURCE}")

found = {}

for target, aliases in SOURCE_LABELS.items():
    folders = [
        p for p in SOURCE.iterdir()
        if p.is_dir() and p.name.lower() in aliases
    ]

    if len(folders) != 1:
        raise RuntimeError(
            f"Expected exactly one source folder for {target}; "
            f"found {folders}"
        )

    files = [
        p for p in folders[0].rglob("*")
        if p.is_file() and p.suffix.lower() in EXTS
    ]

    if len(files) < 3:
        raise RuntimeError(
            f"Not enough images for {target}: {len(files)}"
        )

    found[target] = files

print("Original image counts:")
for label, files in found.items():
    print(f"{label}: {len(files)}")

# Avoid silently deleting an existing dataset.
if DEST.exists():
    answer = input(
        f"{DEST} already exists. Delete and recreate it? (yes/no): "
    )
    if answer.strip().lower() != "yes":
        raise SystemExit("Cancelled. Existing dataset preserved.")
    shutil.rmtree(DEST)

for split in ("train", "val", "test"):
    for cls in SOURCE_LABELS:
        (DEST / split / cls).mkdir(parents=True, exist_ok=True)

counts = Counter()

for cls, files in found.items():
    files = files.copy()
    random.Random(SEED).shuffle(files)

    n = len(files)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    splits = {
        "train": files[:train_end],
        "val": files[train_end:val_end],
        "test": files[val_end:],
    }

    for split, subset in splits.items():
        for i, source_file in enumerate(subset):
            filename = f"{cls}_{i:05d}{source_file.suffix.lower()}"
            shutil.copy2(source_file, DEST / split / cls / filename)
            print(f"Copied {split}/{cls}: {i + 1}/{len(subset)}", end="\r")
        counts[(split, cls)] = len(subset)

print("\nCreated split:")
for split in ("train", "val", "test"):
    print(
        split,
        sum(counts[(split, cls)] for cls in SOURCE_LABELS),
        {cls: counts[(split, cls)] for cls in SOURCE_LABELS},
    )

print("\nOutput:", DEST)
