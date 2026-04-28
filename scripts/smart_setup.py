import subprocess
import sys
import shutil
import re
import os

PYPROJECT_PATH = "pyproject.toml"

def check_gpu():
    """Checks for NVIDIA GPU availability, with environment variable override."""
    # Check for override first
    force_gpu = os.environ.get("AETHER_FORCE_GPU")
    if force_gpu is not None:
        return force_gpu.lower() in ("1", "true", "yes")

    if shutil.which("nvidia-smi") is not None:
        try:
            subprocess.check_output(["nvidia-smi", "-L"], stderr=subprocess.STDOUT)
            return True
        except subprocess.CalledProcessError:
            return False
    return False

def update_pyproject(use_gpu: bool):
    """Dynamically updates pyproject.toml to add/remove CUDA sources."""
    if not os.path.exists(PYPROJECT_PATH):
        print(f"[AetherGIS] ERROR: {PYPROJECT_PATH} not found.")
        return

    with open(PYPROJECT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # The block we want to manage
    cuda_source_block = """
[tool.uv.sources]
torch = { index = "pytorch-cu121" }
torchvision = { index = "pytorch-cu121" }
"""
    
    # Remove any existing uv.sources block for torch/torchvision
    content = re.sub(r"\[tool\.uv\.sources\].*?(?=\n\n|\n\[|$)", "", content, flags=re.DOTALL)
    content = content.strip() + "\n"

    if use_gpu:
        print("[AetherGIS] CONFIG: Adding CUDA sources to pyproject.toml...")
        content += cuda_source_block
    else:
        print("[AetherGIS] CONFIG: Using standard PyPI sources (CPU).")

    with open(PYPROJECT_PATH, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    gpu_present = check_gpu()
    
    if gpu_present:
        print("\n[AetherGIS] STATUS: NVIDIA GPU detected.")
    else:
        print("\n[AetherGIS] STATUS: No NVIDIA GPU detected.")

    # 1. Update the project configuration based on hardware
    update_pyproject(gpu_present)

    # 2. Run uv sync to lock in the hardware-specific versions
    print("[AetherGIS] SYNC: Synchronizing environment...")
    try:
        # We use 'uv sync' now because pyproject.toml is correctly configured for the detected hardware
        subprocess.check_call(["uv", "sync"])
        print("[AetherGIS] OK: Hardware-specific environment is LOCKED and READY.\n")
    except subprocess.CalledProcessError as e:
        print(f"[AetherGIS] ERROR: Sync failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure stdout handles unicode better on Windows if possible, but we'll stick to ASCII for safety
    main()
