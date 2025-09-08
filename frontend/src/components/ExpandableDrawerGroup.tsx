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
        className="flex w-full cursor-pointer items-center transition hover:brightness-75 px-2 py-1"
        onClick={() => {
          setIsShow(!isShow);
        }}>
        <PiCaretDown className={`mr-2 text-sm transition-transform ${isShow ? '' : '-rotate-90'}`} />
        <div className="italic text-sm font-medium">{props.label}</div>
      </div>
      <div className="mt-1">
        <div
          className={`origin-top transition-all duration-200 ${
            isShow ? 'visible opacity-100' : 'h-0 scale-y-0 opacity-0'
          }`}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default ExpandableDrawerGroup;
