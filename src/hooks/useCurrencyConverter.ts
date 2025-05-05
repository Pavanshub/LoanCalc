import { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

interface CurrencyConverterResult {
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export const useCurrencyConverter = (amount: number) => {
  const { 
    baseCurrency, 
    targetCurrency, 
    exchangeRates, 
    convertAmount, 
    isLoading: ratesLoading,
    error: ratesError 
  } = useCurrency();
  
  const [result, setResult] = useState<CurrencyConverterResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amount || amount <= 0 || !exchangeRates) {
      setResult(null);
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Get rate from base to target currency
      let rate = 1;
      
      if (exchangeRates) {
        // If direct conversion exists in the rates
        if (baseCurrency.code === 'USD') {
          rate = exchangeRates[targetCurrency.code];
        } else if (targetCurrency.code === 'USD') {
          rate = 1 / exchangeRates[baseCurrency.code];
        } else {
          // Convert through USD as the base
          const baseToUSD = 1 / exchangeRates[baseCurrency.code];
          const usdToTarget = exchangeRates[targetCurrency.code];
          rate = baseToUSD * usdToTarget;
        }
      }

      const convertedAmount = convertAmount(
        amount,
        baseCurrency.code,
        targetCurrency.code
      );

      setResult({
        convertedAmount,
        fromCurrency: baseCurrency.code,
        toCurrency: targetCurrency.code,
        rate
      });
    } catch (err) {
      setError('Failed to convert currency. Please try again.');
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  }, [amount, baseCurrency, targetCurrency, exchangeRates, convertAmount]);

  return {
    result,
    isConverting: isConverting || ratesLoading,
    error: error || ratesError
  };
};