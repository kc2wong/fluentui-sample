import { Currency, CurrencyBase } from '../models/currency';
import { Error } from '../models/system';
import { get, post, put } from '../utils/http-util';

export const searchCurrency = async (): Promise<Currency[] | Error> => {
  const url = 'https://demo1029256.mockable.io/currencies';
  return await get<Currency[]>(url);
};

export const addCurrency = async (currency: CurrencyBase): Promise<Currency | Error> => {
  const url = 'https://demo1029256.mockable.io/currencies';
  return await post<Currency, CurrencyBase>(url, currency);
};

export const updateCurrency = async (currency: Currency): Promise<Currency | Error> => {
  const url = `https://demo1029256.mockable.io/currencies/${currency.code}`;
  return await put<Currency, Currency>(url, currency);
};

export const getCurrency = async (code: string): Promise<Currency | Error> => {
  const searchResult = await searchCurrency();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find((c) => c.code === code);
    return match ? match : { code: 'NotFound', parameters: ['Currency', `code = ${code}`] };
  }
};
