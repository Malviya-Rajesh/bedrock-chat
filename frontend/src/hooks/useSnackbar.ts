import { create } from 'zustand';

type SnackbarSeverity = 'info' | 'warning' | 'error';

const useSnackbarState = create<{
  isOpen: boolean;
  message: string;
  severity: SnackbarSeverity;
  open: (message: string, severity?: SnackbarSeverity) => void;
  close: () => void;
}>((set) => {
  return {
    isOpen: false,
    message: '',
  severity: 'error',
  open: (message, severity = 'error') => {
      set(() => ({
        isOpen: true,
        message,
        severity,
      }));
    },
    close: () => {
      set(() => ({
        isOpen: false,
      }));
    },
  };
});

const useSnackbar = () => {
  const { open, close, isOpen, message, severity } = useSnackbarState();

  return {
    open,
    close,
    isOpen,
    message,
    severity,
  };
};
export default useSnackbar;
