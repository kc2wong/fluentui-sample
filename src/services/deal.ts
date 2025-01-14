import { Deal } from '../models/deal';
import { Error, NotFound } from '../models/system';
import { get } from '../utils/http-util';

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
  return get<Deal[]>(url);
};
