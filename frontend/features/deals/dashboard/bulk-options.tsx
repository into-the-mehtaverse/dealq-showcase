"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Trash2, ArrowLeft, Download } from 'lucide-react';

interface BulkOptionsProps {
  isSelectionMode: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onToggleSelectionMode: () => void;
  onDeleteDeals: () => void;
  onExportDeals: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export default function BulkOptions({
  isSelectionMode,
  selectedCount,
  isDeleting,
  onToggleSelectionMode,
  onDeleteDeals,
  onExportDeals,
  onClearSelection,
  onDeleteSelected,
}: BulkOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      {!isSelectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDeleteDeals}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Deals
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportDeals}>
              <Download className="mr-2 h-4 w-4" />
              Export as List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Selection Mode Controls */}
      {isSelectionMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedCount} deal(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                disabled={selectedCount === 0}
                className="h-8"
              >
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0 || isDeleting}
                className="flex items-center gap-2 h-8"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleSelectionMode}
                className="flex items-center gap-2 h-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
