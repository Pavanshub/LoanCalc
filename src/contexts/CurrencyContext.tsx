import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  baseCurrency: Currency;
  setBaseCurrency: (currency: Currency) => void;
  targetCurrency: Currency;
  setTargetCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  convertAmount: (amount: number, from: string, to: string) => number;
  currencies: Currency[];
}

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const API_BASE_URL = import.meta.env.VITE_EXCHANGE_RATE_API_BASE_URL;


// Default to USD until we fetch currencies
const defaultCurrency: Currency = { code: 'USD', name: 'United States Dollar', symbol: '$' };

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [baseCurrency, setBaseCurrency] = useState<Currency>(defaultCurrency);
  const [targetCurrency, setTargetCurrency] = useState<Currency>(defaultCurrency);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([defaultCurrency]);

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/${API_KEY}/codes`);
        if (response.data.result === 'success') {
          const currencyList = response.data.supported_codes.map(([code, name]: string[]) => ({
            code,
            name,
            symbol: new Intl.NumberFormat('en-US', { style: 'currency', currency: code })
              .format(0)
              .charAt(0),
          }));
          setCurrencies(currencyList);
        }
      } catch (err) {
        console.error('Error fetching currencies:', err);
        setError('Failed to fetch available currencies');
      }
    };

    fetchCurrencies();
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/${API_KEY}/latest/${baseCurrency.code}`
        );
        if (response.data.result === 'success') {
          setExchangeRates(response.data.conversion_rates);
        } else {
          throw new Error('Failed to fetch exchange rates');
        }
      } catch (err) {
        setError('Failed to fetch exchange rates. Please try again later.');
        console.error('Error fetching exchange rates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRates();

    // Set up auto-refresh every 1 hour
    const refreshInterval = setInterval(fetchExchangeRates, 3600000);

    return () => clearInterval(refreshInterval);
  }, [baseCurrency]);

  const convertAmount = (amount: number, from: string, to: string): number => {
    if (!exchangeRates) return 0;
    
    const fromRate = exchangeRates[from];
    const toRate = exchangeRates[to];
    
    return amount * (toRate / fromRate);
  };

  const value = {
    baseCurrency,
    setBaseCurrency,
    targetCurrency,
    setTargetCurrency,
    exchangeRates,
    isLoading,
    error,
    convertAmount,
    currencies
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};