import { IRRCalculation, ProFormaCashFlow, ExitAnalysis, NOIProjection } from './types';
import { calculateIRR, roundToDecimals } from './utils';

/**
 * Calculates unlevered IRR (no debt consideration)
 */
export function calculateUnleveredIRR(
  noiProjections: NOIProjection[],
  purchasePrice: number,
  exitAnalysis: ExitAnalysis
): number {
  const cashFlows: number[] = [];

  // Initial investment (negative cash flow)
  cashFlows.push(-purchasePrice);

  // Annual NOI cash flows (excluding debt service)
  for (const projection of noiProjections) {
    cashFlows.push(projection.netOperatingIncome);
  }

  // Exit proceeds
  cashFlows.push(exitAnalysis.saleProceeds);

  return roundToDecimals(calculateIRR(cashFlows), 4);
}

/**
 * Calculates levered IRR (with debt consideration)
 */
export function calculateLeveredIRR(
  proFormaCashFlows: ProFormaCashFlow[],
  purchasePrice: number,
  loanAmount: number,
): number {
  const cashFlows: number[] = [];

  // Initial equity investment (purchase price - loan amount)
  const initialEquity = purchasePrice - loanAmount;
  cashFlows.push(-initialEquity);

  // Annual cash flows after debt service (includes exit proceeds in final year)
  for (const cashFlow of proFormaCashFlows) {
    cashFlows.push(cashFlow.cashFlow);
  }

  return roundToDecimals(calculateIRR(cashFlows), 4);
}

/**
 * Calculates equity multiple
 */
export function calculateEquityMultiple(
  totalReturn: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return roundToDecimals(totalReturn / totalInvestment, 2);
}

/**
 * Calculates total investment (equity contribution)
 */
export function calculateTotalInvestment(
  purchasePrice: number,
  loanAmount: number
): number {
  return roundToDecimals(purchasePrice - loanAmount);
}

/**
 * Calculates total return (cumulative cash flows + exit proceeds)
 */
export function calculateTotalReturn(
  proFormaCashFlows: ProFormaCashFlow[]
): number {
  // Cash flows now include exit proceeds in the final year
  const totalReturn = proFormaCashFlows.reduce((sum, cashFlow) => {
    return sum + cashFlow.cashFlow;
  }, 0);

  return roundToDecimals(totalReturn);
}

/**
 * Calculates total profit
 */
export function calculateTotalProfit(
  totalReturn: number,
  totalInvestment: number
): number {
  return roundToDecimals(totalReturn - totalInvestment);
}

/**
 * Calculates payback period
 */
export function calculatePaybackPeriod(
  proFormaCashFlows: ProFormaCashFlow[],
  totalInvestment: number
): number {
  let cumulativeCashFlow = 0;

  for (let i = 0; i < proFormaCashFlows.length; i++) {
    cumulativeCashFlow += proFormaCashFlows[i].cashFlow;

    if (cumulativeCashFlow >= totalInvestment) {
      // Linear interpolation for partial year
      const previousCumulative = cumulativeCashFlow - proFormaCashFlows[i].cashFlow;
      const remainingInvestment = totalInvestment - previousCumulative;
      const fractionOfYear = remainingInvestment / proFormaCashFlows[i].cashFlow;

      return roundToDecimals(i + fractionOfYear, 2);
    }
  }

  return -1; // No payback period found
}

/**
 * Calculates complete IRR analysis
 */
export function calculateIRRAnalysis(
  noiProjections: NOIProjection[],
  proFormaCashFlows: ProFormaCashFlow[],
  purchasePrice: number,
  loanAmount: number,
  exitAnalysis: ExitAnalysis
): IRRCalculation {
  const unleveredIRR = calculateUnleveredIRR(noiProjections, purchasePrice, exitAnalysis);
  const leveredIRR = calculateLeveredIRR(proFormaCashFlows, purchasePrice, loanAmount);

  const totalInvestment = calculateTotalInvestment(purchasePrice, loanAmount);
  const totalReturn = calculateTotalReturn(proFormaCashFlows);
  const equityMultiple = calculateEquityMultiple(totalReturn, totalInvestment);

  return {
    unleveredIRR,
    leveredIRR,
    equityMultiple
  };
}
