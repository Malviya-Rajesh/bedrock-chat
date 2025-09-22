import React, {
  ReactNode,
  useState,
  useEffect,
  cloneElement,
  ReactElement,
} from 'react';
import Button from './Button';
import { BaseProps } from '../@types/common';
import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import { PiCircleNotch } from 'react-icons/pi';

type Props = BaseProps & {
  children: ReactNode;
};

const AuthCustom: React.FC<Props> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    getCurrentUser()
      .then(() => {
        setAuthenticated(true);
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSignIn = () => {
    signInWithRedirect({
      provider: {
        custom: import.meta.env.VITE_APP_CUSTOM_PROVIDER_NAME,
      },
    });
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <>
      {loading ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-aws-ui-color-dark dark:to-slate-900">
          <div className="flex flex-col items-center space-y-6">
            <h1 className="bg-gradient-to-r from-aws-sea-blue-light via-aws-aqua to-aws-sea-blue-light bg-clip-text text-5xl font-bold tracking-wide text-transparent drop-shadow-sm">
              {t('app.name')}
            </h1>
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin text-aws-aqua">
                <PiCircleNotch size={48} />
              </div>
              <p className="text-lg font-medium text-aws-font-color-gray">Loading...</p>
            </div>
          </div>
        </div>
      ) : !authenticated ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-aws-ui-color-dark dark:to-slate-900">
          <div className="mb-4 flex justify-center">
            <h1 className="bg-gradient-to-r from-aws-sea-blue-light via-aws-aqua to-aws-sea-blue-light bg-clip-text text-6xl font-bold tracking-wide text-transparent drop-shadow-lg">
              {t('app.name')}
            </h1>
          </div>
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-aws-paper-dark dark:ring-slate-700">
            <Button 
              onClick={() => handleSignIn()} 
              className="w-full rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              {t('signIn.button.login')}
            </Button>
          </div>
        </div>
      ) : (
        // Pass the signOut function to the child component
        <>
          {cloneElement(children as ReactElement, { signOut: handleSignOut })}
        </>
      )}
    </>
  );
};

export default AuthCustom;
