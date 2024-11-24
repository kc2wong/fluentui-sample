import { atom } from 'jotai';
import { Login } from '../models/login';
import { signIn as signApi } from '../services/authentication';
import { OneOnly } from '../utils/objectUtil';
import { BaseState } from './baseState';
import { Message, MessageType } from '../models/system';

type OptionalLogin = Login | undefined;

interface AuthenticationState extends BaseState {
  login: OptionalLogin;
  acknowledge: boolean;
}

const initialValue: AuthenticationState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  operationResult: undefined,
  login: undefined,
  acknowledge: false,
};

const authenticationAtom = atom<AuthenticationState>(initialValue);

type SignInPayload = {
  id: string;
  password: string | undefined;
};

export type AuthenticationPayload = {
  signIn: SignInPayload;
  acknowledgeSignIn: {};
  signOut: {};
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
    { signIn, acknowledgeSignIn, signOut }: OneOnly<AuthenticationPayload>
  ) => {
    const current = get(authenticationAtom);
    return new Promise<void>(async (resolve) => {
      if (signIn) {
        const beforeState = {
          ...current,
          operationStartTime: new Date().getTime(),
          version: current.version + 1,
          operationResult: undefined,
          login: undefined,
          acknowledge: false,
        };
        set(authenticationAtom, beforeState);
        const result = await signApi(signIn.id, signIn.password);
        const operationResult: Message = {
          key: 'login.success',
          type: MessageType.Success,
          parameters: undefined,
        };
        const afterState = {
          ...beforeState,
          operationEndTime: new Date().getTime(),
          version: beforeState.version + 1,
          operationResult,
          login: result,
        };
        set(authenticationAtom, afterState);
      } else if (acknowledgeSignIn) {
        set(authenticationAtom, {
          ...current,
          version: current.version + 1,
          operationResult: undefined,
          acknowledge: true,
        });
      } else if (signOut) {
        set(authenticationAtom, {
          ...current,
          version: current.version + 1,
          operationResult: undefined,
          login: undefined,
          acknowledge: false,
        });
      }
      resolve();
    });
  }
);
