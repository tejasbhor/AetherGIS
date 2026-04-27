import type { LayerCapabilities } from '@shared/api/client';
import type { LayerInfo } from '@app/store/useStore';

type StoreActions = {
  setSelectedPresetKey: (key: string | null) => void;
  setBbox: (bbox: [number, number, number, number] | null) => void;
  setTimeStart: (value: string) => void;
  setTimeEnd: (value: string) => void;
};

function toLocalInputValue(date: Date) {
  return date.toISOString().slice(0, 16);
}

function floorToMinutes(date: Date, minutes: number) {
  const ms = minutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function fromCapabilityTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : toLocalInputValue(date);
}

function scoreRecommendedLayer(layer: LayerInfo) {
  const text = `${layer.layer_id} ${layer.name} ${layer.use_case} ${layer.description ?? ''}`.toLowerCase();
  let score = 0;

  if (text.includes('himawari')) score += 50;
  if (text.includes('india')) score += 30;
  if (text.includes('asia-pacific')) score += 20;
  if (text.includes('infrared')) score += 40;
  if (text.includes('24/7')) score += 25;
  if (text.includes('cyclone')) score += 20;
  if (text.includes('cloud')) score += 10;
  if (text.includes('visible')) score -= 20;
  if (layer.temporal_resolution_minutes <= 15) score += 15;
  if (layer.temporal_resolution_minutes >= 1440) score -= 20;

  return score;
}

export function chooseRecommendedLayer(layers: LayerInfo[]): string | null {
  if (layers.length === 0) return null;

  const ranked = [...layers].sort((a, b) => scoreRecommendedLayer(b) - scoreRecommendedLayer(a));
  return ranked[0]?.layer_id ?? null;
}

export function getDefaultPresetKey(layer: LayerInfo | undefined | null): string | null {
  if (!layer?.preset_regions) return null;
  if (layer.default_preset && layer.preset_regions[layer.default_preset]) {
    return layer.default_preset;
  }

  const keys = Object.keys(layer.preset_regions);
  return keys[0] ?? null;
}

export function getSmartTimeRange(
  layer: LayerInfo | undefined | null,
  capabilities?: LayerCapabilities | null,
) {
  const suggestedStart = fromCapabilityTime(capabilities?.suggested_time_start);
  const suggestedEnd = fromCapabilityTime(capabilities?.suggested_time_end);
  if (suggestedStart && suggestedEnd) {
    return {
      start: suggestedStart,
      end: suggestedEnd,
      stepMinutes: capabilities?.step_minutes ?? Math.max(1, Math.round(layer?.temporal_resolution_minutes ?? 10)),
      source: capabilities?.time_source_live ? 'live' : 'fallback',
    };
  }

  const now = new Date();

  if (!layer) {
    const end = floorToMinutes(new Date(now.getTime() - 60 * 60 * 1000), 10);
    const start = new Date(end.getTime() - 2 * 60 * 60 * 1000);
    return {
      start: toLocalInputValue(start),
      end: toLocalInputValue(end),
      stepMinutes: 10,
      source: 'heuristic',
    };
  }

  const cadence = Math.max(1, Math.round(capabilities?.step_minutes ?? layer.temporal_resolution_minutes));
  const isDailyOrSlower = cadence >= 180;

  if (isDailyOrSlower) {
    const latencyHours = 12;
    const end = floorToMinutes(new Date(now.getTime() - latencyHours * 60 * 60 * 1000), 60);
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 2 * 24 * 60 * 60 * 1000);
    return {
      start: toLocalInputValue(start),
      end: toLocalInputValue(end),
      stepMinutes: cadence,
      source: 'heuristic',
    };
  }

  const latencyMinutes = Math.max(cadence * 3, 30);
  const end = floorToMinutes(new Date(now.getTime() - latencyMinutes * 60 * 1000), cadence);
  const start = new Date(end.getTime() - Math.max(cadence * 6, 2 * 60) * 60 * 1000);
  return {
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
    stepMinutes: cadence,
    source: 'heuristic',
  };
}

export function applyLayerPreset(
  layer: LayerInfo | undefined | null,
  presetKey: string | null,
  actions: StoreActions,
  capabilities?: LayerCapabilities | null,
) {
  if (!layer || !presetKey || !layer.preset_regions?.[presetKey]) {
    actions.setSelectedPresetKey(null);
    actions.setBbox(null);
    return;
  }

  const preset = layer.preset_regions[presetKey];
  actions.setSelectedPresetKey(presetKey);
  actions.setBbox([preset.bbox[0], preset.bbox[1], preset.bbox[2], preset.bbox[3]]);

  const smartRange = getSmartTimeRange(layer, capabilities);
  actions.setTimeStart(smartRange.start);
  actions.setTimeEnd(smartRange.end);
}
