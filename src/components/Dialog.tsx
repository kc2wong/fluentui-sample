import {
  Dialog as FluentUiDialog,
  Button,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import React from 'react';

type DialogButton = {
  label: string;
  icon?: React.ReactElement;
  isCta?: boolean;
  action?: () => void;
};

export type DialogProps = {
  title: string;
  message: string;
  buttons: DialogButton[];
};

type HideShowDialogProps = DialogProps & {
  open: boolean;
};
export const Dialog: React.FC<HideShowDialogProps> = ({
  title,
  message,
  open,
  buttons,
}: HideShowDialogProps) => {
  return (
    <FluentUiDialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>{`${message} ?`}</DialogContent>
          <DialogActions>
            {buttons.map((b, index) => {
              return (
                <Button
                  key={index}
                  appearance={(b.isCta ?? false) ? 'primary' : 'secondary'}
                  icon={b.icon}
                  onClick={b.action}
                >
                  {b.label}
                </Button>
              );
            })}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </FluentUiDialog>
  );
};
