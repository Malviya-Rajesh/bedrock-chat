import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export type BalanceResponse = {
  userId: string;
  balance: string | number;
};

type BalanceContextValue = {
  balanceInfo: BalanceResponse | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  refresh: () => Promise<BalanceResponse | null>;
};

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

const toNumericBalance = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const toMessageString = (value: unknown): string => {
  return typeof value === 'string' ? value : String(value);
};

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [balanceInfo, setBalanceInfo] = useState<BalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balanceEndpoint = import.meta.env.VITE_APP_BALANCE_API_ENDPOINT;
  const isConfigured = Boolean(balanceEndpoint);

  const refresh = useCallback(async () => {
    if (!balanceEndpoint) {
      const message = t('user.balance.notConfigured', {
        defaultValue: 'Balance endpoint is not configured.',
      });
      setError(toMessageString(message));
      setBalanceInfo(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) {
        throw new Error(
          t('user.balance.missingToken', {
            defaultValue: 'Authentication token not found.',
          })
        );
      }

      const response = await axios.get<BalanceResponse>(balanceEndpoint, {
        headers: {
          Authorization: idToken,
          Accept: 'application/json',
        },
      });

      setBalanceInfo(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch balance', err);
      const message = t('user.balance.fetchFailed', {
        defaultValue: 'Unable to refresh balance.',
      });
      setError(toMessageString(message));
      setBalanceInfo(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [balanceEndpoint, t]);

  useEffect(() => {
    if (isConfigured) {
      void refresh();
    }
  }, [isConfigured, refresh]);

  const balance = useMemo(() => {
    return toNumericBalance(balanceInfo?.balance);
  }, [balanceInfo]);

  const value = useMemo<BalanceContextValue>(
    () => ({
      balanceInfo,
      balance,
      isLoading,
      error,
      isConfigured,
      refresh,
    }),
    [balanceInfo, balance, isLoading, error, isConfigured, refresh]
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
};

export const useBalance = (): BalanceContextValue => {
  const context = useContext(BalanceContext);

  if (!context) {
    throw new Error('useBalance must be used within BalanceProvider');
  }

  return context;
};

export const parseNumericBalance = toNumericBalance;
