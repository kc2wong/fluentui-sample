import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { OneOnly } from '../utils/objectUtil';
import { BaseState } from './baseState';
import { Message, MessageType, Error, isNotFound } from '../models/system';
import {
  addMemo,
  addPayment,
  bookDeal,
  getPayment,
  matchDeal,
  searchPayment,
} from '../services/payment';
import { Payment, PaymentBase } from '../models/payment';
import { Account } from '../models/account';
import { getAccount } from '../services/account';
import { Deal } from '../models/deal';
import { searchDeal } from '../services/deal';
import { searchProductValueDate } from '../services/product';

export type SearchPaymentPayload = {
  offset: number;
  pageSize: number;
  site?: string[];
  account?: string;
  instructionId?: string;
};

type LookupAccountPayload = {
  code: string;
  entitledSite: string[];
};

type SelectAccountPayload = {
  account: Account;
};

type SearchDealPayload = {
  fxRef?: string;
  entitledSite: string[];
};

type PopulateDealPayload = {};

type SavePaymentPayload = {
  payment: PaymentBase;
  onSaveSuccess: {
    message?: Message;
    callback?: (payment: Payment) => void;
  };
};

type MatchDealPayload = {
  fxRef: string;
};

type BookDealPayload = {
  product: string;
  valueDate: Date;
};

type SubmitPaymentPayload = OneOnly<{
  matchDealPayload: MatchDealPayload;
  bookDealPayload: BookDealPayload;
}> & {
  onSaveSuccess: {
    message?: Message;
    callback?: (payment: Payment) => void;
  };
};

type SearchProductPayload = {};

type GetPaymentPayload = {
  site: string;
  instructionId: string;
};

type AddMemoPayload = {
  memo: string;
};

export type PaymentPayload = {
  newPayment: {};
  searchPayment: SearchPaymentPayload;
  refresh: {};
  searchAccount: LookupAccountPayload;
  selectAccount: SelectAccountPayload;
  searchDeal: SearchDealPayload;
  populateDeal: PopulateDealPayload;
  searchProduct: SearchProductPayload;
  savePayment: SavePaymentPayload;
  getPayment: GetPaymentPayload;
  submitPayment: SubmitPaymentPayload;
  addMemo: AddMemoPayload;
};

// State of the currency maintenance function
interface PaymentState extends BaseState {
  payload: SearchPaymentPayload;
  resultSet?: Payment[];
  isResultSetDirty: boolean;
  activeRecord?: Payment;

  accountCode?: string;
  account: Account[];

  potentialMatchDeal?: Deal[];
  productValueDate?: Record<string, Date[]>;
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

  accountCode: undefined,
  account: [],

  potentialMatchDeal: undefined,
  productValueDate: undefined,
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
  const {
    version,
    operationStartTime,
    operationEndTime,
    operationResult,
    ...backupState
  } = current;

  const beforeState = {
    ...current,
    payload: search ?? current.payload,
    operationStartTime: new Date().getTime(),
    operationResult: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  const result = await searchPayment(current.payload.site);
  const isError = 'code' in result;
  setOperationResult(
    beforeState,
    set,
    isError ? result : undefined,
    isError
      ? { ...backupState, isResultSetDirty: false }
      : {
          payload: search ?? current.payload,
          resultSet: result,
          isResultSetDirty: false,
          activeRecord: undefined,
        }
  );
};

const handleNewPayment = async (
  current: PaymentState,
  set: PaymentDataAtomSetter
) => {
  const currentTime = new Date().getTime();
  setOperationResult(current, set, undefined, {
    operationStartTime: currentTime,
    operationEndTime: currentTime,
    operationResult: undefined,
    activeRecord: undefined,
    potentialMatchDeal: undefined,
    productValueDate: undefined,
    accountCode: undefined,
    account: [],
  });
};

const handleGetPayment = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  payload: GetPaymentPayload
) => {
  const {
    version,
    operationStartTime,
    operationEndTime,
    operationResult,
    ...backupState
  } = current;

  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    operationResult: undefined,
    version: current.version + 1,
    activeRecord: undefined,
    potentialMatchDeal: undefined,
    productValueDate: undefined,
    account: [],
  };
  set(basePaymentAtom, beforeState);

  const paymentResult = await getPayment(payload.site, payload.instructionId);
  const isPaymentError = 'code' in paymentResult;
  const accountResult = isPaymentError
    ? undefined
    : await getAccount(paymentResult.account, [paymentResult.site]);
  const isAccountError = accountResult && 'code' in accountResult;

  if (isPaymentError || isAccountError) {
    setOperationResult(
      beforeState,
      set,
      isPaymentError
        ? paymentResult
        : isAccountError
        ? accountResult
        : undefined,
      {
        ...backupState,
      }
    );
  } else {
    setOperationResult(beforeState, set, undefined, {
      activeRecord: paymentResult,
      account: accountResult,
    });
  }
};

const handleSavePayment = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  save: SavePaymentPayload
) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    operationResult: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  const savedPayment = await addPayment(save.payment);
  const isError = 'code' in savedPayment;
  const operationResult = isError ? undefined : save.onSaveSuccess.message;

  setOperationResult(beforeState, set, operationResult, {
    activeRecord: isError ? current.activeRecord : savedPayment,
    // reset potentialMatchDeal so it will be searched again when go to Pairing page
    potentialMatchDeal: undefined,
    isResultSetDirty: current.resultSet !== undefined,
  });

  if (!isError && save.onSaveSuccess.callback) {
    save.onSaveSuccess.callback(savedPayment);
  }
};

const handleSubmitPayment = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  submit: SubmitPaymentPayload
) => {
  const payment = current.activeRecord;
  if (payment) {
    const beforeState = {
      ...current,
      operationStartTime: new Date().getTime(),
      operationResult: undefined,
      version: current.version + 1,
    };
    set(basePaymentAtom, beforeState);

    const matchOrBook = async (): Promise<Payment | Error> => {
      if (submit.matchDealPayload) {
        return await matchDeal(payment, submit.matchDealPayload.fxRef);
      } else {
        return await bookDeal(
          payment,
          submit.bookDealPayload.product,
          submit.bookDealPayload.valueDate
        );
      }
    };
    const result = await matchOrBook();
    const isError = 'code' in result;
    const operationResult = isError ? result : submit.onSaveSuccess.message;

    setOperationResult(beforeState, set, operationResult, {
      activeRecord: isError ? current.activeRecord : result,
      // reset potentialMatchDeal so it will be searched again when go to Pairing page
      potentialMatchDeal: undefined,
      isResultSetDirty: current.resultSet !== undefined,
    });

    if (!isError && submit.onSaveSuccess.callback) {
      submit.onSaveSuccess.callback(result);
    }
  }
};

const handleSearchDeal = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  { entitledSite, fxRef }: SearchDealPayload
) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    unPopuldatedDeal: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  const result = await searchDeal();
  const isError = 'code' in result;
  setOperationResult(
    beforeState,
    set,
    isError ? result : undefined,
    isError ? {} : { potentialMatchDeal: result }
  );
};

const handleSearchProduct = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  _payload: SearchProductPayload
) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    productValueDate: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  const result = await searchProductValueDate();
  setOperationResult(beforeState, set, undefined, { productValueDate: result });
};

const isErrorResult = (result: Account[] | Error): result is Error => {
  return !Array.isArray(result);
};

const handleSearchAccount = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  { code, entitledSite }: LookupAccountPayload
) => {
  if (code !== current.accountCode) {
    if (code.length > 0 && code !== current.accountCode) {
      const beforeState = {
        ...current,
        operationStartTime: new Date().getTime(),
        operationResult: undefined,
        accountCode: code,
        account: [] as Account[],
        version: current.version + 1,
      };
      set(basePaymentAtom, beforeState);

      const result = await getAccount(code, entitledSite);
      const isError = isErrorResult(result);
      setOperationResult(
        beforeState,
        set,
        isError && !isNotFound(result) ? result : undefined,
        isError ? { account: beforeState.account } : { account: result }
      );
    } else {
      setOperationResult(current, set, undefined, { account: [] });
    }
  }
};

const handleSelectAccount = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  { account }: SelectAccountPayload
) => {
  set(basePaymentAtom, {
    ...current,
    accountCode: account.code,
    account: [account],
    version: current.version + 1,
  });
};

const handleAddMemo = async (
  current: PaymentState,
  set: PaymentDataAtomSetter,
  payload: AddMemoPayload
) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    productValueDate: undefined,
    version: current.version + 1,
  };
  set(basePaymentAtom, beforeState);

  if (current.activeRecord) {
    const beforeState = {
      ...current,
      operationStartTime: new Date().getTime(),
      version: current.version + 1,
    };
    set(basePaymentAtom, beforeState);
    const result = await addMemo(current.activeRecord, payload.memo);
    const isError = 'code' in result;
    setOperationResult(
      beforeState,
      set,
      isError && !isNotFound(result) ? result : undefined,
      { activeRecord: isError ? beforeState.activeRecord : result }
    );
  }
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
  async (get, set, payload) => {
    const current = get(basePaymentAtom);
    return new Promise<void>(async (resolve) => {
      if (payload === RESET) {
        set(basePaymentAtom, payload);
      } else {
        const {
          searchPayment,
          refresh,
          searchAccount,
          selectAccount,
          searchDeal,
          savePayment,
          searchProduct,
          newPayment,
          getPayment,
          submitPayment,
          addMemo,
        } = payload;
        if (searchPayment) {
          await handleSearchOrRefresh(current, set, searchPayment);
        } else if (refresh) {
          await handleSearchOrRefresh(current, set, undefined);
        } else if (newPayment) {
          await handleNewPayment(current, set);
        } else if (getPayment) {
          await handleGetPayment(current, set, getPayment);
        } else if (searchAccount) {
          await handleSearchAccount(current, set, searchAccount);
        } else if (selectAccount) {
          await handleSelectAccount(current, set, selectAccount);
        } else if (searchDeal) {
          await handleSearchDeal(current, set, searchDeal);
        } else if (savePayment) {
          await handleSavePayment(current, set, savePayment);
        } else if (submitPayment) {
          await handleSubmitPayment(current, set, submitPayment);
        } else if (searchProduct) {
          await handleSearchProduct(current, set, searchProduct);
        } else if (addMemo) {
          await handleAddMemo(current, set, addMemo);
        }
      }
      resolve();
    });
  }
);
