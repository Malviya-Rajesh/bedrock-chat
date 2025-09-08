import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const GROUP_PUBLISH_ALLOWED = 'PublishAllowed';
const GROUP_CREATING_BOT_ALLOWED = 'CreatingBotAllowed';
const GROUP_ADMIN = 'Admin';

const useLoginUser = () => {
  const [isAllowApiSettings, setIsAllowApiSettings] = useState(false);
  const [isAllowCreatingBot, setIsAllowCreatingBot] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: session } = useSWR('current-session', () => fetchAuthSession());

  const userName = useMemo(() => {
    return session?.tokens?.idToken?.payload?.['email']?.toString() ?? '';
  }, [session?.tokens?.idToken?.payload]);

  const userFirstName = useMemo(() => {
    // Try to get given_name first, then name, then extract from email
    const payload = session?.tokens?.idToken?.payload;
    const givenName = payload?.['given_name']?.toString();
    const name = payload?.['name']?.toString();
    const email = payload?.['email']?.toString();
    
    if (givenName) {
      return givenName;
    } else if (name) {
      // If name contains full name, take first part
      return name.split(' ')[0];
    } else if (email) {
      // Extract first part of email before @ and capitalize
      const emailPrefix = email.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'User';
  }, [session?.tokens?.idToken?.payload]);

  const groups = useMemo(() => {
    return session?.tokens?.idToken?.payload?.['cognito:groups'];
  }, [session?.tokens?.idToken?.payload]);

  const userId = useMemo(() => {
    return session?.tokens?.idToken?.payload?.sub;
  }, [session]);

  useEffect(() => {
    if (Array.isArray(groups)) {
      setIsAllowApiSettings(
        groups.some(
          (group) => group === GROUP_PUBLISH_ALLOWED || group === GROUP_ADMIN
        )
      );
      setIsAllowCreatingBot(
        groups.some(
          (group) =>
            group === GROUP_CREATING_BOT_ALLOWED || group === GROUP_ADMIN
        )
      );
      setIsAdmin(groups.some((group) => group === GROUP_ADMIN));
    } else {
      setIsAllowApiSettings(false);
      setIsAllowCreatingBot(false);
      setIsAdmin(false);
    }
  }, [groups, session]);

  return {
    isAllowApiSettings,
    isAllowCreatingBot,
    isAdmin,
    userGroups: Array.isArray(groups)
      ? groups.map((group) => group?.toString() ?? '')
      : [],
    userName,
    userFirstName,
    userId,
  };
};

export default useLoginUser;
