import { Account } from '../models/account';
import { Error, NotFound, systemError } from '../models/system';

export const searchAccount = async (
  _site?: string[],
  _accountCode?: string,
  _accountName?: string,
): Promise<Account[] | Error> => {
  const url = 'https://demo1029256.mockable.io/accounts';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });
  if (res.status === 200) {
    return await res.json();
  } else {
    const text = await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = JSON.parse(text);
      const errorCode = json.code;
      const errorParameters = json.parameters;
      return { code: errorCode, parameters: errorParameters as string[] };
    } else {
      return systemError(text);
    }
  }
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
