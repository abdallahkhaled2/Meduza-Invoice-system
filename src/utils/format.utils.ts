import { CURRENCY, CURRENCY_LOCALE } from '../constants/company.constants';

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
  });
};

export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString(CURRENCY_LOCALE);
};
