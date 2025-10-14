import { useCallback } from 'react';
import useSWR from 'swr';
import { AxiosError } from 'axios';
import useHttp from './useHttp';
import { SharedBot } from '../@types/bot';

type SharedBotsApiResponse = {
  bots?: Array<{
    BotId: string;
    Title?: string;
  }>;
};

const useSharedBots = () => {
  const http = useHttp();

  const fetchSharedBots = useCallback(async (): Promise<SharedBot[]> => {
    const response = await http.post<SharedBotsApiResponse>(
      'GetBots',
      {} as Record<string, never>
    );

    const bots = response.data?.bots ?? [];

    return bots.map((bot) => ({
      id: bot.BotId,
      title: bot.Title?.trim() ?? '',
    }));
  }, [http]);

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<SharedBot[], AxiosError>(
    'shared-bots',
    () => fetchSharedBots(),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    sharedBots: data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(),
  };
};

export default useSharedBots;
