import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { OneOnly } from '../utils/object-util';
import { BaseState } from './base-state';
import { Message, MessageType, Error } from '../models/system';
import { FunctionGroupBase, FunctionGroup } from '../models/function-entitlement';
import {
  addFunctionGroup,
  getFunctionGroup,
  searchFunctionGroup,
  updateFunctionGroup,
} from '../services/function-entitlement';
import { EmptyObject } from '../models/common';

type SearchFunctionGroupPayload = {
  offset: number;
  pageSize: number;
  code?: string;
  name?: string;
};

type EditFunctionGroupPayload = {
  code: string;
};

type SaveFunctionGroupPayload = {
  functionGroup: FunctionGroupBase | FunctionGroup;
  successMessage: Message | undefined;
};

export type FunctionGroupMaintenancePayload = {
  new: EmptyObject;
  discard: EmptyObject;
  search: SearchFunctionGroupPayload;
  save: SaveFunctionGroupPayload;
  edit: EditFunctionGroupPayload;
  view: EditFunctionGroupPayload;
  refresh: EmptyObject;
};

enum OperationType {
  None,
  New,
  Discard,
  Search,
  Save,
  Edit,
  View,
  Refresh,
}

interface FunctionGroupMaintenanceState extends BaseState<OperationType> {
  payload: SearchFunctionGroupPayload;
  resultSet?: FunctionGroup[];
  isResultSetDirty: boolean;
  activeRecord?: FunctionGroup;
}

const initialValue: FunctionGroupMaintenanceState = {
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
  current: FunctionGroupMaintenanceState,
  set: FunctionGroupMaintenanceAtomSetter,
  operationResult: Message | Error | undefined,
  additionalState: Partial<FunctionGroupMaintenanceState> = {},
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
  set(baseFunctionGroupAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    version: current.version + 1,
    operationFailureReason: message,
    ...additionalState,
  });
};

const handleSearchOrRefresh = async (
  current: FunctionGroupMaintenanceState,
  set: FunctionGroupMaintenanceAtomSetter,
  search: SearchFunctionGroupPayload | undefined,
) => {
  const beforeState: FunctionGroupMaintenanceState = {
    ...current,
    payload: search ?? current.payload,
    operationType: search ? OperationType.Search : OperationType.Refresh,
    operationStartTime: new Date().getTime(),
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseFunctionGroupAtom, beforeState);

  const result = await searchFunctionGroup();
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
  current: FunctionGroupMaintenanceState,
  set: FunctionGroupMaintenanceAtomSetter,
  save: SaveFunctionGroupPayload,
) => {
  const beforeState: FunctionGroupMaintenanceState = {
    ...current,
    operationType: OperationType.Save,
    operationStartTime: new Date().getTime(),
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseFunctionGroupAtom, beforeState);

  const functionGroup = save.functionGroup;
  const result =
    'lastUpdatedBy' in functionGroup && 'lastUpdateDatetime' in functionGroup
      ? await updateFunctionGroup(functionGroup)
      : await addFunctionGroup(functionGroup);

  const isError = 'code' in result && !('name' in result);
  const operationResult = isError ? result : save.successMessage;

  setOperationResult(beforeState, set, operationResult, {
    activeRecord: isError ? current.activeRecord : result,
    // result set may mismatch with input payload after record is updated
    isResultSetDirty: current.resultSet !== undefined,
  });
};

const handleEditOrView = async (
  current: FunctionGroupMaintenanceState,
  set: FunctionGroupMaintenanceAtomSetter,
  editOrView: {
    code: string;
    type: OperationType;
  },
) => {
  const beforeState: FunctionGroupMaintenanceState = {
    ...current,
    operationType: editOrView.type,
    operationStartTime: new Date().getTime(),
    activeRecord: undefined,
    operationFailureReason: undefined,
    version: current.version + 1,
  };
  set(baseFunctionGroupAtom, beforeState);

  const result = await getFunctionGroup(editOrView.code);
  const isError = 'code' in result && !('name' in result);
  const operationResult = isError ? result : undefined;

  setOperationResult(beforeState, set, operationResult, {
    activeRecord: isError ? undefined : result,
  });
};

const baseFunctionGroupAtom = atomWithReset<FunctionGroupMaintenanceState>(initialValue);
type FunctionGroupMaintenanceAtomSetter = (
  atom: typeof baseFunctionGroupAtom,
  state: FunctionGroupMaintenanceState,
) => void;

export const functionGroupAtom = atom<
  FunctionGroupMaintenanceState,
  [OneOnly<FunctionGroupMaintenancePayload> | typeof RESET],
  Promise<void>
>(
  (get) => get(baseFunctionGroupAtom),
  async (get, set, payload: OneOnly<FunctionGroupMaintenancePayload> | typeof RESET) => {
    const current: FunctionGroupMaintenanceState = get(baseFunctionGroupAtom);
    if (payload === RESET) {
      set(baseFunctionGroupAtom, payload);
    } else {
      const { search, refresh, save, edit, view, new: newRecord, discard } = payload;
      if (search || refresh) {
        await handleSearchOrRefresh(current, set, payload.search);
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
        set(baseFunctionGroupAtom, {
          ...current,
          activeRecord: undefined,
          operationType: newRecord ? OperationType.New : OperationType.Discard,
          operationFailureReason: undefined,
        });
      }
    }
  },
);
