import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import { Error, Message, MessageType } from '../models/system';
import { OneOnly } from '../utils/object-util';
import { searchSite } from '../services/site';
import { BaseState } from './base-state';
import { Site } from '../models/site';
import { delay } from '../utils/date-util';
import { EmptyObject } from '../models/common';

type EntitledSitePayload = {
  get: EmptyObject;
  selectEntitledSite: { siteCode: string[] };
  reset: EmptyObject;
};

type EntitledSite = {
  site: Site;
  selected: boolean;
};

enum OperationType {
  None,
  Search,
  Select,
}

interface EntitledSiteState extends BaseState<OperationType> {
  resultSet?: {
    entitledSite: EntitledSite[];
  };
  isResultSetDirty: boolean;
}

const initialValue: EntitledSiteState = {
  operationStartTime: -1,
  operationEndTime: -1,
  version: 1,
  operationType: OperationType.None,
  resultSet: undefined,
  isResultSetDirty: false,
};

const setOperationResult = (
  current: EntitledSiteState,
  set: SiteMaintenanceAtomSetter,
  error?: Error,
  additionalState: Partial<EntitledSiteState> = {},
) => {
  const operationResult: Message | undefined = error
    ? { key: error.code, type: MessageType.Error, parameters: error.parameters }
    : undefined;
  set(baseEntitledSiteAtom, {
    ...current,
    operationEndTime: new Date().getTime(),
    operationFailureReason: operationResult,
    version: current.version + 1,
    ...additionalState,
  });
};

const handleSearchOrRefresh = async (
  current: EntitledSiteState,
  set: SiteMaintenanceAtomSetter,
) => {
  const beforeState: EntitledSiteState = {
    ...current,
    operationType: OperationType.Search,
    operationStartTime: new Date().getTime(),
    version: current.version + 1,
  };
  set(baseEntitledSiteAtom, beforeState);

  const entitledSiteResult = beforeState.resultSet?.entitledSite ?? (await searchSite());
  const isError = 'code' in entitledSiteResult;
  setOperationResult(
    beforeState,
    set,
    isError ? entitledSiteResult : undefined,
    isError
      ? { isResultSetDirty: false }
      : {
          resultSet: {
            entitledSite: entitledSiteResult.map((s) => {
              if ('site' in s) {
                return s;
              } else {
                return { site: s, selected: true };
              }
            }),
          },
          isResultSetDirty: false,
        },
  );
};

const handleSelectEntitledSite = async (
  current: EntitledSiteState,
  set: SiteMaintenanceAtomSetter,
  siteCode: string[],
) => {
  const beforeState: EntitledSiteState = {
    ...current,
    operationType: OperationType.Select,
    operationStartTime: new Date().getTime(),
    version: current.version + 1,
  };
  set(baseEntitledSiteAtom, beforeState);

  await delay(500);

  const siteCodeSet = new Set<string>(siteCode);
  const newEntitledSite = [...(current.resultSet?.entitledSite ?? [])];
  newEntitledSite.forEach((item) => (item.selected = siteCodeSet.has(item.site.code)));
  setOperationResult(beforeState, set, undefined, {
    resultSet: { entitledSite: newEntitledSite },
  });
};

const baseEntitledSiteAtom = atomWithReset<EntitledSiteState>(initialValue);
type SiteMaintenanceAtomSetter = (
  atom: typeof baseEntitledSiteAtom,
  state: EntitledSiteState,
) => void;

export const entitledSiteAtom = atom<
  EntitledSiteState,
  // [OneOnly<EntitledSitePayload> | typeof RESET],
  [OneOnly<EntitledSitePayload>],
  Promise<void>
>(
  (get) => get(baseEntitledSiteAtom),
  async (get, set, payload: OneOnly<EntitledSitePayload>) => {
    const current: EntitledSiteState = get(baseEntitledSiteAtom);

    const { get: innerGet, selectEntitledSite, reset } = payload;
    if (innerGet) {
      await handleSearchOrRefresh(current, set);
    } else if (selectEntitledSite) {
      handleSelectEntitledSite(current, set, selectEntitledSite.siteCode);
    } else if (reset) {
      set(baseEntitledSiteAtom, RESET);
    }
  },
);
