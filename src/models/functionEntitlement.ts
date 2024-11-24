import { ModelBase } from './system';

interface FunctionAccess {
  id: string;
  action: string[];
}

interface FunctionTree {
  id: string;
  children: (FunctionTree | FunctionAccess)[];
}

interface FunctionGroupBase {
  code: string;
  name: string;
  entitledSites: string[];
  entitledFunctions: FunctionAccess[];
}

interface FunctionGroup extends ModelBase, FunctionGroupBase {}

export type { FunctionAccess, FunctionTree, FunctionGroupBase, FunctionGroup };
