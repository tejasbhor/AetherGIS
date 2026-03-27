"""
Download RIFE 4.x model weights from the official GitHub release.
Saves to backend/app/ai_models/rife/
"""
from __future__ import annotations

import hashlib
import os
import sys
import zipfile
from pathlib import Path

import urllib.request
import urllib.error

RIFE_RELEASE_URL = (
    "https://github.com/hzwer/Practical-RIFE/releases/download/model4.6/"
    "train_log.zip"
)
EXPECTED_SIZE_MB = 130  # approximate
DEST_DIR = Path(__file__).parent.parent / "backend" / "app" / "ai_models" / "rife"
ZIP_PATH = DEST_DIR / "rife_weights.zip"


def download_with_progress(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading RIFE weights from:\n  {url}")
    print(f"Destination: {dest}")

    def report(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            mb = downloaded / 1_048_576
            print(f"\r  Progress: {pct:3d}%  ({mb:.1f} MB)", end="", flush=True)

    try:
        urllib.request.urlretrieve(url, dest, reporthook=report)
        print()  # newline after progress
    except urllib.error.URLError as e:
        print(f"\nERROR: Download failed: {e}")
        sys.exit(1)


def extract_weights(zip_path: Path, dest_dir: Path) -> None:
    print(f"Extracting to {dest_dir} ...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(dest_dir)
    zip_path.unlink()  # Remove zip after extraction
    print("Extraction complete.")


def verify_weights(dest_dir: Path) -> bool:
    """Check that key model files exist."""
    expected_files = ["flownet.pkl"]
    for fname in expected_files:
        # Search recursively in case of nested directory
        matches = list(dest_dir.rglob(fname))
        if not matches:
            print(f"WARNING: Expected file not found: {fname}")
            return False
        # Move to top level if nested
        if matches[0].parent != dest_dir:
            matches[0].rename(dest_dir / fname)
    return True


def main() -> None:
    print("=" * 60)
    print("TemporalGIS — RIFE Model Weight Downloader")
    print("=" * 60)

    if DEST_DIR.exists() and any(DEST_DIR.rglob("flownet.pkl")):
        print("✓ RIFE weights already present. Skipping download.")
        return

    DEST_DIR.mkdir(parents=True, exist_ok=True)
    download_with_progress(RIFE_RELEASE_URL, ZIP_PATH)
    extract_weights(ZIP_PATH, DEST_DIR)

    if verify_weights(DEST_DIR):
        print("✓ RIFE weights downloaded and verified successfully.")
        print(f"  Model path: {DEST_DIR / 'flownet.pkl'}")
    else:
        print("⚠️  Weight verification failed — check the ai_models/rife/ directory manually.")
        print("   You can also download manually from:")
        print(f"   {RIFE_RELEASE_URL}")

    print()
    print("Next step: update RIFE_MODEL_PATH in your .env if the path differs.")


if __name__ == "__main__":
    main()
