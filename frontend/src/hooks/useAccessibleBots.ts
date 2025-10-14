import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

const API_URL = 'https://3nwepy67gk.execute-api.us-east-1.amazonaws.com/GetBots';

type AccessibleBot = {
  id: string;
  title: string;
};

type RawAccessibleBot = {
  BotId: string;
  Title: string;
};

type RawAccessibleBotResponse = {
  bots?: RawAccessibleBot[];
};

const normalizeBots = (data?: RawAccessibleBotResponse): AccessibleBot[] => {
  if (!data?.bots) {
    return [];
  }

  return data.bots
    .filter((bot) => Boolean(bot.BotId) && Boolean(bot.Title))
    .map((bot) => ({
      id: bot.BotId,
      title: bot.Title,
    }));
};

const useAccessibleBots = () => {
  const [bots, setBots] = useState<AccessibleBot[] | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBots = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (!idToken) {
          throw new Error('Unable to acquire ID token');
        }

        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Authorization: idToken,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bots (${response.status})`);
        }

        const payload = (await response.json()) as RawAccessibleBotResponse;
        if (!isMounted) {
          return;
        }

        setBots(normalizeBots(payload));
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Unknown error while fetching accessible bots'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchBots();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    bots,
    error,
    isLoading,
  };
};

export default useAccessibleBots;
