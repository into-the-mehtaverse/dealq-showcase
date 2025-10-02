"use client";

import { useRef, useEffect, useCallback, ReactNode } from 'react';

interface PdfGestureHandlerProps {
  children: ReactNode;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
}

export function PdfGestureHandler({
  children,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  containerRef,
  isActive
}: PdfGestureHandlerProps) {
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });

  // Mouse event handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!isActive) return; // Only process when active

    if (e.button === 0) { // Left mouse button only
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }, [isActive]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return; // Only process when active

    if (isDragging.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      onPanChange({
        x: pan.x + deltaX,
        y: pan.y + deltaY
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, [isActive, pan, onPanChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isActive) return; // Only process when active

    if (e.touches.length === 1) {
      // Single touch - start panning
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      lastTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      lastTouchCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    }
  }, [isActive]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isActive) return; // Only process when active

    if (e.touches.length === 1 && isDragging.current) {
      // Single touch panning
      const deltaX = e.touches[0].clientX - lastMousePos.current.x;
      const deltaY = e.touches[0].clientY - lastMousePos.current.y;

      onPanChange({
        x: pan.x + deltaX,
        y: pan.y + deltaY
      });

      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two touch pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance.current > 0) {
        const scale = currentDistance / lastTouchDistance.current;
        const newZoom = Math.max(0.1, Math.min(5, zoom * scale));

        // Calculate the center point of the pinch gesture
        const currentTouchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };

        // Get container bounds to convert screen coordinates to container coordinates
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const containerCenterX = rect.width / 2;
          const containerCenterY = rect.height / 2;

          // Convert touch center to container-relative coordinates
          const touchCenterX = currentTouchCenter.x - rect.left;
          const touchCenterY = currentTouchCenter.y - rect.top;

          // Calculate how much the pan needs to change to keep the touch center stable
          const zoomRatio = newZoom / zoom;
          const newPanX = pan.x + (touchCenterX - containerCenterX) * (1 - zoomRatio);
          const newPanY = pan.y + (touchCenterY - containerCenterY) * (1 - zoomRatio);

          // Apply both zoom and pan changes
          onZoomChange(newZoom);
          onPanChange({ x: newPanX, y: newPanY });
        } else {
          // Fallback if container ref is not available
          onZoomChange(newZoom);
        }

        lastTouchDistance.current = currentDistance;
      }
    }

    e.preventDefault();
  }, [isActive, pan, zoom, onPanChange, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastTouchDistance.current = 0;
  }, []);

  // Wheel event handler for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isActive) return; // Only process when active

    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

    // Zoom towards mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new pan to zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      const newPanX = pan.x + (mouseX - rect.width / 2) * (1 - zoomRatio);
      const newPanY = pan.y + (mouseY - rect.height / 2) * (1 - zoomRatio);

      onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    }
  }, [isActive, zoom, pan, onZoomChange, onPanChange]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Wheel events - only prevent default when active
    const handleWheelWithConditionalPrevent = (e: WheelEvent) => {
      if (isActive) {
        handleWheel(e);
      }
      // When not active, don't prevent default so scrolling works
    };

    container.addEventListener('wheel', handleWheelWithConditionalPrevent, { passive: !isActive });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheelWithConditionalPrevent);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, isActive]);

  return (
    <div
      className={`h-full w-full ${isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      style={{
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
    >
      {children}
    </div>
  );
}
