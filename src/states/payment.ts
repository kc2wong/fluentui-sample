import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { OneOnly } from '../utils/objectUtil';
import { BaseState } from './baseState';
import { Message, MessageType, Error } from '../models/system';
import { searchPayment } from '../services/payment';
import { Payment } from '../models/payment';

type SearchPaymentPayload = {
  offset: number;
  pageSize: number;
  site?: string[];
};

export type PaymentPayload = {
  new: {};
  search: SearchPaymentPayload;
  refresh: {};
};

// State of the currency maintenance function
interface PaymentState extends BaseState {
  payload: SearchPaymentPayload;
  resultSet?: Payment[];
  isResultSetDirty: boolean;
  activeRecord?: Payment;
}

const initialValue: PaymentState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  operationResult: undefined,
  payload: {
    offset: 0,
    pageSize: 25,
  },
  resultSet: undefined,
  isResultSetDirty: false,
  activeRecord: undefined,
};

const setOperationResult = (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  operationResult: Message | Error | undefined,
  additionalState: Partial<PaymentState> = {}
) => {
  const message =
    operationResult === undefined
      ? undefined
      : 'code' in operationResult
      ? {
          key: operationResult.code,
          type: MessageType.Error,
          parameters: operationResult.parameters,
        }
      : operationResult;
  set(basePaymentAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    version: current.version + 1,
    operationResult: message,
    ...additionalState,
  });
};

const handleSearchOrRefresh = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  search: SearchPaymentPayload | undefined
) => {
  const beforeState = {
    ...current,
    payload: search ?? current.payload,
    operationStartTime: new Date().getTime(),
    operationResult: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  const result = await searchPayment();
  const isError = 'code' in result;
  setOperationResult(
    beforeState,
    set,
    isError ? result : undefined,
    isError
      ? { isResultSetDirty: false }
      : {
          payload: search ?? current.payload,
          resultSet: result,
          isResultSetDirty: false,
          activeRecord: undefined,
        }
  );
};

const basePaymentAtom = atomWithReset<PaymentState>(initialValue);
type PaymentDataAtomSetter = (
  atom: typeof basePaymentAtom,
  state: PaymentState
) => void;

export const paymentAtom = atom<
  PaymentState,
  [OneOnly<PaymentPayload> | typeof RESET],
  Promise<void>
>(
  (get) => get(basePaymentAtom),
  async (get, set, payload: OneOnly<PaymentPayload> | typeof RESET) => {
    const current = get(basePaymentAtom);
    return new Promise<void>(async (resolve) => {
      if (payload === RESET) {
        set(basePaymentAtom, payload);
      } else {
        const { search, refresh } = payload;
        if (search || refresh) {
          await handleSearchOrRefresh(current, set, payload.search);
        }
      }
      resolve();
    });
  }
);
