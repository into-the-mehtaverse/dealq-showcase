/**
 * Utility functions for calculating real estate metrics
 */

/**
 * Calculate Net Operating Income (NOI)
 * NOI = Revenue - Expenses
 */
export function calculateNOI(revenue: number | null | undefined, expenses: number | null | undefined): number | null {
  if (revenue === null || revenue === undefined || expenses === null || expenses === undefined) {
    return null;
  }
  return revenue - expenses;
}

/**
 * Calculate Cap Rate
 * Cap Rate = NOI / Asking Price
 */
export function calculateCapRate(noi: number | null, askingPrice: number | null | undefined): number | null {
  if (noi === null || askingPrice === null || askingPrice === undefined || askingPrice === 0) {
    return null;
  }
  return (noi / askingPrice) * 100; // Convert to percentage
}

/**
 * Calculate Price Per Unit
 * Price Per Unit = Asking Price / Number of Units
 */
export function calculatePricePerUnit(askingPrice: number | null | undefined, numberOfUnits: number | null | undefined): number | null {
  if (askingPrice === null || askingPrice === undefined || numberOfUnits === null || numberOfUnits === undefined || numberOfUnits === 0) {
    return null;
  }
  return askingPrice / numberOfUnits;
}
