import {
  Dialog,
  Button,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import { constructMessage } from '../utils/stringUtil';
import React from 'react';

type BaseDialogButton = {
  label: string;
  icon?: React.ReactElement;
};

type DialogButton = BaseDialogButton & {
  action: () => void;
};

type DialogButtonWithOptionalAction = BaseDialogButton & {
  action?: () => void;
};
export type ConfirmationDialogProps = {
  confirmType: 'save' | 'signOut';
  message: string;
  primaryButton: DialogButton;
  secondaryButton?: DialogButtonWithOptionalAction;
  tertiaryButton?: DialogButtonWithOptionalAction;
};

type HideShowConfirmationDialogProps = ConfirmationDialogProps & { open: boolean };
export const ConfirmationDialog: React.FC<HideShowConfirmationDialogProps> = ({
  confirmType,
  message,
  open,
  primaryButton,
  secondaryButton,
  tertiaryButton,
}: HideShowConfirmationDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {constructMessage(t, 'system.message.confirmAction', [
              t(`system.message.${confirmType}`),
            ])}
          </DialogTitle>
          <DialogContent>{`${message} ?`}</DialogContent>
          <DialogActions>
            {tertiaryButton && (
              <Button
                appearance="secondary"
                icon={tertiaryButton.icon}
                onClick={tertiaryButton.action}
              >
                {tertiaryButton.label}
              </Button>
            )}
            {secondaryButton && (
              <Button
                appearance="secondary"
                icon={secondaryButton.icon}
                onClick={secondaryButton.action}
              >
                {secondaryButton.label}
              </Button>
            )}
            <Button
              appearance="primary"
              icon={primaryButton.icon}
              onClick={primaryButton.action}
            >
              {primaryButton.label}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
