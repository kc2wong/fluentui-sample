import { useEffect, useRef } from 'react';
import { Message } from '../models/system';

export interface BaseState {
  version: number;
  operationStartTime: number;
  operationEndTime: number;
  operationResult?: Message;
}

type UseNotificationProps<T extends BaseState> = {
  additionAction?: (state: T) => void; // Callback for additional actions
  showSpinner: () => void;
  stopSpinner: () => void;
  showOperationResultMessage: (operationMessage: Message) => void;
};

export function useNotification<T extends BaseState>(
  state: T,
  {
    showSpinner,
    stopSpinner,
    showOperationResultMessage,
    additionAction,
  }: UseNotificationProps<T>
) {
  const stateVersion = useRef(0);

  useEffect(() => {
    if (stateVersion.current !== state.version) {
      if (state.operationStartTime > state.operationEndTime) {
        showSpinner();
      } else if (state.operationEndTime > state.operationStartTime) {
        stopSpinner();
      }

      const operationResult = state.operationResult;
      if (operationResult) {
        showOperationResultMessage(operationResult);
      }

      // Execute the additional action
      if (additionAction) {
        additionAction(state);
      }

      stateVersion.current = state.version;
    }
  }, [
    state,
    showSpinner,
    stopSpinner,
    showOperationResultMessage,
    additionAction,
  ]);
}
