import React, { createContext, useContext, useState } from 'react';
import { CheckmarkRegular, DismissRegular } from '@fluentui/react-icons';
import { Dialog, DialogProps } from '../components/Dialog';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { constructMessage } from '../utils/string-util';

type BaseDialogButton = {
  label: string;
  icon?: React.ReactElement;
};

type PositiveDialogButton = BaseDialogButton & {
  action: () => void;
};

type NegativeDialogButton = BaseDialogButton & {
  action?: () => void;
};

type ConfirmationDialogProps = {
  // confirmType: 'save' | 'submit' | 'signOut';
  confirmType: string;
  message: string;
  primaryButton: PositiveDialogButton;
  secondaryButton?: NegativeDialogButton;
  tertiaryButton?: NegativeDialogButton;
};

type DiscardChangeDialogProps = {
  action: () => void;
};

interface DialogContextType {
  showConfirmationDialog: (dialogProps: ConfirmationDialogProps) => void;
  showDiscardChangeDialog: (dialogProps: DiscardChangeDialogProps) => void;
}

const DialogContext = createContext<DialogContextType>({
  showConfirmationDialog: () => {},
  showDiscardChangeDialog: () => {},
});

export const DialogProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [dialogProps, setDialogProps] = useState<
    (DialogProps & { openTime: number; closeTime: number }) | undefined
  >(undefined);

  const handleShowConfirmationDialog = ({
    confirmType,
    message,
    primaryButton,
    secondaryButton,
    tertiaryButton,
  }: ConfirmationDialogProps) => {
    const buttonList = [];
    if (tertiaryButton) {
      buttonList.push(tertiaryButton);
    }
    if (secondaryButton) {
      buttonList.push(secondaryButton);
    }
    buttonList.push({ ...primaryButton, isCta: true });
    setDialogProps({
      title: constructMessage(t, 'system.message.confirmAction', [confirmType]),
      message,
      buttons: buttonList,
      openTime: new Date().getTime(),
      closeTime: -1,
    });
  };

  const handleShowDiscardChangeDialog = (t: TFunction, dialogProps: DiscardChangeDialogProps) => {
    setDialogProps({
      title: t('system.message.discardChange'),
      message: t('system.message.doYouWantToDiscardChange'),
      buttons: [
        {
          label: t('system.message.no'),
          icon: <DismissRegular />,
          isCta: true,
        },
        {
          label: t('system.message.yes'),
          icon: <CheckmarkRegular />,
          action: dialogProps.action,
        },
      ],
      openTime: new Date().getTime(),
      closeTime: -1,
    });
  };

  const hideDialog = () => {
    if (dialogProps) {
      setDialogProps({
        ...dialogProps,
        closeTime: new Date().getTime(),
      });
    }
  };

  const { t } = useTranslation();
  return (
    <DialogContext.Provider
      value={{
        showConfirmationDialog: handleShowConfirmationDialog,
        showDiscardChangeDialog: (props) => handleShowDiscardChangeDialog(t, props),
      }}
    >
      {children}
      {dialogProps && (
        <Dialog
          buttons={dialogProps.buttons.map(({ action, ...others }) => {
            return {
              ...others,
              action: () => {
                hideDialog();
                if (action) {
                  action();
                }
              },
            };
          })}
          message={dialogProps.message}
          open={dialogProps.openTime > dialogProps.closeTime}
          title={dialogProps.title}
        ></Dialog>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogContextProvider');
  }
  return context;
};
