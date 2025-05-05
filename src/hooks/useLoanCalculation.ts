import { useState, useCallback } from 'react';

export interface LoanDetails {
  principal: number;
  interestRate: number;
  loanTerm: number;
}

export interface AmortizationRow {
  paymentNumber: number;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

export const useLoanCalculation = () => {
  const [result, setResult] = useState<LoanCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateLoan = useCallback((loanDetails: LoanDetails): LoanCalculationResult => {
    try {
      const { principal, interestRate, loanTerm } = loanDetails;
      
      // Convert annual rate to monthly and decimal form
      const monthlyRate = interestRate / 12 / 100;
      
      // Using the formula: EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
      const monthlyPayment = 
        principal * 
        monthlyRate * 
        Math.pow(1 + monthlyRate, loanTerm) / 
        (Math.pow(1 + monthlyRate, loanTerm) - 1);
      
      const totalPayment = monthlyPayment * loanTerm;
      const totalInterest = totalPayment - principal;
      
      // Generate amortization schedule
      const amortizationSchedule: AmortizationRow[] = [];
      let remainingBalance = principal;
      
      for (let i = 1; i <= loanTerm; i++) {
        const interestPaid = remainingBalance * monthlyRate;
        const principalPaid = monthlyPayment - interestPaid;
        remainingBalance -= principalPaid;
        
        amortizationSchedule.push({
          paymentNumber: i,
          paymentAmount: monthlyPayment,
          principalPaid,
          interestPaid,
          remainingBalance: Math.max(0, remainingBalance) // Ensure we don't go negative due to rounding
        });
      }
      
      return {
        monthlyPayment,
        totalPayment,
        totalInterest,
        amortizationSchedule
      };
    } catch (err) {
      console.error("Error calculating loan:", err);
      throw new Error('Failed to calculate loan details. Please check your inputs.');
    }
  }, []);

  const calculate = useCallback((loanDetails: LoanDetails) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Add a small timeout to simulate processing for better UX
      setTimeout(() => {
        const result = calculateLoan(loanDetails);
        setResult(result);
        setIsCalculating(false);
      }, 500);
    } catch (err) {
      setError((err as Error).message);
      setIsCalculating(false);
    }
  }, [calculateLoan]);

  return {
    result,
    isCalculating,
    error,
    calculate
  };
};