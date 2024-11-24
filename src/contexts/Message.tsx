import React, { createContext, useRef, useState } from 'react';
import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarGroup,
  Spinner,
  ToastIntent,
  tokens,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastOverlay: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
  },
  messageBarGroup: {
    padding: tokens.spacingHorizontalMNudge,
    display: 'flex',
    flexDirection: 'column',
    marginTop: '10px',
    gap: '10px',

    height: '300px',
    overflow: 'auto',
    border: `2px solid ${tokens.colorBrandForeground1}`,
  },
});

type MessageType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  type: MessageType;
  text: string;
}

interface MessageContextType {
  showSpinner: () => void;
  stopSpinner: () => void;
  dispatchMessage: (message: Omit<ToastMessage, 'id'>) => void;
}

export const MessageContext = createContext<MessageContextType>({
  showSpinner: () => {},
  stopSpinner: () => {},
  dispatchMessage: () => {},
});

type ToastProps = {
  message: ToastMessage;
  animate: boolean;
  onDimiss: () => void;
};

const Toast = ({ message, animate, onDimiss }: ToastProps) => {
  const styles = useStyles();
  let intent: ToastIntent = 'info';
  let timeout = 3000;

  switch (message.type) {
    case 'success':
      intent = 'success';
      break;
    case 'info':
      intent = 'info';
      break;
    case 'warning':
      intent = 'warning';
      break;
    case 'error':
      intent = 'error';
      timeout = -1;
      break;
  }

  if (timeout > 0) {
    setTimeout(onDimiss, timeout);
  }
  return (
    <div className={styles.toastOverlay}>
      <MessageBarGroup animate={animate ? 'both' : 'exit-only'}>
        <MessageBar key={intent} intent={intent}>
          <MessageBarBody>
            <span>{message.text}</span>
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                icon={<DismissRegular />}
                size="small"
                onClick={onDimiss}
              />
            }
          ></MessageBarActions>
        </MessageBar>
      </MessageBarGroup>
    </div>
  );
};

interface MessageStore {
  messages: ToastMessage[];
  lastMessageId: number;
}

export const MessageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const styles = useStyles();

  const [messageStore, setMessageStore] = useState<MessageStore>({
    messages: [],
    lastMessageId: 0,
  });
  const [isShowSpinner, setIsShowSpinner] = useState(false);
  const spinnerCount = useRef(0);

  const handleShowSpinner = () => {
    spinnerCount.current = spinnerCount.current + 1;
    if (isShowSpinner === false) {
      setIsShowSpinner(true);
    }
  };

  const handleStopSpinner = () => {
    const stopSpinner = spinnerCount.current === 1;
    spinnerCount.current = Math.max(spinnerCount.current - 1, 0);
    if (stopSpinner) {
      setIsShowSpinner(false);
    }
  };

  const handleDispatchMessage = (message: Omit<ToastMessage, 'id'>) => {
    const { messages, ...others } = messageStore;
    const lastMessageId =
      messages.length > 0
        ? messages[messages.length - 1].id
        : others.lastMessageId;
    // generate id from current time
    messages.push({ id: new Date().getTime(), ...message });
    setMessageStore({ ...others, messages, lastMessageId });
  };

  const dimissToast = (id: number) => {
    const { messages, ...others } = messageStore;
    const messagesAfterRemoval = messages.filter((item) => item.id !== id);
    if (messagesAfterRemoval.length !== messages.length) {
      // one message is removed
      setMessageStore({ ...others, messages: messagesAfterRemoval });
    }
  };

  const { messages, lastMessageId } = messageStore;
  return (
    <MessageContext.Provider
      value={{
        showSpinner: handleShowSpinner,
        stopSpinner: handleStopSpinner,
        dispatchMessage: handleDispatchMessage,
      }}
    >
      {children}
      {isShowSpinner === true && (
        <div className={styles.overlay}>
          <Spinner />
        </div>
      )}
      {messages.map((item) => {
        return (
          <Toast
            key={item.id}
            message={item}
            animate={item.id > lastMessageId}
            onDimiss={() => dimissToast(item.id)}
          />
        );
      })}
    </MessageContext.Provider>
  );
};
