import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BaseProps } from '../@types/common';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useDrawer from '../hooks/useDrawer';
import ButtonIcon from './ButtonIcon';
import {
  PiArrowRight,
  PiChartLine,
  PiChat,
  PiChatCenteredDotsDuotone,
  PiCheck,
  PiCompass,
  PiListBullets,
  PiNotePencil,
  PiPencilLine,
  PiPlugs,
  PiPresentationChart,
  PiRobot,
  PiTrash,
  PiX,
} from 'react-icons/pi';
import LazyOutputText from './LazyOutputText';
import { ConversationMeta } from '../@types/conversation';
import { BotListItem } from '../@types/bot';
import useChat from '../hooks/useChat';
import { useTranslation } from 'react-i18next';
import DrawerItem from './DrawerItem';
import ExpandableDrawerGroup from './ExpandableDrawerGroup';
import { usePageLabel } from '../routes';
import { twMerge } from 'tailwind-merge';
import Button from './Button';
import Skeleton from './Skeleton';
import { isPinnedBot } from '../utils/BotUtils';
import IconPinnedBot from './IconPinnedBot';

type Props = BaseProps & {
  isAdmin: boolean;
  conversations?: ConversationMeta[];
  starredBots?: BotListItem[];
  recentlyUsedUnstarredBots?: BotListItem[];
  updateConversationTitle: (
    conversationId: string,
    title: string
  ) => Promise<void>;
  onDeleteConversation: (conversation: ConversationMeta) => void;
};

type ItemProps = BaseProps & {
  label: string;
  conversationId: string;
  generatedTitle?: boolean;
  updateTitle: (conversationId: string, title: string) => Promise<void>;
  onClick: () => void;
  onDelete: () => void;
};

const Item: React.FC<ItemProps> = (props) => {
  const { pathname } = useLocation();
  const { conversationId: pathParam } = useParams();
  const { conversationId } = useChat();
  const [tempLabel, setTempLabel] = useState('');
  const [editing, setEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const active = useMemo<boolean>(() => {
    return (
      pathParam === props.conversationId ||
      ((pathname === '/' || pathname.startsWith('/bot/')) &&
        conversationId == props.conversationId)
    );
  }, [conversationId, pathParam, pathname, props.conversationId]);

  const onClickEdit = useCallback(() => {
    setEditing(true);
    setTempLabel(props.label);
  }, [props.label]);

  const onClickUpdate = useCallback(() => {
    props.updateTitle(props.conversationId, tempLabel).then(() => {
      setEditing(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempLabel, props.conversationId, props.updateTitle]);

  const onClickDelete = useCallback(() => {
    props.onDelete();
  }, [props]);

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  useLayoutEffect(() => {
    if (editing) {
      const listener = (e: DocumentEventMap['keypress']) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();

          // dispatch 処理の中で Title の更新を行う（同期を取るため）
          setTempLabel((newLabel) => {
            props.updateTitle(props.conversationId, newLabel).then(() => {
              setEditing(false);
            });
            return newLabel;
          });
        }
      };
      inputRef.current?.addEventListener('keypress', listener);

      inputRef.current?.focus();

      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        inputRef.current?.removeEventListener('keypress', listener);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  return (
    <DrawerItem
      isActive={active}
      isBlur={!editing}
      to={`/${props.conversationId}`}
      onClick={props.onClick}
      icon={<PiChat />}
      labelComponent={
        <>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent"
              value={tempLabel}
              onChange={(e) => {
                setTempLabel(e.target.value);
              }}
            />
          ) : (
            <>
              {props.generatedTitle ? (
                <LazyOutputText text={props.label} />
              ) : (
                <>{props.label}</>
              )}
            </>
          )}
        </>
      }
      actionComponent={
        <>
          {active && !editing && (
            <>
              <ButtonIcon className="text-base" onClick={onClickEdit}>
                <PiPencilLine />
              </ButtonIcon>

              <ButtonIcon className="text-base" onClick={onClickDelete}>
                <PiTrash />
              </ButtonIcon>
            </>
          )}
          {editing && (
            <>
              <ButtonIcon className="text-base" onClick={onClickUpdate}>
                <PiCheck />
              </ButtonIcon>

              <ButtonIcon
                className="text-base"
                onClick={() => {
                  setEditing(false);
                }}>
                <PiX />
              </ButtonIcon>
            </>
          )}
        </>
      }
    />
  );
};

const Drawer: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getPageLabel } = usePageLabel();
  const { opened, switchOpen, drawerOptions } = useDrawer();
  const { conversations, starredBots, recentlyUsedUnstarredBots } = props;

  const location = useLocation();

  const [prevConversations, setPrevConversations] =
    useState<typeof conversations>();
  const [generateTitleIndex, setGenerateTitleIndex] = useState(-1);

  const { newChat, conversationId } = useChat();
  const { botId } = useParams();

  useEffect(() => {
    setPrevConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    // 新規チャットの場合はTitleをLazy表示にする
    if (!conversations || !prevConversations) {
      return;
    }
    if (conversations.length > prevConversations?.length) {
      setGenerateTitleIndex(
        conversations?.findIndex(
          (c) =>
            (prevConversations?.findIndex((pc) => c.id === pc.id) ?? -1) < 0
        ) ?? -1
      );
    }
  }, [conversations, prevConversations]);

  const onClickNewChat = useCallback(() => {
    newChat();
    if (opened) {
      switchOpen();
    }
  }, [newChat, opened, switchOpen]);

  const onClickNewBotChat = useCallback(() => {
    newChat();
    if (opened) {
      switchOpen();
    }
  }, [newChat, opened, switchOpen]);

  const closeSmallDrawer = useCallback(() => {
    if (opened) {
      switchOpen();
    }
  }, [opened, switchOpen]);

  const isAdminPanel = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location.pathname]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-dark-gray/90 transition-opacity ${
          opened ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={switchOpen}
      />

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 transition-transform duration-300 ease-in-out scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600/30 hover:scrollbar-thumb-slate-600/50 ${
          opened ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Close button */}
        <ButtonIcon
          className="absolute right-3 top-3 z-10 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
          onClick={switchOpen}>
          <PiX />
        </ButtonIcon>

        <nav className="text-sm text-slate-200 pt-4 pb-16">
          {!isAdminPanel && (
            <>
              <div className="px-4 pb-3">
                <DrawerItem
                  isActive={false}
                  icon={<PiNotePencil />}
                  to="/"
                  onClick={onClickNewChat}
                  labelComponent={t('button.newChat')}
                />
              </div>
              
              <div className="border-t border-slate-700/50 pt-3">
                <DrawerItem
                  isActive={false}
                  icon={<PiListBullets />}
                  to="/bot/my"
                  labelComponent={getPageLabel('/bot/my')}
                  onClick={closeSmallDrawer}
                />
                <DrawerItem
                  isActive={false}
                  icon={<PiCompass />}
                  to="/bot/discover"
                  labelComponent={getPageLabel('/bot/discover')}
                  onClick={closeSmallDrawer}
                />
              </div>

              <ExpandableDrawerGroup
                label={t('app.starredBots')}
                className="border-t border-slate-700/50 pt-4 mt-4">
                {starredBots === undefined && (
                  <div className="flex flex-col gap-3 p-3">
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                  </div>
                )}
                {starredBots
                  ?.slice(0, drawerOptions.displayCount.starredBots)
                  .map((bot) => (
                    <DrawerItem
                      key={bot.id}
                      isActive={botId === bot.id && !conversationId}
                      to={`/bot/${bot.id}`}
                      icon={
                        isPinnedBot(bot.sharedStatus) ? (
                          <IconPinnedBot showAlways />
                        ) : (
                          <PiRobot />
                        )
                      }
                      labelComponent={bot.title}
                      onClick={onClickNewBotChat}
                    />
                  ))}

                {starredBots && starredBots.length > 15 && (
                  <Button
                    text
                    rightIcon={<PiArrowRight />}
                    className="w-full mx-3 my-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                    onClick={() => {
                      navigate('/bot/starred');
                      closeSmallDrawer();
                    }}>
                    {t('bot.button.viewAll')}
                  </Button>
                )}
              </ExpandableDrawerGroup>

              <ExpandableDrawerGroup
                label={t('app.recentlyUsedBots')}
                className="border-t border-slate-700/50 pt-4 mt-4">
                {recentlyUsedUnstarredBots === undefined && (
                  <div className="flex flex-col gap-3 p-3">
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                  </div>
                )}
                {recentlyUsedUnstarredBots
                  ?.slice(0, drawerOptions.displayCount.recentlyUsedBots)
                  .map((bot) => (
                    <DrawerItem
                      key={bot.id}
                      isActive={false}
                      to={`/bot/${bot.id}`}
                      icon={
                        isPinnedBot(bot.sharedStatus) ? (
                          <IconPinnedBot showAlways />
                        ) : (
                          <PiRobot />
                        )
                      }
                      labelComponent={bot.title}
                      onClick={onClickNewBotChat}
                    />
                  ))}

                {recentlyUsedUnstarredBots && (
                  <Button
                    text
                    rightIcon={<PiArrowRight />}
                    className="w-full mx-3 my-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                    onClick={() => {
                      navigate('/bot/recently-used');
                      closeSmallDrawer();
                    }}>
                    {t('bot.button.viewAll')}
                  </Button>
                )}
              </ExpandableDrawerGroup>

              <ExpandableDrawerGroup
                label={t('app.conversationHistory')}
                className={twMerge(
                  'border-t border-slate-700/50 pt-4 mt-4',
                  props.isAdmin ? 'mb-20' : 'mb-10'
                )}>
                {conversations === undefined && (
                  <div className="flex flex-col gap-3 p-3">
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                    <Skeleton className="h-10 w-full bg-slate-600/30 rounded-lg" />
                  </div>
                )}
                {conversations
                  ?.slice(0, drawerOptions.displayCount.conversationHistory)
                  .map((conversation, idx) => (
                    <Item
                      key={idx}
                      className="grow"
                      label={conversation.title}
                      conversationId={conversation.id}
                      generatedTitle={idx === generateTitleIndex}
                      updateTitle={props.updateConversationTitle}
                      onClick={closeSmallDrawer}
                      onDelete={() => props.onDeleteConversation(conversation)}
                    />
                  ))}

                {conversations && (
                  <Button
                    text
                    rightIcon={<PiArrowRight />}
                    className="w-full mx-3 my-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                    onClick={() => {
                      navigate('/conversations');
                      closeSmallDrawer();
                    }}>
                    {t('bot.button.viewAll')}
                  </Button>
                )}
              </ExpandableDrawerGroup>
            </>
          )}

          {isAdminPanel && (
            <>
              <div className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 mb-4">
                {t('app.adminConsoles')}
              </div>
              <DrawerItem
                className="w-60"
                isActive={location.pathname === '/admin/shared-bot-analytics'}
                icon={<PiChartLine />}
                to="/admin/shared-bot-analytics"
                labelComponent={getPageLabel('/admin/shared-bot-analytics')}
                onClick={closeSmallDrawer}
              />
              <DrawerItem
                className="w-60"
                isActive={location.pathname === '/admin/api-management'}
                icon={<PiPlugs />}
                to="/admin/api-management"
                labelComponent={getPageLabel('/admin/api-management')}
                onClick={closeSmallDrawer}
              />
            </>
          )}

        </nav>

        {/* Admin links at bottom */}
        {props.isAdmin && !isAdminPanel && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 p-2">
            <DrawerItem
              className="w-full"
              isActive={false}
              icon={<PiPresentationChart />}
              to="/admin/shared-bot-analytics"
              labelComponent={t('app.adminConsoles')}
              onClick={closeSmallDrawer}
            />
          </div>
        )}
        {isAdminPanel && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 p-2">
            <DrawerItem
              className="w-full"
              isActive={false}
              icon={<PiChatCenteredDotsDuotone />}
              to="/"
              labelComponent={t('app.backChat')}
              onClick={closeSmallDrawer}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer;
