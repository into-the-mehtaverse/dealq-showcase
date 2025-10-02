import {
  UnderwritingAssumptions,
  NOIProjection,
  ProFormaCashFlow,
  ExitAnalysis,
  DebtServiceCalculation
} from './types';
import { roundToDecimals } from './utils';

/**
 * Builds pro forma cash flows for the hold period
 */
export function buildProFormaCashFlows(
  noiProjections: NOIProjection[],
  debtService: DebtServiceCalculation,
  exitAnalysis?: ExitAnalysis
): ProFormaCashFlow[] {
  const proFormaCashFlows: ProFormaCashFlow[] = [];
  let cumulativeCashFlow = 0;

  for (let i = 0; i < noiProjections.length; i++) {
    const noiProjection = noiProjections[i];
    const isFinalYear = i === noiProjections.length - 1;

    // Operating cash flow (NOI - debt service)
    const operatingCashFlow = noiProjection.netOperatingIncome - debtService.annualDebtService;

    // Final year includes exit proceeds
    let cashFlow = operatingCashFlow;
    if (isFinalYear && exitAnalysis) {
      // Final year: operating cash flow + exit proceeds
      cashFlow = operatingCashFlow + exitAnalysis.netSaleProceeds;
    }

    cumulativeCashFlow += cashFlow;

    proFormaCashFlows.push({
      year: noiProjection.year,
      grossRevenue: noiProjection.grossRevenue,
      operatingExpenses: noiProjection.operatingExpenses,
      netOperatingIncome: noiProjection.netOperatingIncome,
      debtService: debtService.annualDebtService,
      cashFlow: roundToDecimals(cashFlow),
      cumulativeCashFlow: roundToDecimals(cumulativeCashFlow)
    });
  }

  return proFormaCashFlows;
}

/**
 * Calculates exit analysis based on final year NOI and exit cap rate
 */
export function calculateExitAnalysis(
  noiProjections: NOIProjection[],
  assumptions: UnderwritingAssumptions,
  debtService: DebtServiceCalculation
): ExitAnalysis {
  // Exit year is the final year of projections (holdPeriodYears + 1)
  const exitYear = assumptions.holdPeriodYears + 1;
  const finalYearNOI = noiProjections[exitYear - 1]?.netOperatingIncome || 0;

  // Calculate exit value based on final year NOI and exit cap rate
  const exitValue = finalYearNOI / assumptions.exitCapRate;

  // Calculate remaining debt at exit (interest-only loan)
  const remainingDebt = calculateRemainingDebt(
    debtService.loanAmount,
    exitYear,
    assumptions.loanTermYears
  );

  const saleProceeds = exitValue;
  const netSaleProceeds = saleProceeds - remainingDebt;

  return {
    exitYear,
    exitNOI: roundToDecimals(finalYearNOI),
    exitValue: roundToDecimals(exitValue),
    saleProceeds: roundToDecimals(saleProceeds),
    remainingDebt: roundToDecimals(remainingDebt),
    netSaleProceeds: roundToDecimals(netSaleProceeds)
  };
}

/**
 * Calculates remaining debt at any point in time
 */
function calculateRemainingDebt(
  initialLoanAmount: number,
  yearsElapsed: number,
  loanTermYears: number
): number {
  // For interest-only loan, principal remains constant until maturity
  if (yearsElapsed >= loanTermYears) {
    return 0; // Loan is fully paid off
  }
  return roundToDecimals(initialLoanAmount);
}

/**
 * Calculates total investment metrics
 */
export function calculateInvestmentMetrics(
  purchasePrice: number,
  debtService: DebtServiceCalculation,
  proFormaCashFlows: ProFormaCashFlow[]
): {
  totalInvestment: number;
  totalReturn: number;
  totalProfit: number;
} {
  const totalInvestment = purchasePrice - debtService.loanAmount;

  // Cash flows now include exit proceeds in the final year
  const totalReturn = proFormaCashFlows.reduce((sum, cashFlow) => {
    return sum + cashFlow.cashFlow;
  }, 0);

  const totalProfit = totalReturn - totalInvestment;

  return {
    totalInvestment: roundToDecimals(totalInvestment),
    totalReturn: roundToDecimals(totalReturn),
    totalProfit: roundToDecimals(totalProfit)
  };
}

/**
 * Calculates key performance indicators
 */
export function calculateKPIs(
  noiProjections: NOIProjection[],
  proFormaCashFlows: ProFormaCashFlow[],
  purchasePrice: number,
  debtService: DebtServiceCalculation
): {
  year1NOI: number;
  finalYearNOI: number;
  noiGrowthRate: number;
  averageDSCR: number;
  minimumDSCR: number;
  cashOnCashReturn: number;
  capRate: number;
} {
  const year1NOI = noiProjections[0]?.netOperatingIncome || 0;
  const finalYearNOI = noiProjections[noiProjections.length - 1]?.netOperatingIncome || 0;

  // Calculate NOI growth rate
  const noiGrowthRate = year1NOI > 0 ? (finalYearNOI - year1NOI) / year1NOI : 0;

  // Calculate DSCR metrics
  const dscrValues = proFormaCashFlows.map(cf => cf.netOperatingIncome / debtService.annualDebtService);
  const averageDSCR = dscrValues.reduce((sum, dscr) => sum + dscr, 0) / dscrValues.length;
  const minimumDSCR = Math.min(...dscrValues);

  // Calculate cash-on-cash return (Year 1 operating cash flow / initial equity investment)
  const totalInvestment = purchasePrice - debtService.loanAmount;
  const year1OperatingCashFlow = year1NOI - debtService.annualDebtService;
  const cashOnCashReturn = totalInvestment > 0 ? year1OperatingCashFlow / totalInvestment : 0;

  // Calculate cap rate
  const capRate = purchasePrice > 0 ? year1NOI / purchasePrice : 0;

  return {
    year1NOI: roundToDecimals(year1NOI),
    finalYearNOI: roundToDecimals(finalYearNOI),
    noiGrowthRate: roundToDecimals(noiGrowthRate, 4),
    averageDSCR: roundToDecimals(averageDSCR, 2),
    minimumDSCR: roundToDecimals(minimumDSCR, 2),
    cashOnCashReturn: roundToDecimals(cashOnCashReturn, 4),
    capRate: roundToDecimals(capRate, 4)
  };
}
