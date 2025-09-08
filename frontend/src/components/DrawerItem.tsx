import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

type Props = {
  className?: string;
  isActive?: boolean;
  isBlur?: boolean;
  to: string;
  icon: ReactNode;
  labelComponent: ReactNode;
  actionComponent?: ReactNode;
  onClick?: () => void;
};

const DrawerItem: React.FC<Props> = (props) => {
  return (
    <Link
      className={twMerge(
        'group mx-3 my-1 flex h-11 items-center rounded-lg px-3 transition-all duration-200 ease-in-out',
        (props.isActive ?? false)
          ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
        props.className
      )}
      to={props.to}
      onClick={props.onClick}>
      <div className={`flex h-8 max-h-5 w-full justify-start overflow-hidden`}>
        <div className="mr-3 pt-0.5 flex-shrink-0">{props.icon}</div>
        <div className="flex-1 text-ellipsis break-all font-medium overflow-hidden">
          {props.labelComponent}
        </div>

        <div className="flex flex-shrink-0">{props.actionComponent}</div>
      </div>
    </Link>
  );
};

export default DrawerItem;
