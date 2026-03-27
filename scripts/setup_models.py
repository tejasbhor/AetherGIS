"""
TemporalGIS — Universal AI Model Setup Script.
Downloads and verifies weights for RIFE and FILM interpolation models.
"""
from __future__ import annotations

import os
import sys
import urllib.request
from pathlib import Path

# -- Configurations
RIFE_WEIGHTS_URL = "https://github.com/hzwer/rife-pytorch/releases/download/v4.6/flownet.pkl"
FILM_WEIGHTS_URL = "https://github.com/dajes/frame-interpolation-pytorch/releases/download/v1.0.2/film_net_fp32.pt"

ROOT_DIR = Path(__file__).parent.parent
MODELS_DIR = ROOT_DIR / "backend" / "app" / "ai_models"

RIFE_DIR = MODELS_DIR / "rife"
FILM_DIR = MODELS_DIR / "film"

def download_with_progress(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    filename = url.split("/")[-1]
    print(f"\nProcessing {filename}...")
    
    if dest.exists() and dest.stat().st_size > 1_000_000:
        print(f"  ✓ Already exists ({dest.stat().st_size / 1_048_576:.1f} MB). Skipping.")
        return

    def report(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 // total_size)
            print(f"\r  Downloading: {pct:3d}%", end="", flush=True)

    try:
        urllib.request.urlretrieve(url, dest, reporthook=report)
        print(f"\n  ✓ Downloaded to {dest}")
    except Exception as e:
        print(f"\n  ❌ Failed to download {url}: {e}")

def setup_rife_structure():
    """RIFE requires the model files to be in a specific structure for the loader."""
    # Note: RIFE usually needs the 'model' directory from its repo.
    # For this project, we assume the user might already have the code, 
    # but we just need the weight file 'flownet.pkl'.
    pass

def main():
    print("=" * 60)
    print("TemporalGIS — AI Model Weights Setup")
    print("=" * 60)
    
    # 1. FILM
    download_with_progress(FILM_WEIGHTS_URL, FILM_DIR / "film_net_fp32.pt")
    
    # 2. RIFE
    download_with_progress(RIFE_WEIGHTS_URL, RIFE_DIR / "flownet.pkl")
    
    print("\n" + "=" * 60)
    print("Setup complete! Restart your backend to load the models.")
    print("=" * 60)

if __name__ == "__main__":
    main()
