import React, { useEffect, useMemo } from 'react';
import {
  PiInfo,
  PiWarningCircleFill,
  PiX,
  PiXCircleFill,
} from 'react-icons/pi';
import ButtonIcon from '../components/ButtonIcon';
import useSnackbar from '../hooks/useSnackbar';
import { Transition } from '@headlessui/react';

type Props = {
  children: React.ReactNode;
};

const SnackbarProvider: React.FC<Props> = ({ children }) => {
  const { isOpen, close, message, severity } = useSnackbar();

  const appearance = useMemo(() => {
    switch (severity) {
      case 'warning':
        return {
          containerClass:
            'bg-amber-500 text-aws-squid-ink-light dark:text-aws-font-color-white-dark',
          Icon: PiWarningCircleFill,
        };
      case 'error':
        return {
          containerClass: 'bg-red text-aws-font-color-white-light',
          Icon: PiXCircleFill,
        };
      default:
        return {
          containerClass:
            'bg-aws-squid-ink-dark text-aws-font-color-white-light',
          Icon: PiInfo,
        };
    }
  }, [severity]);

  useEffect(() => {
    if (isOpen) {
      // 5000 ms で自動非表示
      setTimeout(() => {
        close();
      }, 5000);
    }
  }, [close, isOpen]);

  return (
    <>
      <div className="fixed left-0 top-0 z-50 w-full lg:left-1/3 lg:w-1/2">
        <Transition
          show={isOpen}
          enter="transform transition duration-75"
          enterFrom="opacity-0 scale-50"
          enterTo="opacity-100 scale-100"
          leave="transform duration-200 transition ease-in-out"
          leaveFrom="opacity-100 scale-100 "
          leaveTo="opacity-0 scale-95 ">
          <div className="">
            <div
              className={`mx-4 mt-4 flex justify-between rounded p-3 text-sm shadow-lg ${appearance.containerClass}`}>
              <div className="mr-3 text-2xl">
                <appearance.Icon />
              </div>
              <div className="grow">{message}</div>
              <div className="-mr-2 -mt-2">
                <ButtonIcon onClick={close}>
                  <PiX />
                </ButtonIcon>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      {children}
    </>
  );
};

export default SnackbarProvider;
