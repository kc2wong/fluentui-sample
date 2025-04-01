import { Site } from '../models/site';
import { Error } from '../models/system';
import { get } from '../utils/http-util';
import { API_ROOT_URL } from './env';

export const searchSite = async (): Promise<Site[] | Error> => {
  const url = `${API_ROOT_URL}/sites`;
  return get<Site[]>(url);
};
