import React, { createContext, useState } from 'react';
import {
  ConfirmationDialog,
  ConfirmationDialogProps,
} from '../components/Dialog';

interface DialogContextType {
  showConfirmationDialog: (dialogProps: ConfirmationDialogProps) => void;
}

export const DialogContext = createContext<DialogContextType>({
  showConfirmationDialog: () => {},
});

export const DialogProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [confirmationDialogProps, setConfirmationDialogProps] = useState<
    | (ConfirmationDialogProps & { openTime: number; closeTime: number })
    | undefined
  >(undefined);

  const handleShowConfirmationDialog = (
    dialogProps: ConfirmationDialogProps
  ) => {
    setConfirmationDialogProps({
      ...dialogProps,
      openTime: new Date().getTime(),
      closeTime: -1,
    });
  };

  const hideConfirmationDialog = () => {
    if (confirmationDialogProps) {
      setConfirmationDialogProps({
        ...confirmationDialogProps,
        closeTime: new Date().getTime(),
      });
    }
  };

  return (
    <DialogContext.Provider
      value={{
        showConfirmationDialog: handleShowConfirmationDialog,
      }}
    >
      {children}
      {confirmationDialogProps && (
        <ConfirmationDialog
          confirmType={confirmationDialogProps.confirmType}
          message={confirmationDialogProps.message}
          open={
            confirmationDialogProps.openTime > confirmationDialogProps.closeTime
          }
          primaryButton={{
            label: confirmationDialogProps.primaryButton.label,
            icon: confirmationDialogProps.primaryButton.icon,
            action: () => {
              hideConfirmationDialog();
              confirmationDialogProps.primaryButton.action();
            },
          }}
          secondaryButton={
            confirmationDialogProps.secondaryButton
              ? {
                  label: confirmationDialogProps.secondaryButton.label,
                  icon: confirmationDialogProps.secondaryButton.icon,
                  action: () => {
                    hideConfirmationDialog();
                    if (confirmationDialogProps.secondaryButton?.action) {
                      confirmationDialogProps.secondaryButton?.action();
                    }
                  },
                }
              : undefined
          }
          tertiaryButton={
            confirmationDialogProps.tertiaryButton
              ? {
                  label: confirmationDialogProps.tertiaryButton.label,
                  icon: confirmationDialogProps.tertiaryButton.icon,
                  action: () => {
                    hideConfirmationDialog();
                    if (confirmationDialogProps.tertiaryButton?.action) {
                      confirmationDialogProps.tertiaryButton?.action();
                    }
                  },
                }
              : undefined
          }
        ></ConfirmationDialog>
      )}
    </DialogContext.Provider>
  );
};
