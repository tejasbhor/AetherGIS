/**
 * TemporalGIS - Zustand global state store.
 */
import { create } from 'zustand';
export type ConfidenceClass = 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECTED';
export interface FrameMetadata {
  frame_index: number;
  timestamp: string;
  is_interpolated: boolean;
  confidence_score?: number;
  confidence_class?: ConfidenceClass;
  model_used?: string;
  flow_consistency?: number;
  mad_score?: number;
  gap_minutes?: number;
  gap_category?: string;
  psnr?: number;
  ssim?: number;
}
export interface QualityMetrics {
  tcs?: number;
  fsi?: number;
  avg_psnr?: number;
  avg_ssim?: number;
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  rejected_count: number;
  total_frames: number;
  interpolated_frames: number;
  observed_frames: number;
}
export interface PipelineResult {
  job_id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  layer_id: string;
  original_video_url?: string;
  interpolated_video_url?: string;
  frames: FrameMetadata[];
  metrics?: QualityMetrics;
  error?: string;
}
export interface PresetRegion {
  label: string;
  bbox: [number, number, number, number];
  description: string;
  agency: string;
}
export interface LayerInfo {
  layer_id: string;
  name: string;
  temporal_resolution_minutes: number;
  use_case: string;
  description?: string;
  nadir_lon?: number | null;
  coverage_lon_min?: number;
  coverage_lon_max?: number;
  coverage_lat_min?: number;
  coverage_lat_max?: number;
  coverage_note?: string;
  preset_regions?: Record<string, PresetRegion>;
  default_preset?: string;
}
export type ComparisonMode = 'side-by-side' | 'overlay';
export type JobStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';
export type ModelType = 'rife' | 'film' | 'dain' | 'lk_fallback';
interface TGISState {
  dataSource: 'nasa_gibs' | 'isro_bhuvan';
  selectedLayer: string | null;
  selectedPresetKey: string | null;
  timeStart: string;
  timeEnd: string;
  bbox: [number, number, number, number] | null;
  resolution: 512 | 1024 | 2048;
  nIntermediate: number;
  interpolationModel: ModelType;
  includeLowConfidence: boolean;
  apiError: string | null;
  jobId: string | null;
  jobStatus: JobStatus;
  jobProgress: number;
  jobMessage: string | null;
  pipelineResult: PipelineResult | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: 0.5 | 1 | 2 | 4;
  showMetadataOverlay: boolean;
  comparisonMode: ComparisonMode;
  showLowConfidence: boolean;
  activePanel: 'controls' | 'analysis' | 'export';
  layers: LayerInfo[];
  setDataSource: (src: 'nasa_gibs' | 'isro_bhuvan') => void;
  setSelectedLayer: (id: string | null) => void;
  setSelectedPresetKey: (key: string | null) => void;
  setTimeStart: (t: string) => void;
  setTimeEnd: (t: string) => void;
  setBbox: (bbox: [number, number, number, number] | null) => void;
  setResolution: (r: 512 | 1024 | 2048) => void;
  setNIntermediate: (n: number) => void;
  setInterpolationModel: (m: ModelType) => void;
  setIncludeLowConfidence: (v: boolean) => void;
  setApiError: (e: string | null) => void;
  setJobId: (id: string | null) => void;
  setJobStatus: (s: JobStatus) => void;
  setJobProgress: (p: number) => void;
  setJobMessage: (m: string | null) => void;
  setPipelineResult: (r: PipelineResult | null) => void;
  setCurrentFrameIndex: (i: number) => void;
  setIsPlaying: (v: boolean) => void;
  setPlaybackSpeed: (s: 0.5 | 1 | 2 | 4) => void;
  setShowMetadataOverlay: (v: boolean) => void;
  setComparisonMode: (m: ComparisonMode) => void;
  setShowLowConfidence: (v: boolean) => void;
  setActivePanel: (p: 'controls' | 'analysis' | 'export') => void;
  setLayers: (l: LayerInfo[]) => void;
}
const NOW = new Date();
const TWO_HOURS_AGO = new Date(NOW.getTime() - 2 * 60 * 60 * 1000);
export const useStore = create<TGISState>((set) => ({
  selectedLayer: null,
  selectedPresetKey: null,
  timeStart: TWO_HOURS_AGO.toISOString().slice(0, 16),
  timeEnd: NOW.toISOString().slice(0, 16),
  bbox: null,
  resolution: 1024,
  nIntermediate: 4,
  interpolationModel: 'film',
  includeLowConfidence: false,
  jobId: null,
  jobStatus: 'idle',
  jobProgress: 0,
  jobMessage: null,
  pipelineResult: null,
  currentFrameIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  showMetadataOverlay: true,
  comparisonMode: 'side-by-side',
  showLowConfidence: false,
  activePanel: 'controls',
  layers: [],
  apiError: null,
  dataSource: 'nasa_gibs',
  setDataSource: (src) => set({ dataSource: src, selectedLayer: null, selectedPresetKey: null, bbox: null }),
  setSelectedLayer: (id) => set({ selectedLayer: id }),
  setSelectedPresetKey: (key) => set({ selectedPresetKey: key }),
  setTimeStart: (t) => set({ timeStart: t }),
  setTimeEnd: (t) => set({ timeEnd: t }),
  setBbox: (bbox) => set({ bbox }),
  setResolution: (r) => set({ resolution: r }),
  setNIntermediate: (n) => set({ nIntermediate: n }),
  setInterpolationModel: (m) => set({ interpolationModel: m }),
  setIncludeLowConfidence: (v) => set({ includeLowConfidence: v }),
  setJobId: (id) => set({ jobId: id }),
  setJobStatus: (s) => set({ jobStatus: s }),
  setJobProgress: (p) => set({ jobProgress: p }),
  setJobMessage: (m) => set({ jobMessage: m }),
  setPipelineResult: (r) => set({ pipelineResult: r }),
  setCurrentFrameIndex: (i) => set({ currentFrameIndex: i }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
  setShowMetadataOverlay: (v) => set({ showMetadataOverlay: v }),
  setComparisonMode: (m) => set({ comparisonMode: m }),
  setShowLowConfidence: (v) => set({ showLowConfidence: v }),
  setActivePanel: (p) => set({ activePanel: p }),
  setLayers: (l) => set({ layers: l }),
  setApiError: (e) => set({ apiError: e }),
}));

