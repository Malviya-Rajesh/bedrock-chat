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
        loginMechanisms={['email']}
        signUpAttributes={['email', 'given_name', 'family_name', 'phone_number']}
        formFields={{
          signUp: {
            email: {
              order: 1,
              label: t('auth.signUp.emailLabel', { defaultValue: 'Email address' }),
            },
            given_name: {
              order: 2,
              label: t('auth.signUp.firstNameLabel', { defaultValue: 'First name' }),
              isRequired: true,
            },
            family_name: {
              order: 3,
              label: t('auth.signUp.lastNameLabel', { defaultValue: 'Last name' }),
              isRequired: true,
              placeholder: t('auth.signUp.lastNamePlaceholder', { defaultValue: 'Last Name' }),
            },
            phone_number: {
              order: 4,
              label: t('auth.signUp.phoneNumberLabel', { defaultValue: 'Mobile number' }),
              isRequired: true,
              placeholder: '',
            },
            password: {
              order: 5,
              label: t('auth.signUp.passwordLabel', { defaultValue: 'Password' }),
            },
            confirm_password: {
              order: 6,
              label: t('auth.signUp.confirmPasswordLabel', {
                defaultValue: 'Confirm password',
              }),
            },
          },
        }}
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
