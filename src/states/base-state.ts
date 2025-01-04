import { useEffect, useRef } from 'react';
import { Message } from '../models/system';

// expects to be an enum
type OperationType = string | number;

export interface BaseState<R extends OperationType> {
  version: number;
  operationStartTime: number;
  operationEndTime: number;
  operationType: R;
  operationFailureReason?: Message;
}

type UseNotificationProps<R extends OperationType, T extends BaseState<R>> = {
  operationStart: () => void;
  operationComplete: (
    operationType: OperationType,
    result: T,
  ) => void;
};

export function useNotification<R extends OperationType, T extends BaseState<R>>(
  state: T,
  { operationStart, operationComplete }: UseNotificationProps<R, T>,
) {
  const stateVersion = useRef(state.version);

  useEffect(() => {
    if (stateVersion.current !== state.version) {
      if (state.operationStartTime > state.operationEndTime) {
        operationStart();
      } else if (state.operationEndTime > state.operationStartTime) {
        operationComplete(
          state.operationType,
          state,
        );
      }
      stateVersion.current = state.version;
    }
  }, [state, operationStart, operationComplete]);
}
