import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { Error, Message, MessageType } from '../models/system';
import { OneOnly } from '../utils/objectUtil';
import { Site } from '../models/site';
import { searchSite } from '../services/site';
import { BaseState } from './baseState';
import { FunctionTree } from '../models/functionEntitlement';
import { searchFunctionTree } from '../services/functionEntitlement';

export type SharedDataPayload = {
  getSite: {};
  getFunctionTree: {};
};

interface SharedDataState extends BaseState {
  resultSet?: {
    sites?: Site[];
    functionTree?: FunctionTree[];
  };
}

const initialValue: SharedDataState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  resultSet: undefined,
};

const setOperationResult = (
  current: SharedDataState,
  set: SharedDataAtomSetter,
  error?: Error,
  additionalState: Partial<SharedDataState> = {}
) => {
  const operationResult: Message | undefined = error
    ? { key: error.code, type: MessageType.Error, parameters: error.parameters }
    : undefined;
  set(baseSharedDataAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    operationResult,
    version: current.version + 1,
    ...additionalState,
  });
};

const handleSearchSite = async (
  current: SharedDataState,
  set: SharedDataAtomSetter
) => {
  let beforeState = {
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
            sites: searchSiteResult,
            functionTree: beforeState.resultSet?.functionTree,
          },
          version: beforeState.version + 1,
        }
  );
};

const handleSearchFunctionTree = async (
  current: SharedDataState,
  set: SharedDataAtomSetter
) => {
  let beforeState = {
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
            functionTree: searchFunctionTreeResult,
            sites: beforeState.resultSet?.sites,
          },
        }
  );
};

const baseSharedDataAtom = atomWithReset<SharedDataState>(initialValue);
type SharedDataAtomSetter = (
  atom: typeof baseSharedDataAtom,
  state: SharedDataState
) => void;

export const sharedDataAtom = atom<
  SharedDataState,
  [OneOnly<SharedDataPayload> | typeof RESET],
  Promise<void>
>(
  (get) => get(baseSharedDataAtom),
  async (get, set, payload: OneOnly<SharedDataPayload> | typeof RESET) => {
    const current = get(baseSharedDataAtom);
    return new Promise<void>(async (resolve) => {
      if (payload === RESET) {
        set(baseSharedDataAtom, payload);
      } else {
        const { getSite, getFunctionTree } = payload;
        if (getSite) {
          await handleSearchSite(current, set);
        } else if (getFunctionTree) {
          await handleSearchFunctionTree(current, set);
        }
      }
      resolve();
    });
  }
);
