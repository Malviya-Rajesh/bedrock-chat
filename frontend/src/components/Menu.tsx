import React, { useEffect, useRef, useState } from 'react';
import {
  PiList,
  PiSidebar,
  PiSignOut,
  PiTranslate,
  PiTrash,
} from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { BaseProps } from '../@types/common';
import { twMerge } from 'tailwind-merge';
import useLoginUser from '../hooks/useLoginUser';
import { IoMoonSharp, IoSunnyOutline } from 'react-icons/io5';
import useLocalStorage from '../hooks/useLocalStorage';
import Toggle from './Toggle';

type Props = BaseProps & {
  onSignOut: () => void;
  onSelectLanguage: () => void;
  onClickDrawerOptions: () => void;
  onClearConversations: () => void;
};

const MenuSettings: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { userGroups, userName } = useLoginUser();

  const [isOpen, setIsOpen] = useState(false);
  // If you want to add a theme, change the type from boolean to string and change the UI from pulldown.
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClickOutside = (event: any) => {
      // メニューボタンとメニュー以外をクリックしていたらメニューを閉じる
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    if (theme === 'dark') {
      setIsDarkTheme(true);
    }
  }, [theme]);

  const changeTheme = (isDarkTheme: boolean) => {
    setIsDarkTheme(isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.className = 'dark';
      setTheme('dark');
    } else {
      document.documentElement.className = 'light';
      setTheme('light');
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={twMerge(
          'relative p-2 rounded-full hover:bg-slate-700/50 transition-colors text-white',
          props.className
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}>
        <PiList className="text-xl" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 right-2 w-64 overflow-hidden rounded border border-slate-600 bg-slate-800 shadow-lg text-slate-200 z-50">
          <div className="flex flex-col gap-1 border-b border-slate-600 p-4 bg-slate-700/50">
            <div className="font-semibold text-slate-200 truncate">{userName}</div>
            <div className="text-sm">
              <div className="italic text-slate-400">{t('app.userGroups')}</div>
              <ul className="list-disc pl-5 text-slate-300">
                {userGroups.map((group) => (
                  <li key={group} className="truncate">{group}</li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="flex w-full cursor-pointer items-center p-3 hover:bg-slate-700 transition-colors"
            onClick={() => {
              setIsOpen(false);
              props.onClickDrawerOptions();
            }}>
            <PiSidebar className="mr-3 text-slate-400" />
            <span className="text-slate-200 truncate">{t('button.drawerOption')}</span>
          </div>

          <div
            className="flex w-full cursor-pointer items-center p-3 hover:bg-slate-700 transition-colors"
            onClick={() => {
              setIsOpen(false);
              props.onSelectLanguage();
            }}>
            <PiTranslate className="mr-3 text-slate-400" />
            <span className="text-slate-200 truncate">{t('button.language')}</span>
          </div>

          <div className="flex w-full items-center px-3 py-2 hover:bg-slate-700 transition-colors">
            {isDarkTheme ? (
              <IoMoonSharp className="mr-3 text-slate-400" />
            ) : (
              <IoSunnyOutline className="mr-3 text-slate-400" />
            )}
            <div className="flex w-full items-center justify-between">
              <span className="text-slate-200">{t('button.mode')}</span>
              <Toggle
                value={isDarkTheme}
                onChange={(isDarkTheme) => {
                  changeTheme(isDarkTheme);
                }}
              />
            </div>
          </div>
          <div
            className="flex w-full cursor-pointer items-center border-t border-slate-600 p-3 hover:bg-slate-700 transition-colors"
            onClick={() => {
              setIsOpen(false);
              props.onClearConversations();
            }}>
            <PiTrash className="mr-3 text-slate-400" />
            <span className="text-slate-200 truncate">{t('button.clearConversation')}</span>
          </div>
          <div
            className="flex w-full cursor-pointer items-center border-t border-slate-600 p-3 hover:bg-red-900/30 transition-colors"
            onClick={props.onSignOut}>
            <PiSignOut className="mr-3 text-red-400" />
            <span className="text-red-400 truncate">{t('button.signOut')}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuSettings;
