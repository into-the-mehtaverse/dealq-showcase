"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDeal } from "@/lib/api/actions/deleteDeals";
import { toast } from "sonner";
import ConfirmationModal from "../shared/confirmation-modal";
import { useDealSelectors, useDealActions } from "./store";

interface DealActionsProps {
  dealId?: string;
  propertyName?: string;
  onDealDeleted?: () => void;
}

export default function DealActions({
  dealId,
  propertyName = "this deal",
  onDealDeleted
}: DealActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get store data and actions
  const isEditing = useDealSelectors.useIsEditing();
  const hasUnsavedChanges = useDealSelectors.useHasUnsavedChanges();
  const { startEditing, saveChanges, cancelEditing, discardChanges } = useDealActions();



  const handleEditClick = () => {
    startEditing();
  };

  const handleSaveClick = async () => {
    try {
      await saveChanges();
      toast.success("Deal updated successfully");
    } catch (error) {
      console.error('Failed to save changes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error("Failed to save changes", {
        description: errorMessage
      });
    }
  };

  const handleCancelClick = () => {
    discardChanges();
    cancelEditing();
    toast.info("Changes discarded");
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dealId) return;

    setIsDeleting(true);
    try {
      await deleteDeal(dealId);
      setIsDeleteModalOpen(false);

      // Show success toast
      toast.success(
        propertyName
          ? `"${propertyName}" has been deleted successfully`
          : "Deal deleted successfully"
      );

      onDealDeleted?.();
    } catch (error) {
      console.error('Failed to delete deal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Show error toast
      toast.error(
        propertyName
          ? `Failed to delete "${propertyName}"`
          : "Failed to delete deal",
        {
          description: errorMessage
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Save/Cancel buttons - shown when in edit mode */}
        {isEditing && (
          <>
            <Button
              onClick={handleSaveClick}
              size="sm"
              className="gap-2"
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}

        {/* More actions dropdown */}
        <Card className="p-1 bg-transparent shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left">
              <DropdownMenuItem
                onClick={handleEditClick}
                disabled={isEditing}
                className="text-gray-700"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Deal
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDeleteClick}
                className="text-red-600"
                disabled={!dealId}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Deal"
        description={`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`}
        confirmText="Delete Deal"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        loadingText="Deleting..."
        variant="destructive"
      />
    </>
  );
}
