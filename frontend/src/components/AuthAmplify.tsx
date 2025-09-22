import React, { ReactNode, cloneElement, ReactElement } from 'react';
import { BaseProps } from '../@types/common';
import { Authenticator } from '@aws-amplify/ui-react';
import { useTranslation } from 'react-i18next';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { SocialProvider } from '../@types/auth';

type Props = BaseProps & {
  socialProviders: SocialProvider[];
  children: ReactNode;
};

const AuthAmplify: React.FC<Props> = ({ socialProviders, children }) => {
  const { t } = useTranslation();
  const { signOut } = useAuthenticator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-aws-ui-color-dark dark:via-slate-900 dark:to-slate-800">
      <Authenticator
        socialProviders={socialProviders}
        components={{
          Header: () => (
            <div className="mb-8 mt-12 flex flex-col items-center space-y-3">
              <h1 className="bg-gradient-to-r from-aws-sea-blue-light via-aws-aqua to-aws-sea-blue-light bg-clip-text text-5xl font-bold tracking-wide text-transparent drop-shadow-sm">
                {t('app.name')}
              </h1>
              <p className="text-center text-lg font-medium text-aws-font-color-gray dark:text-aws-font-color-dark/70">
                {t('app.tagline')}
              </p>
            </div>
          ),
        }}>
        <>{cloneElement(children as ReactElement, { signOut })}</>
      </Authenticator>
    </div>
  );
};

export default AuthAmplify;
