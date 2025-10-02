"use client";

import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ReactNode } from 'react';

interface PdfControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClick?: () => void;
  tooltip?: ReactNode;
}

export function PdfControls({ zoom, onZoomIn, onZoomOut, onResetZoom, onClick, tooltip }: PdfControlsProps) {
  return (
    <div className="border-b border-slate-200 py-1 px-2 flex justify-center items-center" onClick={onClick}>
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <Button
          onClick={onZoomOut}
          variant="ghost"
          size="sm"
          title="Zoom Out"
          aria-label="Zoom Out"
          className="h-7"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <Button
          onClick={onResetZoom}
          variant="ghost"
          size="sm"
          title="Reset Zoom"
          aria-label="Reset Zoom"
          className="h-7"
        >
          {Math.round(zoom * 100)}%
        </Button>

        <Button
          onClick={onZoomIn}
          variant="ghost"
          size="sm"
          title="Zoom In"
          aria-label="Zoom In"
          className="h-7"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          onClick={onResetZoom}
          variant="ghost"
          size="sm"
          title="Reset View"
          aria-label="Reset View"
          className="h-7"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* Tooltip */}
        {tooltip && tooltip}
      </div>
    </div>
  );
}
