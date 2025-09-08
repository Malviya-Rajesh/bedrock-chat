import React, { ReactNode, useState } from 'react';
import { PiCaretDown } from 'react-icons/pi';
import { twMerge } from 'tailwind-merge';

type Props = {
  className?: string;
  label: string;
  children: ReactNode;
  isDefaultShow?: boolean;
};

const ExpandableDrawerGroup: React.FC<Props> = ({
  isDefaultShow = true,
  ...props
}) => {
  const [isShow, setIsShow] = useState(isDefaultShow);

  return (
    <div className={twMerge(props.className)}>
      <div
        className="flex w-full cursor-pointer items-center px-4 py-3 transition-all duration-200 hover:bg-slate-700/30 rounded-lg mx-2"
        onClick={() => {
          setIsShow(!isShow);
        }}>
        <PiCaretDown className={`mr-2 text-sm transition-transform duration-200 text-slate-400 ${isShow ? '' : '-rotate-90'}`} />
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{props.label}</div>
      </div>
      <div className="px-2">
        <div
          className={`origin-top transition-all duration-300 ease-in-out ${
            isShow ? 'visible opacity-100 max-h-96' : 'h-0 scale-y-0 opacity-0 max-h-0'
          }`}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ExpandableDrawerGroup;
