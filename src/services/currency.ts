import { Currency, CurrencyBase } from '../models/currency';
import { Error, systemError } from '../models/system';

export const searchCurrency = async (): Promise<Currency[] | Error> => {
  const url = 'https://demo1029256.mockable.io/currencies';
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

export const addCurrency = async (
  currency: CurrencyBase
): Promise<Currency | Error> => {
  const url = 'https://demo1029256.mockable.io/currencies';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(currency),
  });
  if (res.status === 201) {
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

export const updateCurrency = async (
  currency: Currency
): Promise<Currency | Error> => {
  const url = `https://demo1029256.mockable.io/currencies/${currency.code}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(currency),
  });
  if (res.status === 201) {
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

export const getCurrency = async (code: string): Promise<Currency | Error> => {
  const searchResult = await searchCurrency();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find((c) => c.code === code);
    return match
      ? match
      : { code: 'NotFound', parameters: ['Currency', `code = ${code}`] };
  }
};
