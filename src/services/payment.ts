import { Payment } from '../models/payment';
import { Error } from '../models/system';

export const searchPayment = async (): Promise<Payment[] | Error> => {
  return Promise.resolve([]);
};
