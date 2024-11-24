import { Site } from '../models/site';
import { Error, systemError } from '../models/system';

export const searchSite = async (): Promise<Site[] | Error> => {
  const url = 'https://demo1029256.mockable.io/sites';
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
