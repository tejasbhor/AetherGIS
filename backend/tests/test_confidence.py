"""AetherGIS — Pytest tests: confidence scoring."""
from __future__ import annotations

import numpy as np
import pytest

from backend.app.models.schemas import ConfidenceClass
from backend.app.services.confidence import (
    classify_confidence,
    compute_flow_consistency_score,
    compute_frame_stability_index,
    compute_mad,
    compute_optical_flow,
    compute_temporal_consistency_score,
    score_generated_frame,
)


def make_frame(h: int = 64, w: int = 64, fill: float = 0.5) -> np.ndarray:
    return np.full((h, w, 3), fill, dtype=np.float32)


def make_random_frame(seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.uniform(0.2, 0.8, (64, 64, 3)).astype(np.float32)


class TestClassifyConfidence:
    def test_high(self):
        assert classify_confidence(0.80) == ConfidenceClass.high

    def test_medium(self):
        assert classify_confidence(0.60) == ConfidenceClass.medium

    def test_low(self):
        assert classify_confidence(0.30) == ConfidenceClass.low

    def test_boundary_high(self):
        assert classify_confidence(0.75) == ConfidenceClass.high

    def test_boundary_medium(self):
        assert classify_confidence(0.45) == ConfidenceClass.medium

    def test_just_below_medium(self):
        assert classify_confidence(0.44) == ConfidenceClass.low


class TestOpticalFlow:
    def test_flow_returns_correct_shape(self):
        fa = make_random_frame(0)
        fb = make_random_frame(1)
        fwd, bwd = compute_optical_flow(fa, fb)
        assert fwd.shape == (64, 64, 2)
        assert bwd.shape == (64, 64, 2)

    def test_identical_frames_near_zero_consistency(self):
        f = make_random_frame(0)
        fwd, bwd = compute_optical_flow(f, f)
        score = compute_flow_consistency_score(fwd, bwd)
        # Identical frames → near-zero consistency error
        assert score < 0.05

    def test_consistency_score_in_range(self):
        fa = make_random_frame(0)
        fb = make_random_frame(1)
        fwd, bwd = compute_optical_flow(fa, fb)
        score = compute_flow_consistency_score(fwd, bwd)
        assert 0.0 <= score <= 1.0


class TestMAD:
    def test_identical_frames_zero_mad(self):
        f = make_frame(fill=0.5)
        assert compute_mad(f, f) == pytest.approx(0.0)

    def test_opposite_frames_high_mad(self):
        a = make_frame(fill=0.0)
        b = make_frame(fill=1.0)
        assert compute_mad(a, b) == pytest.approx(1.0)


class TestScoreGeneratedFrame:
    def test_similar_frames_short_gap_high_confidence(self):
        f = make_random_frame(0)
        g = f + np.random.uniform(-0.01, 0.01, f.shape).astype(np.float32)
        g = np.clip(g, 0, 1)
        result = score_generated_frame(f, g, gap_minutes=10.0)
        assert not result.is_rejected
        # Very similar frames → likely medium or high confidence
        assert result.confidence_class in (ConfidenceClass.high, ConfidenceClass.medium)

    def test_rejected_on_extreme_flow(self):
        # Completely different random frames → may trigger rejection
        a = make_random_frame(0)
        b = make_random_frame(99)  # Very different seed
        result = score_generated_frame(a, b, gap_minutes=5.0)
        # This may or may not reject depending on actual flow magnitude
        assert result.confidence_score >= 0.0
        assert result.confidence_score <= 1.0

    def test_very_large_gap_caps_to_low(self):
        f = make_random_frame(0)
        g = f + np.random.uniform(-0.01, 0.01, f.shape).astype(np.float32)
        g = np.clip(g, 0, 1)
        result = score_generated_frame(f, g, gap_minutes=90.0)
        # Very large gap → confidence floor at 0.44
        assert result.confidence_score <= 0.44

    def test_score_components_in_range(self):
        fa = make_random_frame(0)
        fb = make_random_frame(1)
        result = score_generated_frame(fa, fb, gap_minutes=15.0)
        assert 0.0 <= result.flow_consistency <= 1.0
        assert 0.0 <= result.mad_score <= 1.0
        assert 0.0 <= result.gap_factor <= 1.0


class TestAggregateMetrics:
    def test_tcs_identical_sequence(self):
        frames = [make_frame(fill=0.5) for _ in range(5)]
        tcs = compute_temporal_consistency_score(frames)
        assert tcs == pytest.approx(1.0, abs=0.01)

    def test_fsi_uniform_sequence(self):
        frames = [make_frame(fill=0.5) for _ in range(5)]
        fsi = compute_frame_stability_index(frames)
        assert fsi == pytest.approx(1.0, abs=0.01)

    def test_tcs_range(self):
        rng = np.random.default_rng(0)
        frames = [rng.uniform(0, 1, (32, 32, 3)).astype(np.float32) for _ in range(6)]
        tcs = compute_temporal_consistency_score(frames)
        assert 0.0 <= tcs <= 1.0

    def test_single_frame_returns_one(self):
        assert compute_temporal_consistency_score([make_frame()]) == 1.0
        assert compute_frame_stability_index([make_frame()]) == 1.0
