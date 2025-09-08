import React, { useCallback, useEffect, useState } from 'react';
import Drawer from '../components/Drawer';
import { BaseProps } from '../@types/common';
import { ConversationMeta } from '../@types/conversation';
import LazyOutputText from '../components/LazyOutputText';
import { PiList } from 'react-icons/pi';
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

type Props = BaseProps & {
  signOut?: () => void;
};

const AppContent: React.FC<Props> = (props) => {
  const { i18n } = useTranslation();
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
  const { isAdmin, userFirstName } = useLoginUser();
  const [theme] = useLocalStorage('theme', 'light');
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
        <header className="visible flex h-14 w-full items-center bg-aws-squid-ink-light px-3 py-2 text-lg text-aws-font-color-white-light dark:bg-aws-squid-ink-dark dark:text-aws-font-color-white-dark">
          <div className="flex items-center min-w-0 w-32">
            <button
              className="rounded-full p-2 hover:brightness-75 focus:outline-none focus:ring-1 transition-all"
              onClick={() => {
                switchDrawer();
              }}>
              <PiList className="text-xl" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center text-center px-4">
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

          <div className="flex items-center justify-end text-sm font-medium min-w-0 w-32">
            Hi, {userFirstName}
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

export default AppContent;
