/**
 * AetherGIS - API client with Axios + React Query hooks.
 */
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export interface LayerCapabilities {
  layer_id: string;
  time_start?: string;
  time_end?: string;
  latest_available_time?: string;
  suggested_time_start?: string;
  suggested_time_end?: string;
  step_minutes?: number;
  time_source_live: boolean;
  temporal_resolution_minutes: number;
  min_resolution: number;
  max_resolution: number;
  bbox: number[];
  nadir_lon?: number | null;
  coverage_lon_min?: number;
  coverage_lon_max?: number;
  coverage_lat_min?: number;
  coverage_lat_max?: number;
  coverage_note?: string;
  default_preset?: string | null;
}

export interface PipelineRunPayload {
  data_source: 'nasa_gibs' | 'isro_bhuvan';
  layer_id: string;
  bbox: number[];
  time_start: string;
  time_end: string;
  resolution: number;
  interpolation_model: string;
  n_intermediate: number;
  step_minutes?: number | null;
  include_low_confidence: boolean;
}

export interface HealthResponse {
  status: string;
  redis_connected: boolean;
  gpu_available: boolean;
  gpu_device_name?: string | null;
  rife_model_loaded: boolean;
  film_model_loaded: boolean;
  version: string;
}

export const fetchLayers = async (dataSource = 'nasa_gibs') => {
  const { data } = await apiClient.get('/layers', { params: { data_source: dataSource } });
  return data;
};

export const fetchLayerCapabilities = async (layerId: string): Promise<LayerCapabilities> => {
  const { data } = await apiClient.get(`/layers/${layerId}/capabilities`);
  return data;
};

export const submitPipeline = async (payload: PipelineRunPayload): Promise<{ job_id: string }> => {
  const { data } = await apiClient.post('/pipeline/run', payload);
  return data;
};

export const cancelPipeline = async (jobId: string): Promise<{ status: string }> => {
  const { data } = await apiClient.post(`/pipeline/${jobId}/cancel`);
  return data;
};

export const triggerVideoExport = async (
  jobId: string,
  videoType: 'original' | 'interpolated' | 'all',
): Promise<{ status: 'ready' | 'generating'; url?: string }> => {
  const { data } = await apiClient.post(`/pipeline/${jobId}/export/${videoType}`);
  return data;
};

export const checkVideoReady = async (
  jobId: string,
  videoType: 'original' | 'interpolated' | 'all',
): Promise<{ status: 'ready' | 'not_generated'; url?: string }> => {
  const { data } = await apiClient.get(`/pipeline/${jobId}/export/${videoType}/status`);
  return data;
};

export const fetchJobStatus = async (jobId: string) => {
  const { data } = await apiClient.get(`/pipeline/${jobId}/status`);
  return data;
};

export const fetchJobResults = async (jobId: string) => {
  const { data } = await apiClient.get(`/pipeline/${jobId}/results`);
  return data;
};

export const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get('/health');
  return data;
};

export const useLayers = (dataSource = 'nasa_gibs') =>
  useQuery({
    queryKey: ['layers', dataSource],
    queryFn: () => fetchLayers(dataSource),
    staleTime: 5 * 60 * 1000,
  });

export const useLayerCapabilities = (layerId: string | null) =>
  useQuery({
    queryKey: ['layer-capabilities', layerId],
    queryFn: () => fetchLayerCapabilities(layerId!),
    enabled: !!layerId,
    staleTime: 5 * 60 * 1000,
  });

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
    retry: false,
  });

export const useJobStatus = (jobId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 2000;
    },
  });

export const useJobResults = (jobId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['job-results', jobId],
    queryFn: () => fetchJobResults(jobId!),
    enabled: !!jobId && enabled,
    retry: false,
  });

export const useSubmitPipeline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitPipeline,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-status'] });
    },
  });
};

export const getVideoUrl = (jobId: string, type: 'original' | 'interpolated') =>
  `${API_BASE}/pipeline/${jobId}/video/${type}`;

export const getFrameUrl = (jobId: string, idx: number) =>
  `${API_BASE}/pipeline/${jobId}/frames/${idx}`;

export const getMetadataUrl = (jobId: string) =>
  `${API_BASE}/pipeline/${jobId}/metadata`;
