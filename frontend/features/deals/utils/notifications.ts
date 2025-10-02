import { toast } from "sonner";

// Success notifications
export const showDealDeletedSuccess = (dealName?: string) => {
  toast.success(
    dealName
      ? `"${dealName}" has been deleted successfully`
      : "Deal deleted successfully"
  );
};

export const showDealsDeletedSuccess = (count: number, failedCount: number = 0) => {
  if (failedCount > 0) {
    toast.success(
      `Successfully deleted ${count} deal(s). ${failedCount} deal(s) failed to delete.`,
      {
        description: "Check the console for detailed error information."
      }
    );
  } else {
    toast.success(`Successfully deleted ${count} deal(s)`);
  }
};

// Error notifications
export const showDealDeleteError = (error: string, dealName?: string) => {
  toast.error(
    dealName
      ? `Failed to delete "${dealName}"`
      : "Failed to delete deal",
    {
      description: error
    }
  );
};

export const showDealsDeleteError = (error: string, count: number) => {
  toast.error(
    `Failed to delete ${count} deal(s)`,
    {
      description: error
    }
  );
};

// Loading notifications
export const showDealDeleteLoading = (dealName?: string) => {
  return toast.loading(
    dealName
      ? `Deleting "${dealName}"...`
      : "Deleting deal..."
  );
};

export const showDealsDeleteLoading = (count: number) => {
  return toast.loading(`Deleting ${count} deal(s)...`);
};

// Confirmation notifications
export const showDeleteConfirmation = (count: number) => {
  toast.warning(
    `Are you sure you want to delete ${count} deal(s)?`,
    {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          // This will be handled by the component
          return true;
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          // This will be handled by the component
          return false;
        }
      }
    }
  );
};

// Network/authentication errors
export const showNetworkError = () => {
  toast.error(
    "Network error",
    {
      description: "Please check your internet connection and try again."
    }
  );
};

export const showAuthError = () => {
  toast.error(
    "Authentication required",
    {
      description: "Please log in to perform this action."
    }
  );
};
