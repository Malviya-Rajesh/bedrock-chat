import { useCallback, useState } from 'react';
import type { AxiosError } from 'axios';
import useHttp from './useHttp';

type RemainingAmountStatus = 'idle' | 'loading' | 'success' | 'error';

export type RemainingAmountData = {
  amount: number | null;
  currency?: string;
  message?: string;
  rawText: string;
};

const MAX_PARSE_DEPTH = 5;

const knownAmountKeys = [
  'remainingamount',
  'remaining_amount',
  'balance',
  'amount',
  'remaining',
  'amountremaining',
  'remainingbalance',
  'remainingbudget',
  'balanceamount',
  'remainingtokens',
  'tokensremaining',
];

const knownCurrencyKeys = [
  'currency',
  'currencycode',
  'currency_code',
  'unit',
  'units',
];

const knownMessageKeys = [
  'message',
  'status',
  'statusmessage',
  'status_message',
  'description',
  'detail',
];

// Common wrapper keys returned by API Gateway/Lambda responses.
const unwrapKeys = ['body', 'data', 'result'];

const tryParseJson = (value: string): unknown | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
};

const parseCurrency = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed.length <= 6) {
      return trimmed.toUpperCase();
    }
    const match = trimmed.match(/[A-Za-z]{3}/);
    return match ? match[0].toUpperCase() : undefined;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.code === 'string') {
      return record.code.toUpperCase();
    }
    if (typeof record.currency === 'string') {
      return record.currency.toUpperCase();
    }
  }
  return undefined;
};

const parseMessage = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return undefined;
};

// Recursively inspect the payload to locate numeric balance information.
const parseCandidate = (
  candidate: unknown,
  depth = 0
): { amount: number | null; currency?: string; message?: string } => {
  if (depth > MAX_PARSE_DEPTH || candidate === null || candidate === undefined) {
    return { amount: null };
  }

  if (typeof candidate === 'number') {
    return { amount: Number.isFinite(candidate) ? candidate : null };
  }

  if (typeof candidate === 'string') {
    const amount = parseNumeric(candidate);
    return {
      amount,
      message: amount === null ? candidate : undefined,
    };
  }

  if (typeof candidate === 'object') {
    const record = candidate as Record<string, unknown>;

    for (const key of unwrapKeys) {
      if (key in record) {
        const nestedValue = record[key];
        const parsedNested =
          typeof nestedValue === 'string'
            ? parseCandidate(tryParseJson(nestedValue) ?? nestedValue, depth + 1)
            : parseCandidate(nestedValue, depth + 1);

        if (
          parsedNested.amount !== null ||
          parsedNested.currency !== undefined ||
          parsedNested.message !== undefined
        ) {
          return parsedNested;
        }
      }
    }

    const normalized = Object.keys(record).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key.toLowerCase()] = record[key];
        return acc;
      },
      {}
    );

    const amountKey = knownAmountKeys.find((key) => key in normalized);
    const amount = amountKey ? parseNumeric(normalized[amountKey]) : null;

    const currencyKey = knownCurrencyKeys.find((key) => key in normalized);
    const currency = currencyKey
      ? parseCurrency(normalized[currencyKey])
      : undefined;

    const messageKey = knownMessageKeys.find((key) => key in normalized);
    const message = messageKey
      ? parseMessage(normalized[messageKey])
      : undefined;

    if (amount !== null || currency !== undefined || message !== undefined) {
      return { amount, currency, message };
    }

    for (const value of Object.values(record)) {
      const nested = parseCandidate(value, depth + 1);
      if (
        nested.amount !== null ||
        nested.currency !== undefined ||
        nested.message !== undefined
      ) {
        return nested;
      }
    }
  }

  return { amount: null };
};

const parseBalancePayload = (payload: string): RemainingAmountData => {
  const parsed = parseCandidate(tryParseJson(payload) ?? payload);

  if (parsed.amount === null && !parsed.message) {
    return {
      amount: null,
      currency: parsed.currency,
      message: payload.trim().length > 0 ? payload : undefined,
      rawText: payload,
    };
  }

  return {
    amount: parsed.amount,
    currency: parsed.currency,
    message: parsed.message,
    rawText: payload,
  };
};

const useRemainingAmount = () => {
  const [data, setData] = useState<RemainingAmountData | null>(null);
  const [status, setStatus] = useState<RemainingAmountStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const http = useHttp();

  const fetchAmount = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await http.getOnce<{ body?: string; [key: string]: unknown }>(
        '/user/remaining-amount'
      );

      const bodyPayload = response.data?.body ?? response.data;

      if (typeof bodyPayload !== 'string') {
        throw new Error('Balance response format is invalid.');
      }

      const parsed = parseBalancePayload(bodyPayload);
      setData(parsed);
      setStatus('success');
      return parsed;
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      const message =
        axiosError?.response?.data?.detail ??
        axiosError?.message ??
        (err instanceof Error ? err.message : 'Unknown error occurred.');
      setError(message);
      setStatus('error');
      setData(null);
      return null;
    }
  }, [http]);

  return {
    data,
    status,
    error,
    fetch: fetchAmount,
    isLoading: status === 'loading',
  };
};

export default useRemainingAmount;
