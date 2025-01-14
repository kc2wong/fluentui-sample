import { Site } from '../models/site';
import { Error } from '../models/system';
import { get } from '../utils/http-util';

export const searchSite = async (): Promise<Site[] | Error> => {
  const url = 'https://demo1029256.mockable.io/sites';
  return get<Site[]>(url);
};
