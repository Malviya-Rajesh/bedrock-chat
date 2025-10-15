import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Drawer from '../components/Drawer';
import { BaseProps } from '../@types/common';
import { ConversationMeta } from '../@types/conversation';
import LazyOutputText from '../components/LazyOutputText';
import {
  PiArrowClockwiseBold,
  PiDotsThreeVertical,
  PiList,
  PiPlusCircleBold,
  PiSidebar,
  PiSignOut,
  PiTranslate,
  PiTrash,
} from 'react-icons/pi';
import SnackbarProvider from '../providers/SnackbarProvider';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import useDrawer from '../hooks/useDrawer';
import useConversation from '../hooks/useConversation';
import useBot from '../hooks/useBot';
import useChat from '../hooks/useChat';
import { usePageLabel, usePageTitlePathPattern } from '../routes';
import useLoginUser from '../hooks/useLoginUser';
import DialogConfirmDeleteChat from '../components/DialogConfirmDeleteChat';
import DialogConfirmClearConversations from '../components/DialogConfirmClearConversations';
import DialogSelectLanguage from '../components/DialogSelectLanguage';
import useLocalStorage from '../hooks/useLocalStorage';
import DialogDrawerOptions from '../components/DialogDrawerOptions';
import Toggle from '../components/Toggle';
import { IoMoonSharp, IoSunnyOutline } from 'react-icons/io5';
import {
  BalanceProvider,
  useBalance,
} from '../contexts/BalanceContext';
import useSnackbar from '../hooks/useSnackbar';

type Props = BaseProps & {
  signOut?: () => void;
};

const AppContentInner: React.FC<Props> = (props) => {
  const { t, i18n } = useTranslation();
  const { getPageLabel } = usePageLabel();
  const { switchOpen: switchDrawer } = useDrawer();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const {
    conversations,
    getTitle,
    updateTitle,
    deleteConversation,
    clearConversations: clear,
  } = useConversation();
  const { starredBots, recentlyUsedUnstarredBots } = useBot();
  const { newChat, isGeneratedTitle } = useChat();
  const { isConversationOrNewChat, pathPattern } = usePageTitlePathPattern();
  const { isAdmin, userFirstName, userName } = useLoginUser();
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const { open: openSnackbar } = useSnackbar();
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const isDarkTheme = theme === 'dark';

  const [isOpenDeleteChat, setIsOpenDeleteChat] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    ConversationMeta | undefined
  >();

  const deleteChat = useCallback(
    (conversationId: string) => {
      deleteConversation(conversationId).then(() => {
        newChat();
        navigate('');
        setIsOpenDeleteChat(false);
        setDeleteTarget(undefined);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [isOpenClearConversations, setIsOpenClearConversations] =
    useState(false);

  const clearConversations = useCallback(
    () => {
      clear().then(() => {
        navigate('');
        setIsOpenClearConversations(false);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [isOpenSelectLanguage, setIsOpenSelectLanguage] = useState(false);
  const [isOpenDrawerOptions, setIsOpenDrawerOptions] = useState(false);
  const { drawerOptions, setDrawerOptions } = useDrawer();
  const {
    balanceInfo,
    balance,
    isLoading: isBalanceLoading,
    error: balanceError,
    isConfigured: isBalanceConfigured,
    refresh,
  } = useBalance();

  const balanceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
    []
  );

  const formattedBalance = useMemo(() => {
    if (!balanceInfo) {
      return '--';
    }
    const rawBalance = balanceInfo.balance;
    if (rawBalance === null || rawBalance === undefined) {
      return '--';
    }
    if (balance !== null) {
      return balanceFormatter.format(balance);
    }
    return String(rawBalance);
  }, [balance, balanceFormatter, balanceInfo]);

  const balanceDisplay = useMemo(() => {
    if (!isBalanceConfigured) {
      return t('user.balance.unavailable', { defaultValue: 'N/A' });
    }
    return formattedBalance;
  }, [formattedBalance, isBalanceConfigured, t]);

  const refreshDisabledReason = useMemo(() => {
    if (!isBalanceConfigured) {
      return t('user.balance.notConfigured', {
        defaultValue: 'Balance endpoint is not configured.',
      });
    }
    return undefined;
  }, [isBalanceConfigured, t]);

  const canRefreshBalance = isBalanceConfigured && !isBalanceLoading;

  const amountTitle = useMemo(() => {
    if (balanceError) {
      return balanceError;
    }
    if (!isBalanceConfigured) {
      return refreshDisabledReason;
    }
    if (isBalanceLoading) {
      return t('user.balance.refreshing', {
        defaultValue: 'Refreshing balance...',
      });
    }
    return t('user.balance.clickToRefresh', {
      defaultValue: 'Click to refresh balance.',
    });
  }, [balanceError, isBalanceConfigured, isBalanceLoading, refreshDisabledReason, t]);

  const amountButtonClassName = useMemo(() => {
    const baseClass = 'font-semibold inline-flex items-center gap-1 focus:outline-none bg-transparent border-0 p-0 text-current';
    return canRefreshBalance
      ? `${baseClass} hover:underline focus:underline cursor-pointer`
      : `${baseClass} cursor-not-allowed opacity-70`;
  }, [canRefreshBalance]);

  const themeToggleLabel = useMemo(
    () => (isDarkTheme ? t('button.mode.dark', { defaultValue: 'Dark mode' }) : t('button.mode.light', { defaultValue: 'Light mode' })),
    [isDarkTheme, t]
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userMenuButtonRef.current?.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [conversationId, pathPattern]);

  return (
    <div className="relative flex h-dvh w-screen bg-aws-paper-light dark:bg-aws-paper-dark">
      <Drawer
        isAdmin={isAdmin}
        conversations={conversations}
        starredBots={starredBots}
        recentlyUsedUnstarredBots={recentlyUsedUnstarredBots}
        updateConversationTitle={async (conversationId, title) => {
          await updateTitle(conversationId, title);
        }}
        onSignOut={() => {
          props.signOut ? props.signOut() : null;
        }}
        onDeleteConversation={(conversation) => {
          setIsOpenDeleteChat(true);
          setDeleteTarget(conversation);
        }}
        onClearConversations={() => setIsOpenClearConversations(true)}
        onSelectLanguage={() => setIsOpenSelectLanguage(true)}
        onClickDrawerOptions={() => {
          setIsOpenDrawerOptions(true);
        }}
      />
      <DialogConfirmDeleteChat
        isOpen={isOpenDeleteChat}
        target={deleteTarget}
        onDelete={deleteChat}
        onClose={() => setIsOpenDeleteChat(false)}
      />
      <DialogConfirmClearConversations
        isOpen={isOpenClearConversations}
        onClose={() => {
          setIsOpenClearConversations(false);
        }}
        onDelete={clearConversations}
      />
      <DialogSelectLanguage
        isOpen={isOpenSelectLanguage}
        initialLanguage={i18n.language}
        onSelectLanguage={(language) => {
          i18n.changeLanguage(language);
          setIsOpenSelectLanguage(false);
        }}
        onClose={() => {
          setIsOpenSelectLanguage(false);
        }}
      />
      <DialogDrawerOptions
        isOpen={isOpenDrawerOptions}
        drawerOptions={drawerOptions}
        onChangeDrawerOptions={(options) => {
          setDrawerOptions(options);
          setIsOpenDrawerOptions(false);
        }}
        onClose={() => setIsOpenDrawerOptions(false)}
      />

      <main className="relative flex min-h-dvh flex-1 flex-col overflow-y-hidden transition-width">
        <header className="relative visible flex h-14 w-full items-center bg-aws-squid-ink-light px-3 py-2 text-lg text-aws-font-color-white-light dark:bg-aws-squid-ink-dark dark:text-aws-font-color-white-dark">
          <div className="flex items-center min-w-0 w-32">
            <button
              className="rounded-full p-2 hover:brightness-75 focus:outline-none focus:ring-1 transition-all"
              onClick={() => {
                switchDrawer();
              }}>
              <PiList className="text-xl" />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex w-32 items-center justify-end">
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                type="button"
                className="rounded-full p-2 hover:brightness-125 focus:outline-none focus:ring-1"
                title={t('user.menu.account', { defaultValue: 'Account menu' })}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                onClick={() => {
                  setIsUserMenuOpen((open) => !open);
                }}>
                <PiDotsThreeVertical className="text-xl" />
              </button>

              {isUserMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 z-40 mt-2 w-56 rounded-md border border-aws-font-color-white-light/40 bg-aws-squid-ink-light p-3 text-sm shadow-lg focus:outline-none dark:border-aws-font-color-white-dark/40 dark:bg-aws-squid-ink-dark"
                  role="menu">
                  <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
                    <div className="text-xs uppercase tracking-wide text-white/60 dark:text-white/70">
                      {t('user.menu.signedInAs', { defaultValue: 'Signed in as' })}
                    </div>
                    <div className="text-base font-semibold text-white dark:text-white">
                      {userFirstName || userName || t('user.anonymous', { defaultValue: 'User' })}
                    </div>
                    {userName && userName !== userFirstName && (
                      <div className="truncate text-xs text-white/70 dark:text-white/70">
                        {userName}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    <div className="text-xs uppercase tracking-wide text-white/60 dark:text-white/70">
                      {t('user.balance.label', { defaultValue: 'Balance' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`${amountButtonClassName} text-base`}
                        disabled={!canRefreshBalance}
                        onClick={() => {
                          if (!canRefreshBalance) {
                            return;
                          }
                          void refresh();
                        }}
                        title={amountTitle ?? undefined}>
                        <span>{balanceDisplay}</span>
                        {isBalanceLoading && (
                          <PiArrowClockwiseBold className="h-4 w-4 animate-spin" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-1 text-white/80 transition hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-1"
                        title={t('user.balance.add', {
                          defaultValue: 'Add balance (coming soon)',
                        })}
                        aria-label={t('user.balance.add', {
                          defaultValue: 'Add balance (coming soon)',
                        })}
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openSnackbar(
                            t('user.balance.addUnavailable', {
                              defaultValue:
                                'Adding amount is not available yet. Please contact Selira Team.',
                            }),
                            'info'
                          );
                        }}>
                        <PiPlusCircleBold className="h-4 w-4" />
                      </button>
                    </div>
                    {balanceError && (
                      <div className="text-xs text-red-200" role="alert">
                        {balanceError}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1 border-t border-white/10 pt-2">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-aws-squid-ink-dark/40 focus:outline-none focus-visible:ring-1"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsOpenDrawerOptions(true);
                      }}>
                      <PiSidebar className="text-lg" />
                      <span>{t('button.drawerOption', { defaultValue: 'Side Menu Options' })}</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-aws-squid-ink-dark/40 focus:outline-none focus-visible:ring-1"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsOpenSelectLanguage(true);
                      }}>
                      <PiTranslate className="text-lg" />
                      <span>{t('button.language', { defaultValue: 'Language' })}</span>
                    </button>

                    <div className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 hover:bg-aws-squid-ink-dark/40 focus-within:outline-none">
                      <div className="flex items-center gap-2">
                        {isDarkTheme ? (
                          <IoMoonSharp className="text-lg" />
                        ) : (
                          <IoSunnyOutline className="text-lg" />
                        )}
                        <span>{t('button.mode', { defaultValue: 'Mode' })}</span>
                      </div>
                      <Toggle
                        value={isDarkTheme}
                        aria-label={themeToggleLabel}
                        onChange={(next) => {
                          setTheme(next ? 'dark' : 'light');
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-aws-squid-ink-dark/40 focus:outline-none focus-visible:ring-1"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsOpenClearConversations(true);
                      }}>
                      <PiTrash className="text-lg" />
                      <span>{t('button.clearConversation', {
                        defaultValue: 'Delete all conversations',
                      })}</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-aws-squid-ink-dark/40 focus:outline-none focus-visible:ring-1"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (props.signOut) {
                          props.signOut();
                        }
                      }}>
                      <PiSignOut className="text-lg" />
                      <span>{t('button.signOut', { defaultValue: 'Sign out' })}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center px-4 text-center">
            <div className="pointer-events-auto">
              {isGeneratedTitle ? (
                <>
                  <LazyOutputText text={getTitle(conversationId ?? '')} />
                </>
              ) : (
                <>
                  {isConversationOrNewChat
                    ? getTitle(conversationId ?? '')
                    : getPageLabel(pathPattern)}
                </>
              )}
            </div>
          </div>
        </header>

        <div
          className="h-full overflow-hidden overflow-y-auto  text-aws-font-color-light dark:text-aws-font-color-dark"
          id="main">
          <SnackbarProvider>
            <Outlet />
          </SnackbarProvider>
        </div>
      </main>
    </div>
  );
};

const AppContent: React.FC<Props> = (props) => {
  return (
    <BalanceProvider>
      <AppContentInner {...props} />
    </BalanceProvider>
  );
};

export default AppContent;
