import { Account } from '../models/account';
import { Error, NotFound } from '../models/system';
import { get } from '../utils/http-util';
import { API_ROOT_URL } from './env';

export const searchAccount = async (
  _site?: string[],
  _accountCode?: string,
  _accountName?: string,
): Promise<Account[] | Error> => {
  const url = `${API_ROOT_URL}/accounts`;
  return await get<Account[]>(url);
};

export const getAccount = async (
  code: string,
  entitledSite: string[],
): Promise<Account[] | Error> => {
  const searchResult = await searchAccount();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.filter(
      (item) => item.code === code && entitledSite.includes(item.site),
    );
    return match.length > 0 ? match : new NotFound(['Account', `code = ${code}`]);
  }
};
