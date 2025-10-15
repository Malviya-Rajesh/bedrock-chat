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
  PiListBullets,
  PiNotePencil,
  PiPencilLine,
  PiPlugs,
  PiPresentationChart,
  PiRobot,
  PiTrash,
  PiX,
  PiUsersThree,
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
import useAccessibleBots from '../hooks/useAccessibleBots';

type Props = BaseProps & {
  isAdmin: boolean;
  conversations?: ConversationMeta[];
  starredBots?: BotListItem[];
  recentlyUsedUnstarredBots?: BotListItem[];
  updateConversationTitle: (
    conversationId: string,
    title: string
  ) => Promise<void>;
  onSignOut: () => void;
  onDeleteConversation: (conversation: ConversationMeta) => void;
  onClearConversations: () => void;
  onSelectLanguage: () => void;
  onClickDrawerOptions: () => void;
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

  const isAdminPanel = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location.pathname]);

  const showMyBotsGroup = useMemo(() => {
    return !isAdminPanel;
  }, [isAdminPanel]);

  const showAdminMyBotsLink = useMemo(() => {
    return props.isAdmin && isAdminPanel;
  }, [isAdminPanel, props.isAdmin]);

  const {
    bots: accessibleBots,
    error: accessibleBotsError,
    isLoading: isLoadingAccessibleBots,
  } = useAccessibleBots(showMyBotsGroup);
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
        className={`fixed left-0 top-0 z-50 h-full w-64 overflow-y-auto bg-aws-squid-ink-light transition-transform duration-300 ease-in-out scrollbar-thin scrollbar-track-aws-squid-ink-light/10 scrollbar-thumb-aws-squid-ink-light/30 dark:bg-aws-ui-color-dark dark:scrollbar-track-aws-ui-color-dark dark:scrollbar-thumb-aws-ui-color-dark/30 ${
          opened ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Close button */}
        <ButtonIcon
          className="absolute right-2 top-2 z-10 text-white text-xl hover:brightness-75 transition-all"
          onClick={switchOpen}>
          <PiX />
        </ButtonIcon>

        <nav className="text-sm text-aws-font-color-white-light dark:text-aws-font-color-white-dark pt-2">
          {!isAdminPanel && (
            <>
              <div className="mb-2">
                <DrawerItem
                  isActive={false}
                  icon={<PiNotePencil />}
                  to="/"
                  onClick={onClickNewChat}
                  labelComponent={t('button.newChat')}
                />
              </div>

              {showMyBotsGroup && (
                <ExpandableDrawerGroup
                  label={t('bot.label.myBots')}
                  className="border-t border-aws-font-color-white-light/20 dark:border-aws-font-color-white-dark/20 mt-2 pt-3 pb-2"
                  isDefaultShow={false}>
                  {isLoadingAccessibleBots && (
                    <div className="flex flex-col gap-2 p-2">
                      <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                      <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                      <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    </div>
                  )}
                  {accessibleBotsError && (
                    <div className="px-4 py-2 text-xs text-red-200">
                      {accessibleBotsError.message}
                    </div>
                  )}
                  {accessibleBots && accessibleBots.length === 0 && !isLoadingAccessibleBots && !accessibleBotsError && (
                    <div className="px-4 py-2 text-xs italic text-aws-font-color-white-light/70 dark:text-aws-font-color-white-dark/70">
                      {t('bot.label.noBots')}
                    </div>
                  )}
                  {accessibleBots?.map((bot) => (
                    <DrawerItem
                      key={bot.id}
                      isActive={botId === bot.id && !conversationId}
                      to={`/bot/${bot.id}`}
                      icon={<PiRobot />}
                      labelComponent={bot.title}
                      onClick={onClickNewBotChat}
                    />
                  ))}
                </ExpandableDrawerGroup>
              )}

              <ExpandableDrawerGroup
                label={t('app.starredBots')}
                className="border-t border-aws-font-color-white-light/20 dark:border-aws-font-color-white-dark/20 mt-2 pt-3 pb-2">
                {starredBots === undefined && (
                  <div className="flex flex-col gap-2 p-2">
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
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
                    className="w-full"
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
                className="border-t border-aws-font-color-white-light/20 dark:border-aws-font-color-white-dark/20 mt-2 pt-3 pb-2">
                {recentlyUsedUnstarredBots === undefined && (
                  <div className="flex flex-col gap-2 p-2">
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
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
                    className="w-full"
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
                  'border-t border-aws-font-color-white-light/20 dark:border-aws-font-color-white-dark/20 mt-2 pt-3 pb-2',
                  props.isAdmin ? 'mb-20' : 'mb-10'
                )}>
                {conversations === undefined && (
                  <div className="flex flex-col gap-2 p-2">
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
                    <Skeleton className="h-10 w-full bg-aws-sea-blue-light/50 dark:bg-aws-sea-blue-dark/50" />
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
                    className="w-full"
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
              <div className="px-4 py-3 text-sm font-medium italic border-b border-aws-font-color-white-light/20 dark:border-aws-font-color-white-dark/20">
                {t('app.adminConsoles')}
              </div>
              <div className="pt-2">
                {showAdminMyBotsLink && (
                  <DrawerItem
                    className="w-60"
                    isActive={location.pathname === '/bot/my'}
                    icon={<PiListBullets />}
                    to="/bot/my"
                    labelComponent={getPageLabel('/bot/my')}
                    onClick={closeSmallDrawer}
                  />
                )}
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
                  isActive={location.pathname === '/admin/user-usages'}
                  icon={<PiUsersThree />}
                  to="/admin/user-usages"
                  labelComponent={getPageLabel('/admin/user-usages')}
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
              </div>

            </>
          )}

          {/* Bottom menu */}
          {(props.isAdmin || isAdminPanel) && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-start border-t border-aws-font-color-white-light/20 bg-aws-squid-ink-light py-1 dark:border-aws-font-color-white-dark/20 dark:bg-aws-ui-color-dark">
              {props.isAdmin && !isAdminPanel && (
                <DrawerItem
                  className="w-60"
                  isActive={false}
                  icon={<PiPresentationChart />}
                  to="/admin/shared-bot-analytics"
                  labelComponent={t('app.adminConsoles')}
                  onClick={closeSmallDrawer}
                />
              )}
              {isAdminPanel && (
                <DrawerItem
                  className="w-60"
                  isActive={false}
                  icon={<PiChatCenteredDotsDuotone />}
                  to="/"
                  labelComponent={t('app.backChat')}
                  onClick={closeSmallDrawer}
                />
              )}
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Drawer;
