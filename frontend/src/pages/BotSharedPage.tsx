import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PiArrowClockwiseBold, PiArrowRight } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import ListPageLayout from '../layouts/ListPageLayout';
import useSharedBots from '../hooks/useSharedBots';
import useChat from '../hooks/useChat';

const BotSharedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sharedBots, error, isLoading, isValidating, refresh } =
    useSharedBots();
  const { newChat } = useChat();

  const isEmpty = useMemo(() => {
    if (error) {
      return false;
    }
    return (sharedBots?.length ?? 0) === 0;
  }, [error, sharedBots]);

  return (
    <ListPageLayout
      pageTitle={t('bot.shared.pageTitle', { defaultValue: 'Shared With Me' })}
      pageTitleActions={
        <Button
          outlined
          loading={isValidating}
          onClick={() => {
            void refresh();
          }}
          rightIcon={<PiArrowClockwiseBold />}>
          {t('common.refresh', { defaultValue: 'Refresh' })}
        </Button>
      }
      isLoading={isLoading && !sharedBots}
      isEmpty={isEmpty}
      emptyMessage={t('bot.shared.empty', {
        defaultValue: 'No bots have been shared with you yet.',
      })}>
      {error && (
        <Alert
          className="mb-4"
          severity="error"
          title={t('common.error', { defaultValue: 'Error' })}>
          {t('bot.shared.errorMessage', {
            defaultValue: 'We could not load shared bots. Please try again.',
          })}
        </Alert>
      )}

      {sharedBots && sharedBots.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-light-gray/60 bg-white shadow-sm dark:border-dark-gray dark:bg-aws-paper-dark">
          {sharedBots.map((bot) => {
            const title = bot.title || t('bot.shared.untitled', {
              defaultValue: 'Untitled Bot',
            });

            return (
              <button
                key={bot.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-light-gray/60 px-4 py-3 text-left last:border-b-0 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring dark:border-dark-gray dark:bg-aws-paper-dark dark:text-aws-font-color-white-dark dark:hover:bg-aws-ui-color-dark/60"
                onClick={() => {
                  newChat();
                  navigate(`/bot/${bot.id}`);
                }}>
                <span className="text-base font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
                  {title}
                </span>
                <PiArrowRight className="text-xl text-aws-squid-ink-light dark:text-aws-font-color-white-dark" />
              </button>
            );
          })}
        </div>
      )}
    </ListPageLayout>
  );
};

export default BotSharedPage;
