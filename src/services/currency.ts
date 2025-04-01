import { Currency, CurrencyBase } from '../models/currency';
import { Error } from '../models/system';
import { get, post, put } from '../utils/http-util';
import { API_ROOT_URL } from './env';

export const searchCurrency = async (): Promise<Currency[] | Error> => {
  const url = `${API_ROOT_URL}/currencies`;
  return await get<Currency[]>(url);
};

export const addCurrency = async (currency: CurrencyBase): Promise<Currency | Error> => {
  const url = `${API_ROOT_URL}/currencies`;
  return await post<Currency, CurrencyBase>(url, currency);
};

export const updateCurrency = async (currency: Currency): Promise<Currency | Error> => {
  const url = `${API_ROOT_URL}/currencies/${currency.code}`;
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
