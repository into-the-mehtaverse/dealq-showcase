import { useState, useCallback } from 'react';

interface PanPosition {
  x: number;
  y: number;
}

export function usePdfViewport() {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 5.0));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.1));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const updateZoom = useCallback((newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  }, []);

  const updatePan = useCallback((newPan: PanPosition) => {
    setPan(newPan);
  }, []);

  return {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    resetView,
    setZoom: updateZoom,
    setPan: updatePan
  };
}
