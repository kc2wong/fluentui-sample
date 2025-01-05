import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { addCurrency, getCurrency, searchCurrency, updateCurrency } from '../services/currency';
import { OneOnly } from '../utils/object-util';
import { BaseState } from './base-state';
import { Message, MessageType, Error } from '../models/system';
import { Currency, CurrencyBase } from '../models/currency';
import { EmptyObject } from '../models/common';

type SearchCurrencyPayload = {
  offset: number;
  pageSize: number;
  code?: string;
  name?: string;
  shortName?: string;
};

type EditCurrencyPayload = {
  code: string;
};

type SaveCurrencyPayload = {
  currency: CurrencyBase | Currency;
};

export type CurrencyMaintenancePayload = {
  new: EmptyObject;
  discard: EmptyObject;
  search: SearchCurrencyPayload;
  save: SaveCurrencyPayload;
  edit: EditCurrencyPayload;
  view: EditCurrencyPayload;
  refresh: EmptyObject;
};

export enum OperationType {
  None,
  New,
  Discard,
  Search,
  Save,
  Edit,
  View,
  Refresh,
}

// State of the currency maintenance function
interface CurrencyMaintenanceState extends BaseState<OperationType> {
  payload: SearchCurrencyPayload;
  resultSet?: Currency[];
  isResultSetDirty: boolean;
  activeRecord?: Currency;
}

const initialValue: CurrencyMaintenanceState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  operationType: OperationType.None,
  operationFailureReason: undefined,
  payload: {
    offset: 0,
    pageSize: 25,
  },
  resultSet: undefined,
  isResultSetDirty: false,
  activeRecord: undefined,
};

const setOperationResult = (
  current: CurrencyMaintenanceState,
  set: CurrencyMaintenanceAtomSetter,
  operationResult: Message | Error | undefined,
  additionalState: Partial<CurrencyMaintenanceState> = {},
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
  set(baseCurrencyAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    version: current.version + 1,
    operationFailureReason: message,
    ...additionalState,
  });
};

const handleSearchOrRefresh = async (
  current: CurrencyMaintenanceState,
  set: CurrencyMaintenanceAtomSetter,
  search: SearchCurrencyPayload | undefined,
) => {
  const beforeState: CurrencyMaintenanceState = {
    ...current,
    payload: search ?? current.payload,
    operationType: search ? OperationType.Search : OperationType.Refresh,
    operationStartTime: new Date().getTime(),
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseCurrencyAtom, beforeState);

  const result = await searchCurrency();
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
        },
  );
};

const handleSave = async (
  current: CurrencyMaintenanceState,
  set: CurrencyMaintenanceAtomSetter,
  save: SaveCurrencyPayload,
) => {
  const beforeState: CurrencyMaintenanceState = {
    ...current,
    operationType: OperationType.Save,
    operationStartTime: new Date().getTime(),
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseCurrencyAtom, beforeState);

  const currency = save.currency;
  const result =
    'lastUpdatedBy' in currency && 'lastUpdateDatetime' in currency
      ? await updateCurrency(currency)
      : await addCurrency(currency);

  const isError = 'code' in result && !('name' in result);
  const operationResult = isError ? result : undefined;

  setOperationResult(beforeState, set, operationResult, {
    activeRecord: isError ? current.activeRecord : result,
    // result set may mismatch with input payload after record is updated
    isResultSetDirty: current.resultSet !== undefined,
  });

};

const handleEditOrView = async (
  current: CurrencyMaintenanceState,
  set: CurrencyMaintenanceAtomSetter,
  editOrView: {
    code: string;
    type: OperationType;
  },
) => {
  const beforeState: CurrencyMaintenanceState = {
    ...current,
    operationStartTime: new Date().getTime(),
    activeRecord: undefined,
    operationType: editOrView.type,
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseCurrencyAtom, beforeState);

  const result = await getCurrency(editOrView.code);
  const isError = 'code' in result && !('name' in result);
  const operationResult = isError ? result : undefined;

  setOperationResult(beforeState, set, operationResult, {
    activeRecord: isError ? undefined : result,
  });
};

const baseCurrencyAtom = atomWithReset<CurrencyMaintenanceState>(initialValue);
type CurrencyMaintenanceAtomSetter = (
  atom: typeof baseCurrencyAtom,
  state: CurrencyMaintenanceState,
) => void;

export const currencyAtom = atom<
  CurrencyMaintenanceState,
  [OneOnly<CurrencyMaintenancePayload> | typeof RESET],
  Promise<void>
>(
  (get) => get(baseCurrencyAtom),
  async (get, set, payload: OneOnly<CurrencyMaintenancePayload> | typeof RESET) => {
    const current: CurrencyMaintenanceState = get(baseCurrencyAtom);

    if (payload === RESET) {
      set(baseCurrencyAtom, payload);
      return;
    }

    const { search, refresh, save, edit, view, new: newRecord, discard } = payload;

    if (search) {
      await handleSearchOrRefresh(current, set, payload.search);
    } else if (refresh) {
      await handleSearchOrRefresh(current, set, undefined);
    } else if (save) {
      await handleSave(current, set, save);
    } else if (edit || view) {
      await handleEditOrView(
        current,
        set,
        payload.edit
          ? { code: payload.edit.code, type: OperationType.Edit }
          : { code: payload.view.code, type: OperationType.View },
      );
    } else if (newRecord || discard) {
      set(baseCurrencyAtom, {
        ...current,
        activeRecord: undefined,
        operationType: newRecord ? OperationType.New : OperationType.Discard,
        operationFailureReason: undefined,
      });
    }
  },
);
