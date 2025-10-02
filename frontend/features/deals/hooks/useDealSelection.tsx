"use client";

import { useState, useCallback } from 'react';

export function useDealSelection() {
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleSelectionChange = useCallback((dealId: string, selected: boolean) => {
    setSelectedDeals(prev => {
      const newSelected = new Set(prev);
      if (selected) {
        newSelected.add(dealId);
      } else {
        newSelected.delete(dealId);
      }
      return newSelected;
    });
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Entering selection mode - clear any existing selections
        setSelectedDeals(new Set());
      } else {
        // Exiting selection mode - clear selections
        setSelectedDeals(new Set());
      }
      return newMode;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDeals(new Set());
  }, []);

  const selectAll = useCallback((dealIds: string[]) => {
    setSelectedDeals(new Set(dealIds));
  }, []);

  const isSelected = useCallback((dealId: string) => {
    return selectedDeals.has(dealId);
  }, [selectedDeals]);

  const getSelectedCount = useCallback(() => {
    return selectedDeals.size;
  }, [selectedDeals]);

  const getSelectedDeals = useCallback(() => {
    return Array.from(selectedDeals);
  }, [selectedDeals]);

  return {
    // State
    selectedDeals,
    isSelectionMode,
    selectedCount: selectedDeals.size,

    // Actions
    handleSelectionChange,
    handleToggleSelectionMode,
    clearSelection,
    selectAll,

    // Utilities
    isSelected,
    getSelectedCount,
    getSelectedDeals,
  };
}
