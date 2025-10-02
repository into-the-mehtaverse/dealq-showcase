import { UnderwritingAssumptions, NOIProjection } from './types';
import { roundToDecimals } from './utils';

/**
 * Calculates year 1 NOI based on revenue and expenses
 */
export function calculateYear1NOI(year1Revenue: number, year1Expenses: number): number {
  return roundToDecimals(year1Revenue - year1Expenses);
}

/**
 * Projects NOI for future years based on growth assumptions
 * Calculates up to holdPeriodYears + 1 (e.g., 5 years = 6 years of projections)
 */
export function projectNOI(
  year1Revenue: number,
  year1Expenses: number,
  assumptions: UnderwritingAssumptions
): NOIProjection[] {
  const projections: NOIProjection[] = [];
  const totalYears = assumptions.holdPeriodYears + 1; // Hold period + 1 year

  for (let year = 1; year <= totalYears; year++) {
    let projectedRevenue: number;
    let projectedExpenses: number;

    if (year === 1) {
      // Year 1 uses the input values
      projectedRevenue = year1Revenue;
      projectedExpenses = year1Expenses;
    } else {
      // Future years: apply growth rates to previous year's values
      const previousRevenue = projections[year - 2].grossRevenue;
      const previousExpenses = projections[year - 2].operatingExpenses;

      projectedRevenue = previousRevenue * (1 + assumptions.revenueGrowth);
      projectedExpenses = previousExpenses * (1 + assumptions.expenseGrowth);
    }

    const projectedNOI = projectedRevenue - projectedExpenses;

    projections.push({
      year,
      grossRevenue: roundToDecimals(projectedRevenue),
      operatingExpenses: roundToDecimals(projectedExpenses),
      netOperatingIncome: roundToDecimals(projectedNOI)
    });
  }

  return projections;
}

/**
 * Calculates NOI projections from revenue, expenses and assumptions
 */
export function calculateNOIProjections(
  year1Revenue: number,
  year1Expenses: number,
  assumptions: UnderwritingAssumptions
): { year1NOI: number; projections: NOIProjection[] } {
  const year1NOI = calculateYear1NOI(year1Revenue, year1Expenses);
  const projections = projectNOI(year1Revenue, year1Expenses, assumptions);

  return {
    year1NOI,
    projections
  };
}

/**
 * Calculates NOI margin (NOI / Gross Revenue)
 */
export function calculateNOIMargin(noi: number, grossRevenue: number): number {
  if (grossRevenue === 0) return 0;
  return roundToDecimals(noi / grossRevenue, 4);
}

/**
 * Calculates expense ratio (Operating Expenses / Gross Revenue)
 */
export function calculateExpenseRatio(operatingExpenses: number, grossRevenue: number): number {
  if (grossRevenue === 0) return 0;
  return roundToDecimals(operatingExpenses / grossRevenue, 4);
}

/**
 * Calculates NOI per unit
 */
export function calculateNOIPerUnit(noi: number, totalUnits: number): number {
  if (totalUnits === 0) return 0;
  return roundToDecimals(noi / totalUnits);
}

/**
 * Calculates NOI per square foot
 */
export function calculateNOIPerSqFt(noi: number, grossSqFt: number): number {
  if (grossSqFt === 0) return 0;
  return roundToDecimals(noi / grossSqFt);
}
