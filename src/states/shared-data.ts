import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { Error, Message, MessageType } from '../models/system';
import { OneOnly } from '../utils/object-util';
import { Site } from '../models/site';
import { searchSite } from '../services/site';
import { BaseState } from './base-state';
import { FunctionTree } from '../models/function-entitlement';
import { searchFunctionTree } from '../services/function-entitlement';
import { Currency } from '../models/currency';
import { searchCurrency } from '../services/currency';
import { EmptyObject } from '../models/common';

export type SharedDataPayload = {
  getCurrency: EmptyObject;
  getSite: EmptyObject;
  getFunctionTree: EmptyObject;
};

enum OperationType {
  None,
  GetCurrency,
  GetSite,
  GetFunctionTree,
}

interface SharedDataState extends BaseState<OperationType> {
  resultSet?: {
    currencies?: Currency[];
    sites?: Site[];
    functionTree?: FunctionTree[];
  };
}

const initialValue: SharedDataState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  resultSet: undefined,
  operationType: OperationType.None,
};

const setOperationResult = (
  current: SharedDataState,
  set: SharedDataAtomSetter,
  error?: Error,
  additionalState: Partial<SharedDataState> = {},
) => {
  const operationResult: Message | undefined = error
    ? { key: error.code, type: MessageType.Error, parameters: error.parameters }
    : undefined;
  set(baseSharedDataAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    operationFailureReason: operationResult,
    version: current.version + 1,
    ...additionalState,
  });
};

const handleSearchCurrency = async (current: SharedDataState, set: SharedDataAtomSetter) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    version: current.version + 1,
  };
  set(baseSharedDataAtom, beforeState);

  const searchCurrencyResult = beforeState.resultSet?.currencies ?? (await searchCurrency());
  const isError = 'code' in searchCurrencyResult;
  setOperationResult(
    beforeState,
    set,
    isError ? searchCurrencyResult : undefined,
    isError
      ? {}
      : {
          resultSet: {
            ...beforeState.resultSet,
            currencies: searchCurrencyResult,
          },
          version: beforeState.version + 1,
        },
  );
};

const handleSearchSite = async (current: SharedDataState, set: SharedDataAtomSetter) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
    version: current.version + 1,
  };
  set(baseSharedDataAtom, beforeState);

  const searchSiteResult = beforeState.resultSet?.sites ?? (await searchSite());
  const isError = 'code' in searchSiteResult;
  setOperationResult(
    beforeState,
    set,
    isError ? searchSiteResult : undefined,
    isError
      ? {}
      : {
          resultSet: {
            ...beforeState.resultSet,
            sites: searchSiteResult,
          },
          version: beforeState.version + 1,
        },
  );
};

const handleSearchFunctionTree = async (current: SharedDataState, set: SharedDataAtomSetter) => {
  const beforeState = {
    ...current,
    operationStartTime: new Date().getTime(),
  };
  set(baseSharedDataAtom, beforeState);

  const searchFunctionTreeResult =
    beforeState.resultSet?.functionTree ?? (await searchFunctionTree());
  const isError = 'code' in searchFunctionTreeResult;
  setOperationResult(
    beforeState,
    set,
    isError ? searchFunctionTreeResult : undefined,
    isError
      ? {}
      : {
          resultSet: {
            ...beforeState.resultSet,
            functionTree: searchFunctionTreeResult,
          },
        },
  );
};

const baseSharedDataAtom = atomWithReset<SharedDataState>(initialValue);
type SharedDataAtomSetter = (atom: typeof baseSharedDataAtom, state: SharedDataState) => void;

export const sharedDataAtom = atom<
  SharedDataState,
  [OneOnly<SharedDataPayload> | typeof RESET],
  Promise<void>
>(
  (get) => get(baseSharedDataAtom),
  async (get, set, payload: OneOnly<SharedDataPayload> | typeof RESET) => {
    const current = get(baseSharedDataAtom);
    if (payload === RESET) {
      set(baseSharedDataAtom, payload);
    } else {
      const { getCurrency, getSite, getFunctionTree } = payload;
      if (getCurrency) {
        await handleSearchCurrency(current, set);
      } else if (getSite) {
        await handleSearchSite(current, set);
      } else if (getFunctionTree) {
        await handleSearchFunctionTree(current, set);
      }
    }
  },
);
