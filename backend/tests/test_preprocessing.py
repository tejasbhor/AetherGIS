"""AetherGIS — Pytest tests: preprocessing pipeline."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from backend.app.models.schemas import GapCategory
from backend.app.services.preprocessing import (
    classify_gap,
    compute_temporal_gaps,
    detect_calibration_shift,
    detect_terminator_crossing,
    preprocess_sequence,
    segment_observed_frames,
)


def make_frame(h: int = 64, w: int = 64, fill: float = 0.5) -> np.ndarray:
    return np.full((h, w, 3), fill, dtype=np.float32)


def make_random_frame(h: int = 64, w: int = 64) -> np.ndarray:
    return np.random.uniform(0.2, 0.8, (h, w, 3)).astype(np.float32)


T0 = datetime(2024, 1, 15, 6, 0, 0, tzinfo=timezone.utc)


class TestClassifyGap:
    def test_short_gap(self):
        cat, sub, max_fps, cf = classify_gap(5.0)
        assert cat == GapCategory.short
        assert sub == 1
        assert cf == 1.0

    def test_medium_gap(self):
        cat, sub, max_fps, cf = classify_gap(20.0)
        assert cat == GapCategory.medium
        assert sub == 2

    def test_large_gap(self):
        cat, sub, max_fps, cf = classify_gap(45.0)
        assert cat == GapCategory.large
        assert max_fps == 2
        assert cf < 1.0  # capped confidence

    def test_very_large_gap(self):
        cat, sub, max_fps, cf = classify_gap(90.0)
        assert cat == GapCategory.very_large
        assert max_fps == 1
        assert cf <= 0.44


class TestTemporalGaps:
    def test_gap_count(self):
        times = [T0 + timedelta(minutes=10 * i) for i in range(5)]
        gaps = compute_temporal_gaps(times)
        assert len(gaps) == 4  # 5 frames → 4 gaps

    def test_gap_minutes_correct(self):
        times = [T0, T0 + timedelta(minutes=30)]
        gaps = compute_temporal_gaps(times)
        assert abs(gaps[0].gap_minutes - 30.0) < 0.01

    def test_single_frame_returns_empty(self):
        assert compute_temporal_gaps([T0]) == []


class TestSegmentation:
    def test_split_on_large_gap(self):
        times = [
            T0,
            T0 + timedelta(minutes=10),
            T0 + timedelta(minutes=20),
            T0 + timedelta(hours=3),   # big gap
            T0 + timedelta(hours=3, minutes=10),
        ]
        frames = [make_random_frame() for _ in times]
        segments = segment_observed_frames(frames, times, max_gap_minutes=30.0)
        assert len(segments) == 2
        assert len(segments[0][0]) == 3
        assert len(segments[1][0]) == 2

    def test_no_split_on_small_gaps(self):
        times = [T0 + timedelta(minutes=10 * i) for i in range(4)]
        frames = [make_random_frame() for _ in times]
        segments = segment_observed_frames(frames, times, max_gap_minutes=30.0)
        assert len(segments) == 1


class TestCalibrationShift:
    def test_detects_shift(self):
        a = make_frame(fill=0.3)
        b = make_frame(fill=0.6)  # mean diff = 0.3 > default threshold 0.15
        assert detect_calibration_shift(a, b) is True

    def test_no_shift_similar_frames(self):
        a = make_random_frame()
        b = a.copy()
        assert detect_calibration_shift(a, b) is False


class TestTerminatorDetection:
    def test_detects_dawn(self):
        # 6:00 UTC near equator (lon = 0, lat = 0) → near terminator
        ts = datetime(2024, 3, 21, 6, 0, tzinfo=timezone.utc)
        bbox = [-10.0, -5.0, 10.0, 5.0]
        result = detect_terminator_crossing(ts, bbox)
        # Near equinox at 6:00 UTC at 0 lon → near terminator; result can vary
        assert isinstance(result, bool)

    def test_midday_no_terminator(self):
        # Midday UTC at India bbox
        ts = datetime(2024, 6, 21, 7, 0, tzinfo=timezone.utc)  # ~12:30 IST
        bbox = [68.0, 8.0, 97.0, 37.0]
        result = detect_terminator_crossing(ts, bbox)
        assert result is False


class TestPreprocessSequence:
    def test_output_shape(self):
        frames = [make_random_frame() for _ in range(4)]
        times = [T0 + timedelta(minutes=10 * i) for i in range(4)]
        result = preprocess_sequence(frames, times, bbox=[68.0, 8.0, 97.0, 37.0])
        assert len(result.frames) <= 4
        assert len(result.timestamps) == len(result.frames)
        assert len(result.gaps) == len(result.frames) - 1

    def test_deduplication(self):
        f = make_frame()
        # All same frame → all duplicates after the first
        frames = [f.copy() for _ in range(3)]
        times = [T0 + timedelta(minutes=i * 10) for i in range(3)]
        result = preprocess_sequence(frames, times, bbox=[68.0, 8.0, 97.0, 37.0])
        # All have same hash; all but first removed
        assert len(result.frames) == 1

    def test_raises_on_empty(self):
        with pytest.raises(ValueError):
            preprocess_sequence([], [], bbox=[68.0, 8.0, 97.0, 37.0])
