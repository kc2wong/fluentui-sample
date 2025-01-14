import { FunctionGroup, FunctionGroupBase, FunctionTree } from '../models/function-entitlement';
import { Error } from '../models/system';
import { get, post, put } from '../utils/http-util';

export const searchFunctionTree = async (): Promise<FunctionTree[] | Error> => {
  const url = 'https://demo1029256.mockable.io/functions';
  return await get<FunctionTree[]>(url);
};

export const searchFunctionGroup = async (): Promise<FunctionGroup[] | Error> => {
  const url = 'https://demo1029256.mockable.io/functiongroups';
  return await get<FunctionGroup[]>(url);
};

export const addFunctionGroup = async (
  functionGroup: FunctionGroupBase,
): Promise<FunctionGroup | Error> => {
  const url = 'https://demo1029256.mockable.io/functiongroups';
  return await post<FunctionGroup, FunctionGroupBase>(url, functionGroup);
};

export const updateFunctionGroup = async (
  functionGroup: FunctionGroup,
): Promise<FunctionGroup | Error> => {
  const url = `https://demo1029256.mockable.io/functiongroup/${functionGroup.code}`;
  return await put<FunctionGroup, FunctionGroup>(url, functionGroup);
};

export const getFunctionGroup = async (code: string): Promise<FunctionGroup | Error> => {
  const searchResult = await searchFunctionGroup();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find((c) => c.code === code);
    return match ? match : { code: 'NotFound', parameters: ['Function Group', `code = ${code}`] };
  }
};
