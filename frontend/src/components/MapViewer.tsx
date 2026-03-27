import { useCallback, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
import Static from 'ol/source/ImageStatic';
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { boundingExtent, getCenter } from 'ol/extent';

import { useLayerCapabilities } from '../api/client';
import { useStore } from '../store/useStore';
import PipelineProgress from './PipelineProgress';
import { applyLayerPreset } from '../utils/layerDefaults';

import 'ol/ol.css';

function domainStyle(feature: any) {
  return new Style({
    stroke: new Stroke({ color: '#00d1b2', width: 2, lineDash: [4, 4] }),
    fill: new Fill({ color: 'rgba(0, 209, 178, 0.15)' }),
    text: new Text({
      text: String(feature.get('label') || ''),
      font: 'bold 11px sans-serif',
      fill: new Fill({ color: '#fff' }),
      stroke: new Stroke({ color: '#000', width: 2 }),
      overflow: true,
    }),
  });
}

function bboxToOlCoords(bbox: [number, number, number, number]) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return [
    fromLonLat([minLon, minLat]),
    fromLonLat([minLon, maxLat]),
    fromLonLat([maxLon, maxLat]),
    fromLonLat([maxLon, minLat]),
    fromLonLat([minLon, minLat]),
  ];
}

function clampLon(lon: number) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

function fitExtentFromBbox(bbox: [number, number, number, number]) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const extent = boundingExtent([fromLonLat([minLon, minLat]), fromLonLat([maxLon, maxLat])]);
  const center = getCenter(extent);
  const span = Math.max(Math.abs(maxLon - minLon), Math.abs(maxLat - minLat));
  const zoom = span > 60 ? 3 : span > 30 ? 4 : span > 15 ? 5 : span > 7 ? 6 : 7;
  return { center, zoom };
}

function aoiStyle() {
  return new Style({
    fill: new Fill({ color: 'rgba(80,180,255,0.06)' }),
    stroke: new Stroke({ color: '#40b4ff', width: 1.25, lineDash: [4, 4] }),
  });
}

function footprintStyle() {
  return new Style({
    fill: new Fill({ color: 'rgba(100,255,180,0.03)' }),
    stroke: new Stroke({ color: 'rgba(100,255,180,0.20)', width: 1, lineDash: [6, 6] }),
  });
}

function getLayerLegendText(layerName: string | undefined) {
  if (!layerName) return null;
  const lower = layerName.toLowerCase();
  if (lower.includes('infrared')) {
    return 'IR 10.4 um: brighter = colder/higher cloud tops, darker = warmer surface or lower cloud.';
  }
  if (lower.includes('visible') || lower.includes('true color')) {
    return 'Visible imagery: bright = reflective clouds in daylight. Night scenes may be dark.';
  }
  return null;
}

export default function MapViewer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const aoiSource = useRef<VectorSource | null>(null);
  const footprintSource = useRef<VectorSource | null>(null);
  const domainSource = useRef<VectorSource | null>(null);
  const overlayLayer = useRef<ImageLayer<Static> | null>(null);

  const {
    bbox,
    setBbox,
    layers,
    selectedLayer,
    selectedPresetKey,
    setSelectedPresetKey,
    pipelineResult,
    currentFrameIndex,
  } = useStore();
  const { data: layerCapabilities } = useLayerCapabilities(selectedLayer);

  const selectedLayerInfo = layers.find((layer) => layer.layer_id === selectedLayer) ?? null;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const footprintSrc = new VectorSource();
    footprintSource.current = footprintSrc;
    const footprintLayer = new VectorLayer({ source: footprintSrc, style: footprintStyle(), zIndex: 1 });

    const presetSrc = new VectorSource();
    domainSource.current = presetSrc;
    const presetLayer = new VectorLayer({ source: presetSrc, style: domainStyle, zIndex: 2, properties: { name: 'domain-layer' } });

    const aoiSrc = new VectorSource();
    aoiSource.current = aoiSrc;
    const aoiLayer = new VectorLayer({ source: aoiSrc, style: aoiStyle(), zIndex: 3 });

    const pipelineLayer = new ImageLayer<Static>({ opacity: 0.95, zIndex: 4 });
    overlayLayer.current = pipelineLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), footprintLayer, presetLayer, pipelineLayer, aoiLayer],
      view: new View({ center: fromLonLat([80, 15]), zoom: 5, minZoom: 2, maxZoom: 14 }),
      controls: defaultControls({ attributionOptions: { collapsible: true } }),
    });

    map.on('singleclick', (evt) => {
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        if (!feature.get('isPreset')) return false;

        const presetKey = String(feature.get('presetKey'));
        const { layers, selectedLayer } = useStore.getState();
        const layer = layers.find((item) => item.layer_id === selectedLayer) ?? null;
        applyLayerPreset(layer, presetKey, {
          setSelectedPresetKey: useStore.getState().setSelectedPresetKey,
          setBbox: useStore.getState().setBbox,
          setTimeStart: useStore.getState().setTimeStart,
          setTimeEnd: useStore.getState().setTimeEnd,
        }, layerCapabilities ?? undefined);
        return true;
      });
    });

    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: (layer) => layer.get('name') === 'domain-layer',
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapInstance.current = map;
    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, [layerCapabilities]);

  useEffect(() => {
    if (!aoiSource.current || !mapInstance.current) return;
    aoiSource.current.clear();
    if (!bbox) return;

    aoiSource.current.addFeature(new Feature(new Polygon([bboxToOlCoords(bbox)])));
    const { center, zoom } = fitExtentFromBbox(bbox);
    mapInstance.current.getView().animate({ center, zoom, duration: 600 });
  }, [bbox]);

  useEffect(() => {
    if (!footprintSource.current || !domainSource.current) return;

    footprintSource.current.clear();
    domainSource.current.clear();
    if (!selectedLayerInfo) return;

    const lonMin = selectedLayerInfo.coverage_lon_min;
    const lonMax = selectedLayerInfo.coverage_lon_max;
    const latMin = selectedLayerInfo.coverage_lat_min ?? -60;
    const latMax = selectedLayerInfo.coverage_lat_max ?? 60;

    if (lonMin != null && lonMax != null) {
      const effectiveLonMax = lonMax > 180 ? 180 : lonMax;
      const ring = [
        fromLonLat([clampLon(lonMin), latMin]),
        fromLonLat([clampLon(lonMin), latMax]),
        fromLonLat([clampLon(effectiveLonMax), latMax]),
        fromLonLat([clampLon(effectiveLonMax), latMin]),
        fromLonLat([clampLon(lonMin), latMin]),
      ];
      footprintSource.current.addFeature(new Feature(new Polygon([ring])));
    }

    if (selectedLayerInfo.preset_regions) {
      Object.entries(selectedLayerInfo.preset_regions).forEach(([key, preset]) => {
        const region = preset as { bbox: [number, number, number, number]; label: string };
        const ring = bboxToOlCoords(region.bbox);
        const feature = new Feature(new Polygon([ring]));
        feature.set('isPreset', true);
        feature.set('presetKey', key);
        feature.set('label', region.label);
        domainSource.current?.addFeature(feature);
      });
    }
  }, [selectedLayerInfo]);

  useEffect(() => {
    if (!overlayLayer.current || !pipelineResult || pipelineResult.frames.length === 0 || !bbox) {
      overlayLayer.current?.setSource(null);
      return;
    }

    const frame = pipelineResult.frames[currentFrameIndex];
    if (!frame) return;

    const projectedExtent = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
    overlayLayer.current.setSource(new Static({
      url: `/api/v1/pipeline/${pipelineResult.job_id}/frames/${currentFrameIndex}`,
      imageExtent: projectedExtent,
    }));
  }, [pipelineResult, currentFrameIndex, bbox]);

  const clearAoi = useCallback(() => {
    setSelectedPresetKey(null);
    setBbox(null);
    aoiSource.current?.clear();
  }, [setSelectedPresetKey, setBbox]);

  const currentFrame = pipelineResult?.frames[currentFrameIndex];
  const layerLegendText = getLayerLegendText(selectedLayerInfo?.name);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} className="ol-map" style={{ width: '100%', height: '100%' }} />

      {!bbox && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(12,18,30,0.88)', border: '1px dashed rgba(64,180,255,0.35)', padding: '10px 18px', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 12, color: 'var(--map-t1)', fontFamily: 'var(--cond)', fontWeight: 600, letterSpacing: '0.06em' }}>SELECT A SATELLITE LAYER</div>
          <div style={{ fontSize: 9.5, color: 'var(--map-t2)', marginTop: 4, fontFamily: 'var(--mono)' }}>Domain will auto-fill from available presets</div>
        </div>
      )}

      {bbox && selectedLayerInfo && (
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(10,16,28,0.88)', border: '1px solid rgba(64,180,255,0.30)', padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 8.5 }}>
          <div style={{ color: '#40b4ff', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 1 }}>{selectedLayerInfo.name}</div>
          <div style={{ color: 'var(--map-t3)', fontSize: 7.5 }}>{selectedPresetKey ? `Preset: ${selectedPresetKey}` : 'Custom AOI'}</div>
        </div>
      )}

      {currentFrame && (
        <div className="map-overlay">
          <div className="mo-row"><span className="mo-key">Frame</span><span className="mo-val">#{currentFrameIndex + 1} / {pipelineResult!.frames.length}</span></div>
          <div className="mo-row"><span className="mo-key">Timestamp</span><span className="mo-val">{new Date(currentFrame.timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC</span></div>
          <div className="mo-row"><span className="mo-key">Type</span><span className={`mo-val ${currentFrame.is_interpolated ? 'warn' : 'ok'}`}>{currentFrame.is_interpolated ? 'AI-Generated' : 'Observed'}</span></div>
          <div className="mo-row"><span className="mo-key">Model</span><span className="mo-val">{currentFrame.model_used ?? (currentFrame.is_interpolated ? 'unknown' : 'observed')}</span></div>
        </div>
      )}

      {bbox && layerLegendText && (
        <div style={{ position: 'absolute', top: 78, left: 8, maxWidth: 300, background: 'rgba(10,16,28,0.88)', border: '1px solid rgba(64,180,255,0.18)', padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: 8.25, lineHeight: 1.45, color: 'var(--map-t2)' }}>
          {layerLegendText}
        </div>
      )}

      {bbox && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,16,28,0.92)', borderTop: '1px solid var(--map-b1)', height: 22, display: 'flex', alignItems: 'center', padding: '0 8px', fontFamily: 'var(--mono)', fontSize: 9 }}>
          <span style={{ color: 'var(--map-t3)', paddingRight: 10, borderRight: '1px solid var(--map-b1)' }}>AOI</span>
          <span style={{ color: '#40b4ff', padding: '0 10px', borderRight: '1px solid var(--map-b1)' }}>{bbox[0].toFixed(2)}-{bbox[2].toFixed(2)}E</span>
          <span style={{ color: '#40b4ff', padding: '0 10px', borderRight: '1px solid var(--map-b1)' }}>{bbox[1].toFixed(2)}-{bbox[3].toFixed(2)}N</span>
          <span style={{ marginLeft: 'auto', color: '#b82020', cursor: 'pointer', padding: '0 8px', borderLeft: '1px solid var(--map-b1)' }} onClick={clearAoi} title="Clear AOI">Clear</span>
        </div>
      )}

      <PipelineProgress />
    </div>
  );
}
