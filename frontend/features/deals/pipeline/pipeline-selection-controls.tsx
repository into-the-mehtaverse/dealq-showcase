"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckSquare, Square, X, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ConfirmationModal from '../shared/confirmation-modal';
import {
  usePipelineStore,
  selectSelectedCount,
  selectHasSelection,
  selectIsAllSelected,
  selectIsSelectionMode,
  selectSelectedDealIds
} from './store';

interface PipelineSelectionControlsProps {
  className?: string;
}

export default function PipelineSelectionControls({ className }: PipelineSelectionControlsProps) {
  // Local state for confirmation modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingDeals, setIsDeletingDeals] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<'active' | 'draft' | 'dead' | null>(null);

  // Store state
  const selectedCount = usePipelineStore(selectSelectedCount);
  const hasSelection = usePipelineStore(selectHasSelection);
  const isAllSelected = usePipelineStore(selectIsAllSelected);
  const isSelectionMode = usePipelineStore(selectIsSelectionMode);
  const selectedDealIds = usePipelineStore(selectSelectedDealIds);

  // Store actions
  const { selectAll, clearSelection, toggleSelectionMode, bulkDeleteDeals, bulkUpdateStatus } = usePipelineStore();

  const handleToggleSelectionMode = () => {
    toggleSelectionMode();
  };

  const handleSelectAll = () => {
    selectAll();
  };

  const handleClearSelection = () => {
    clearSelection();
  };

    const handleBulkDeleteClick = () => {
    if (selectedCount === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeletingDeals(true);

    // Show loading toast
    const loadingToast = toast.loading(`Deleting ${selectedCount} deal${selectedCount > 1 ? 's' : ''}...`);

    try {
      const result = await bulkDeleteDeals(selectedDealIds);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success(`Successfully deleted ${result.deletedCount} deal${result.deletedCount > 1 ? 's' : ''}`);

        // Close modal
        setIsDeleteModalOpen(false);
      } else {
        // Show error toast
        toast.error(`Failed to delete ${result.failedDeals.length} deal${result.failedDeals.length > 1 ? 's' : ''}. Please try again.`);
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error('An error occurred while deleting deals. Please try again.');
      console.error('Error during bulk delete:', error);
    } finally {
      setIsDeletingDeals(false);
    }
  };

  const handleBulkStatusUpdateClick = (newStatus: 'active' | 'draft' | 'dead') => {
    if (selectedCount === 0) return;
    setPendingStatusUpdate(newStatus);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;

    setIsUpdatingStatus(true);

    const statusLabels = {
      active: 'Active',
      draft: 'Draft',
      dead: 'Dead'
    };

    // Show loading toast
    const loadingToast = toast.loading(`Moving ${selectedCount} deal${selectedCount > 1 ? 's' : ''} to ${statusLabels[pendingStatusUpdate]}...`);

    try {
      const result = await bulkUpdateStatus(selectedDealIds, pendingStatusUpdate);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success(`Successfully moved ${result.updatedCount} deal${result.updatedCount > 1 ? 's' : ''} to ${statusLabels[pendingStatusUpdate]}`);

        // Close modal
        setIsStatusModalOpen(false);
        setPendingStatusUpdate(null);
      } else {
        // Show error toast
        toast.error(`Failed to move ${result.failedDeals.length} deal${result.failedDeals.length > 1 ? 's' : ''}. Please try again.`);
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error('An error occurred while updating deal statuses. Please try again.');
      console.error('Error during bulk status update:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Don't render anything if not in selection mode and no selection
  if (!isSelectionMode && !hasSelection) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleSelectionMode}
        className={cn("h-8 px-3 gap-2", className)}
      >
        <CheckSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Select</span>
        <span className="sm:hidden">Select</span>
      </Button>
    );
  }

  // Render selection controls when in selection mode or has selection
  return (
    <div className="flex items-center gap-2">
      {/* Selection Mode Toggle */}
      <Button
        variant={isSelectionMode ? "default" : "outline"}
        size="sm"
        onClick={handleToggleSelectionMode}
        className={cn("h-8", isSelectionMode ? "px-2" : "px-3 gap-2", className)}
      >
        {isSelectionMode ? (
          <CheckSquare className="w-4 h-4" />
        ) : (
          <>
            <Square className="w-4 h-4" />
            <span className="hidden sm:inline">Select</span>
            <span className="sm:hidden">Select</span>
          </>
        )}
      </Button>

      {/* Selection Count Badge */}
      {hasSelection && (
        <Badge variant="secondary" className="h-8 px-3 text-sm">
          {selectedCount} selected
        </Badge>
      )}

      {/* Selection Actions */}
      {isSelectionMode && (
        <div className="flex items-center gap-1">
          {/* Select All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="h-8 px-2 text-xs"
          >
            Select All
          </Button>

          {/* Bulk Actions Dropdown */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  <MoreHorizontal className="w-3 h-3 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Change Status Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusUpdateClick('active')}
                      className="text-xs text-green-600"
                    >
                      Move to Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusUpdateClick('draft')}
                      className="text-xs text-orange-600"
                    >
                      Move to Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusUpdateClick('dead')}
                      className="text-xs text-red-600"
                    >
                      Move to Dead
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Delete Option */}
                <DropdownMenuItem
                  onClick={handleBulkDeleteClick}
                  className="text-xs text-red-600 focus:text-red-600"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear Selection Button */}
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Selected Deals"
        description={`Are you sure you want to delete ${selectedCount} selected deal${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingDeals}
        loadingText="Deleting..."
        variant="destructive"
      />

      {/* Bulk Status Update Confirmation Modal */}
      <ConfirmationModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        title="Change Deal Status"
        description={`Are you sure you want to move ${selectedCount} selected deal${selectedCount > 1 ? 's' : ''} to ${pendingStatusUpdate ? pendingStatusUpdate.charAt(0).toUpperCase() + pendingStatusUpdate.slice(1) : ''}?`}
        confirmText="Move"
        cancelText="Cancel"
        onConfirm={handleConfirmStatusUpdate}
        isLoading={isUpdatingStatus}
        loadingText="Moving..."
        variant="default"
      />
    </div>
  );
}
