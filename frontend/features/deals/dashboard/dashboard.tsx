"use client";

import { useState, useEffect } from 'react';
import { getDeals } from '@/lib/api/actions/getDeals';
import { deleteMultipleDeals } from '@/lib/api/actions/deleteDeals';
import { DealSummary } from '@/types/api/dealSummary';
import DealCardDetailed from '../shared/deal-card-detailed';
import DealCardSkeleton from './deal-card-skeleton';
import GridWidget from './grid-widget';
import SimpleUploadArea from './simple-upload-area';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';
import BulkOptions from './bulk-options';
import ConfirmationModal from '../shared/confirmation-modal';
import { useDealSelection } from '../hooks/useDealSelection';
import { toast } from 'sonner';
import {
  showDealsDeletedSuccess,
  showDealsDeleteError,
  showNetworkError,
  showAuthError
} from '../utils/notifications';

export default function DealsDashboard() {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<DealSummary[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    activeDealsCount: 0,
    last30DaysTotalValue: 0,
    draftDealsCount: 0,
    last30DaysDealsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    selectedDeals,
    isSelectionMode,
    selectedCount,
    handleSelectionChange,
    handleToggleSelectionMode,
    clearSelection,
  } = useDealSelection();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDeals();

        // Handle new response format with metrics
        if ('deals' in response && 'active_deals_count' in response && 'last_30_days_total_value' in response) {
          setDeals(response.deals as DealSummary[]);
          setFilteredDeals(response.deals as DealSummary[]);
          setDashboardMetrics({
            activeDealsCount: response.active_deals_count as number,
            last30DaysTotalValue: response.last_30_days_total_value as number,
            draftDealsCount: response.draft_deals_count as number,
            last30DaysDealsCount: response.last_30_days_deals_count as number
          });
        } else {
          // Fallback for old format
          setDeals(response as DealSummary[]);
          setFilteredDeals(response as DealSummary[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deals');
        console.error('Error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleDeleteDeals = () => {
    handleToggleSelectionMode();
  };

  const handleExportDeals = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon!');
  };

    const handleDeleteSelected = () => {
    if (selectedDeals.size === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmDeleteSelected = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);

    try {
      const result = await deleteMultipleDeals(Array.from(selectedDeals));
      console.log('Bulk delete result:', result);

      // Show success message with details
      const failedCount = result.failed_deals?.length || 0;
      const successCount = result.deleted_count || 0;

      if (successCount > 0) {
        showDealsDeletedSuccess(successCount, failedCount);
      } else {
        showDealsDeleteError('No deals were deleted', selectedDeals.size);
      }

      // Refresh deals list
      const dealsData = await getDeals();
      setDeals(dealsData.deals);
      setFilteredDeals(dealsData.deals);

      // Exit selection mode
      handleToggleSelectionMode();
    } catch (error) {
      console.error('Error deleting deals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Handle different types of errors
      if (errorMessage.includes('Authentication required') || errorMessage.includes('Please log in')) {
        showAuthError();
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        showNetworkError();
      } else {
        showDealsDeleteError(errorMessage, selectedDeals.size);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="text-center">
                <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Deals</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container bg-background rounded-lg mx-auto p-6">
      {/* Quick Upload Area */}
      <SimpleUploadArea className="mb-4" />

      {/* Analytics Grid Widget */}
      <GridWidget
        activeDealsCount={dashboardMetrics.activeDealsCount}
        totalValue={dashboardMetrics.last30DaysTotalValue}
        draftDealsCount={dashboardMetrics.draftDealsCount}
        last30DaysDealsCount={dashboardMetrics.last30DaysDealsCount}
      />

      {/* Filters and Bulk Actions Bar */}



      {/* Deals Grid */}
      <Card className="bg-background border-0 shadow-none -mt-6">
        <CardHeader className="pb-0 -mb-2 flex justify-between">
          <h2 className="text-lg font-semibold text-slate-700 tracking-wide">
            RECENT DEALS:
          </h2>
          <div className="">
        <div className="flex items-center gap-4">
          {/* <FilterPanel
            onFilterChange={(filters) => {
              // For now, just show all deals - implement actual filtering logic later
              setFilteredDeals(deals);
            }}
          /> */}

          <BulkOptions
            isSelectionMode={isSelectionMode}
            selectedCount={selectedCount}
            isDeleting={isDeleting}
            onToggleSelectionMode={handleToggleSelectionMode}
            onDeleteDeals={handleDeleteDeals}
            onExportDeals={handleExportDeals}
            onClearSelection={clearSelection}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
      </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Add New Deal Card - Always First */}
            <Card className="group items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-dashed border-muted-foreground/20 hover:border-primary">
              <Link href="/upload" className="block">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      Add New Deal
                    </h3>
                    <p className="text-sm text-muted-foreground group-hover:text-primary/70 transition-colors">
                      Upload documents to analyze a new property
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            {/* Existing Deals */}
            {filteredDeals.map((deal) => (
              <DealCardDetailed
                key={deal.id}
                deal={deal}
                isSelectionMode={isSelectionMode}
                isSelected={selectedDeals.has(deal.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Deals"
        description={`Are you sure you want to delete ${selectedCount} deal(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteSelected}
        isLoading={isDeleting}
        loadingText="Deleting..."
        variant="destructive"
      />
    </div>
  );
}
