"""AetherGIS - AI Interpolation Engine."""
from __future__ import annotations

import sys
import threading
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from pathlib import Path

import cv2
import numpy as np

from backend.app.config import get_settings
from backend.app.services.preprocessing import GapInfo
from backend.app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class InterpolationEngine(ABC):
    @abstractmethod
    def interpolate(self, frame_a: np.ndarray, frame_b: np.ndarray, n_intermediate: int) -> list[np.ndarray]:
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        ...

    @property
    def is_loaded(self) -> bool:
        return True

    @property
    def effective_model_name(self) -> str:
        return self.model_name


class LKFallbackEngine(InterpolationEngine):
    @property
    def model_name(self) -> str:
        return 'lk_fallback'

    def _warp_frame(self, src: np.ndarray, flow: np.ndarray, t: float) -> np.ndarray:
        h, w = src.shape[:2]
        grid_y, grid_x = np.mgrid[0:h, 0:w].astype(np.float32)
        map_x = np.clip(grid_x - flow[..., 0] * t, 0, w - 1).astype(np.float32)
        map_y = np.clip(grid_y - flow[..., 1] * t, 0, h - 1).astype(np.float32)
        return cv2.remap(src.astype(np.float32), map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def interpolate(self, frame_a: np.ndarray, frame_b: np.ndarray, n_intermediate: int) -> list[np.ndarray]:
        gray_a = cv2.cvtColor((frame_a * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        gray_b = cv2.cvtColor((frame_b * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Rule DR-01: Enhanced Lucas-Kanade + Weighted Dissolve
        flow = cv2.calcOpticalFlowFarneback(
            gray_a.astype(np.float32),
            gray_b.astype(np.float32),
            None,
            pyr_scale=0.5, levels=3, winsize=15, iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )
        
        frames = []
        for i in range(1, n_intermediate + 1):
            t = i / (n_intermediate + 1)
            # Forward warp from A
            warped_a = self._warp_frame(frame_a, flow, t)
            # Backward warp from B (invert flow)
            warped_b = self._warp_frame(frame_b, -flow, 1.0 - t)
            
            # Weighted blend: combines motion estimation with safe cross-dissolve
            # This ensures even if flow is local/zero, the frames aren't exact duplicates.
            blended = warped_a * (1.0 - t) + warped_b * t
            frames.append(np.clip(blended.astype(np.float32), 0.0, 1.0))
        return frames


class RIFEEngine(InterpolationEngine):
    def __init__(self) -> None:
        self._model: Any = None
        self._device: str | None = None
        self._loaded = False
        self._effective_model_name = 'lk_fallback'
        self._fallback = LKFallbackEngine()
        self._try_load()

    @property
    def model_name(self) -> str:
        return 'rife'

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def effective_model_name(self) -> str:
        return self._effective_model_name

    def _try_load(self) -> None:
        model_path = settings.rife_model_path
        if not Path(model_path).exists():
            logger.warning('RIFE model weights not found - using LK fallback', path=str(model_path))
            return
        try:
            import torch
            device_str = settings.cuda_device
            if device_str == 'cuda' and not torch.cuda.is_available():
                logger.warning('CUDA not available, checking for MPS')
                if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                    device_str = 'mps'
                else:
                    device_str = 'cpu'
            elif device_str == 'mps' and not (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
                logger.warning('MPS not available, falling back to CPU')
                device_str = 'cpu'
            self._device = device_str
            rife_dir = Path(model_path).parent
            sys.path.insert(0, str(rife_dir))
            from model.RIFE_HDv3 import Model  # type: ignore[import]
            model = Model()
            model.load_model(str(rife_dir), -1)
            model.eval()
            if device_str == 'cuda':
                model.flownet = model.flownet.cuda()
            self._model = model
            self._loaded = True
            logger.info('RIFE model loaded', device=device_str)
        except Exception as exc:
            logger.error('Failed to load RIFE model', error=str(exc))
            self._loaded = False

    def _midpoint(self, frame_a: np.ndarray, frame_b: np.ndarray) -> np.ndarray:
        import torch
        import torch.nn.functional as F

        def to_tensor(frame: np.ndarray) -> 'torch.Tensor':
            tensor = torch.from_numpy(frame.transpose(2, 0, 1)).unsqueeze(0).float()
            if self._device == 'cuda':
                tensor = tensor.cuda()
            elif self._device == 'mps':
                tensor = tensor.to('mps')
            return tensor

        ta = to_tensor(frame_a)
        tb = to_tensor(frame_b)
        h, w = frame_a.shape[:2]
        ph = ((h - 1) // 32 + 1) * 32
        pw = ((w - 1) // 32 + 1) * 32
        ta = F.pad(ta, (0, pw - w, 0, ph - h))
        tb = F.pad(tb, (0, pw - w, 0, ph - h))
        with torch.no_grad():
            if self._model is None:
                raise RuntimeError("RIFE model not loaded")
            middle = self._model.inference(ta, tb)
        result = middle[0].detach().cpu().numpy().transpose(1, 2, 0)[:h, :w]
        return np.clip(result, 0.0, 1.0)

    def _bisect(self, frame_a: np.ndarray, frame_b: np.ndarray, count: int) -> list[np.ndarray]:
        if count <= 0:
            return []
        mid = self._midpoint(frame_a, frame_b)
        left_count = count // 2
        right_count = count - left_count - 1
        return self._bisect(frame_a, mid, left_count) + [mid] + self._bisect(mid, frame_b, right_count)

    def interpolate(self, frame_a: np.ndarray, frame_b: np.ndarray, n_intermediate: int) -> list[np.ndarray]:
        if not self._loaded:
            logger.warning('RIFE not loaded - using LK fallback')
            self._effective_model_name = self._fallback.model_name
            return self._fallback.interpolate(frame_a, frame_b, n_intermediate)

        result: list[np.ndarray] = []
        errors: list[Exception] = []

        def run() -> None:
            try:
                result.extend(self._bisect(frame_a, frame_b, n_intermediate))
            except Exception as exc:
                errors.append(exc)

        thread = threading.Thread(target=run)
        thread.start()
        thread.join(timeout=settings.inference_timeout_seconds)
        if thread.is_alive():
            logger.error('RIFE inference timed out - using LK fallback')
            self._effective_model_name = self._fallback.model_name
            return self._fallback.interpolate(frame_a, frame_b, n_intermediate)
        if errors:
            logger.error('RIFE inference failed - using LK fallback', error=str(errors[0]))
            self._effective_model_name = self._fallback.model_name
            return self._fallback.interpolate(frame_a, frame_b, n_intermediate)

        self._effective_model_name = self.model_name
        return result


class FILMEngine(InterpolationEngine):
    def __init__(self) -> None:
        self._model: Any = None
        self._device: str | None = None
        self._loaded = False
        self._effective_model_name = 'lk_fallback'
        self._fallback = LKFallbackEngine()
        self._try_load()

    @property
    def model_name(self) -> str:
        return 'film'

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def effective_model_name(self) -> str:
        return self._effective_model_name

    def _try_load(self) -> None:
        model_path = settings.film_model_path
        if not Path(model_path).exists():
            logger.warning('FILM model weights not found - using LK fallback', path=str(model_path))
            return
        try:
            import torch
            device_str = settings.cuda_device
            if device_str == 'cuda' and not torch.cuda.is_available():
                logger.warning('CUDA not available, checking for MPS')
                if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                    device_str = 'mps'
                else:
                    device_str = 'cpu'
            elif device_str == 'mps' and not (hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()):
                logger.warning('MPS not available, falling back to CPU')
                device_str = 'cpu'
            
            # MPS isn't always fully supported for torch.jit.load map_location, but we can load to CPU then move
            load_device = 'cpu' if device_str == 'mps' else device_str
            model = torch.jit.load(str(model_path), map_location=load_device)
            model.eval()
            if device_str == 'cuda':
                model = model.cuda()
            elif device_str == 'mps':
                model = model.to('mps')
            self._model = model
            self._device = device_str
            self._loaded = True
            logger.info('FILM model loaded', device=device_str)
        except Exception as exc:
            logger.error('Failed to load FILM model', error=str(exc))
            self._loaded = False

    def interpolate(self, frame_a: np.ndarray, frame_b: np.ndarray, n_intermediate: int) -> list[np.ndarray]:
        if not self._loaded:
            logger.warning('FILM not loaded - using LK fallback')
            self._effective_model_name = self._fallback.model_name
            return self._fallback.interpolate(frame_a, frame_b, n_intermediate)

        try:
            import torch
            import torch.nn.functional as F

            def to_tensor(frame: np.ndarray) -> 'torch.Tensor':
                tensor = torch.from_numpy(frame.transpose(2, 0, 1)).unsqueeze(0).float()
                if self._device == 'cuda':
                    tensor = tensor.cuda()
                elif self._device == 'mps':
                    tensor = tensor.to('mps')
                return tensor

            ta = to_tensor(frame_a)
            tb = to_tensor(frame_b)
            h, w = frame_a.shape[:2]
            ph = ((h - 1) // 64 + 1) * 64
            pw = ((w - 1) // 64 + 1) * 64
            ta = F.pad(ta, (0, pw - w, 0, ph - h))
            tb = F.pad(tb, (0, pw - w, 0, ph - h))

            results: list[np.ndarray] = []
            with torch.no_grad():
                for i in range(1, n_intermediate + 1):
                    t_val = i / (n_intermediate + 1)
                    # FILM expects t as [1, 1] or [1] float32 tensor
                    t_tensor = torch.tensor([t_val], dtype=torch.float32).view(1, 1)
                    if self._device == 'cuda':
                        t_tensor = t_tensor.cuda()
                    elif self._device == 'mps':
                        t_tensor = t_tensor.to('mps')
                    
                    if self._model is None:
                         raise RuntimeError("FILM model not loaded")
                    output = self._model(ta, tb, t_tensor)
                    if isinstance(output, dict):
                        output = output.get('image') or next(iter(output.values()))
                    if isinstance(output, (list, tuple)):
                        output = output[0]
                    
                    res = output[0].detach().cpu().numpy().transpose(1, 2, 0)[:h, :w]
                    res = np.clip(res, 0.0, 1.0)
                    
                    # Validation with fallback trigger
                    stat_mean = float(res.mean())
                    stat_std = float(res.std())
                    if (not np.isfinite(res).all()) or stat_mean < 0.001 or stat_std < 0.001:
                        logger.warning("FILM output degraded - falling back to LK for this gap", mean=stat_mean, std=stat_std)
                        return self._fallback.interpolate(frame_a, frame_b, n_intermediate)
                        
                    results.append(res)

            self._effective_model_name = self.model_name
            return results
        except Exception as exc:
            logger.error('FILM inference failed - using LK fallback', error=str(exc))
            self._effective_model_name = self._fallback.model_name
            return self._fallback.interpolate(frame_a, frame_b, n_intermediate)


_engines: dict[str, InterpolationEngine] = {}


def get_engine(model_name: str) -> InterpolationEngine:
    if model_name not in _engines:
        if model_name == 'rife':
            _engines[model_name] = RIFEEngine()
        elif model_name == 'film':
            _engines[model_name] = FILMEngine()
        elif model_name == 'dain':
            logger.warning('dain not implemented; using RIFE')
            _engines[model_name] = get_engine('rife')
        else:
            _engines[model_name] = LKFallbackEngine()
    return _engines[model_name]


@dataclass
class SegmentedInterpolationResult:
    generated_frames: list[np.ndarray]
    t_positions: list[float]
    sub_intervals: int
    gap_info: GapInfo
    model_used: str


def interpolate_pair_with_segmentation(
    frame_a: np.ndarray,
    frame_b: np.ndarray,
    gap_info: GapInfo,
    engine: InterpolationEngine,
    n_intermediate: int = 4,
) -> SegmentedInterpolationResult:
    """
    Orchestrate gap-filling based on temporal resolution.
    For large gaps, we recursively anchor midpoints to avoid long-distance flow artifacts.
    """
    n_sub = gap_info.sub_intervals
    # Determine the absolute number of frames to generate for this gap
    # Ensure total count matches what the UI/User expects (n_intermediate)
    effective_n = n_intermediate

    if n_sub == 1 or effective_n < n_sub:
        # Simple mode: direct interpolation if gap is short or n is small
        frames = engine.interpolate(frame_a, frame_b, effective_n)
        t_positions = [(i + 1) / (effective_n + 1) for i in range(len(frames))]
        return SegmentedInterpolationResult(frames, t_positions, 1, gap_info, engine.effective_model_name)

    # Segmented mode: split gap into sub-intervals
    # 1. Compute major anchor frames at the split boundaries
    n_anchors = n_sub - 1
    anchor_frames = engine.interpolate(frame_a, frame_b, n_anchors)
    
    # full sequence: A, Anchors..., B
    full_sequence = [frame_a] + anchor_frames + [frame_b]
    
    all_frames: list[np.ndarray] = []
    all_t_positions: list[float] = []
    
    # 2. Add anchors to valid results
    for i, anchor in enumerate(anchor_frames):
        all_frames.append(anchor)
        all_t_positions.append((i + 1) / n_sub)
        
    # 3. If we still need more frames, interpolate between the endpoints/anchors
    remaining = effective_n - len(all_frames)
    if remaining > 0:
        # Distribute remaining frames as evenly as possible using a simple greedy allocation
        # For simplicity in this PRD context, we'll just fill the first segments
        for seg_idx in range(n_sub):
            if remaining <= 0: break
            
            # Sub-interpolate 1 frame into this segment
            # Note: For even better smoothness, we'd do (remaining // n_sub) but 
            # for most weather gaps n_sub is small (2 or 4) and n_interp is small (4)
            seg_a, seg_b = full_sequence[seg_idx], full_sequence[seg_idx+1]
            sub_frames = engine.interpolate(seg_a, seg_b, 1)
            
            seg_start = seg_idx / n_sub
            seg_end = (seg_idx + 1) / n_sub
            t = (seg_start + seg_end) / 2.0
            
            all_frames.append(sub_frames[0])
            all_t_positions.append(t)
            remaining -= 1

    # 4. Final sort to ensure temporal consistency
    results: list[tuple[float, np.ndarray]] = sorted(zip(all_t_positions, all_frames), key=lambda x: x[0])
    
    final_frames: list[np.ndarray] = [r[1] for r in results][0:effective_n]
    final_t: list[float] = [r[0] for r in results][0:effective_n]

    logger.info('Segmented interpolation complete (Multi-Anchor)', 
                sub_intervals=n_sub, final_count=len(final_frames), 
                category=gap_info.category)
                
    return SegmentedInterpolationResult(final_frames, final_t, n_sub, gap_info, engine.effective_model_name)
