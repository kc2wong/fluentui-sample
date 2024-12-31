import { Deal } from '../models/deal';
import { Error, NotFound, systemError } from '../models/system';

export const getDeal = async (entitledSite: string[], fxRef: string): Promise<Deal | NotFound> => {
  const searchResult = await searchDeal();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find(
      (item) => entitledSite.includes(item.site) && fxRef === item.fxRef,
    );
    return match ? match : new NotFound(['Deal', `fxRef = ${fxRef}`]);
  }
};

export const searchDeal = async (): Promise<Deal[] | Error> => {
  const url = 'https://demo1029256.mockable.io/deals';
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
