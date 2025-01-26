import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { Login } from '../models/login';
import { signIn as signApi } from '../services/authentication';
import { OneOnly } from '../utils/object-util';
import { BaseState } from './base-state';
import { EmptyObject } from '../models/common';
import { isError, MessageType } from '../models/system';

type OptionalLogin = Login | undefined;

export enum OperationType {
  None,
  SignIn,
  AcknowledgeSignIn,
  SignOut,
}

interface AuthenticationState extends BaseState<OperationType> {
  login: OptionalLogin;
  acknowledge: boolean;
}

const initialValue: AuthenticationState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  operationType: OperationType.None,
  operationFailureReason: undefined,
  login: undefined,
  acknowledge: false,
};

const authenticationAtom = atomWithReset<AuthenticationState>(initialValue);

type SignInPayload = {
  id: string;
  password: string | undefined;
};

type AuthenticationPayload = {
  signIn: SignInPayload;
  acknowledgeSignIn: EmptyObject;
  signOut: EmptyObject;
  reset: EmptyObject;
};

export const authentication = atom<
  AuthenticationState,
  [OneOnly<AuthenticationPayload>],
  Promise<void>
>(
  (get) => get(authenticationAtom),
  async (
    get,
    set,
    { signIn, acknowledgeSignIn, signOut, reset }: OneOnly<AuthenticationPayload>,
  ) => {
    const current = get(authenticationAtom);
    const currentTime = new Date().getTime();
    if (signIn) {
      const beforeState: AuthenticationState = {
        ...current,
        operationType: OperationType.SignIn,
        operationStartTime: currentTime,
        version: current.version + 1,
        operationFailureReason: undefined,
        login: undefined,
        acknowledge: false,
      };
      set(authenticationAtom, beforeState);
      const result = await signApi(signIn.id, signIn.password);
      const isFailed = isError(result);

      const afterState: AuthenticationState = {
        ...beforeState,
        operationEndTime: new Date().getTime(),
        version: beforeState.version + 1,
        operationFailureReason: isFailed
          ? {
              key: result.code,
              type: MessageType.Error,
              parameters: result.parameters,
            }
          : undefined,
        login: isFailed ? undefined : result,
      };
      set(authenticationAtom, afterState);
    } else if (acknowledgeSignIn) {
      set(authenticationAtom, {
        ...current,
        operationType: OperationType.AcknowledgeSignIn,
        operationStartTime: currentTime - 1,
        operationEndTime: currentTime,
        version: current.version + 1,
        operationFailureReason: undefined,
        acknowledge: true,
      });
    } else if (signOut) {
      set(authenticationAtom, {
        ...current,
        operationType: OperationType.SignOut,
        operationStartTime: currentTime - 1,
        operationEndTime: currentTime,
        version: current.version + 1,
        operationFailureReason: undefined,
        login: undefined,
        acknowledge: false,
      });
    } else if (reset) {
      set(authenticationAtom, RESET);
    }
  },
);
