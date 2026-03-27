"""
TemporalGIS — FILM Model Weight Downloader.
Downloads film_net_fp32.pt from dajes/frame-interpolation-pytorch.
"""
from __future__ import annotations

import sys
import urllib.request
import urllib.error
from pathlib import Path

# Verified URL for the TorchScript FILM port
FILM_MODEL_URL = (
    "https://github.com/dajes/frame-interpolation-pytorch/releases/download/v1.0.2/"
    "film_net_fp32.pt"
)
DEST_DIR = Path(__file__).parent.parent / "backend" / "app" / "ai_models" / "film"
DEST_PATH = DEST_DIR / "film_net_fp32.pt"


def download_with_progress(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading FILM weights (fp32) from:\n  {url}")
    print(f"Destination: {dest}")

    def report(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            mb = downloaded / 1_048_576
            print(f"\r  Progress: {pct:3d}%  ({mb:.1f} MB)", end="", flush=True)

    try:
        urllib.request.urlretrieve(url, dest, reporthook=report)
        print() 
    except urllib.error.URLError as e:
        print(f"\nERROR: Download failed: {e}")
        sys.exit(1)


def main() -> None:
    print("=" * 60)
    print("TemporalGIS — FILM Model Weight Downloader")
    print("=" * 60)

    if DEST_PATH.exists():
        size_mb = DEST_PATH.stat().st_size / 1_048_576
        if size_mb > 40: # Expecting ~50MB
            print(f"✓ FILM weights already present ({size_mb:.1f} MB). Skipping.")
            return

    download_with_progress(FILM_MODEL_URL, DEST_PATH)
    
    if DEST_PATH.exists():
        print("✓ FILM weights downloaded successfully.")
    else:
        print("⚠️ Download failed or file not found.")

if __name__ == "__main__":
    main()
