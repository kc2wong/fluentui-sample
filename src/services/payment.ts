import { Memo, Payment, PaymentBase, PaymentStatus } from '../models/payment';
import { Error, isError } from '../models/system';
import { delay, getCurrentDate } from '../utils/date-util';
import { get } from '../utils/http-util';

type MemoEntity = Omit<Memo, 'createDatetime'> & { createDatetime: number };
type PaymentEntity = Omit<Payment, 'executeDate' | 'memo'> & {
  executeDate: number;
  memo: MemoEntity[];
};

export const searchPayment = async (site?: string[]): Promise<Payment[] | Error> => {
  const url = 'http://demo1029256.mockable.io/payments';
  const resp = await get<PaymentEntity[]>(url);
  if (isError(resp)) {
    return resp;
  } else {
    return resp
      .filter((p) => site === undefined || site.includes(p.site))
      .map((row) => {
        return {
          ...row,
          executeDate: new Date(row.executeDate),
          valueDate: row.valueDate ? new Date(row.valueDate) : undefined,
          memo: row.memo.map((m) => {
            return {
              createDatetime: new Date(m.createDatetime),
              message: m.message,
            };
          }),
        };
      });
  }
};

export const addPayment = async (payment: PaymentBase): Promise<Payment | Error> => {
  const { executeDate, ...others } = payment;
  const savedPayment: Payment = {
    ...others,
    executeDate: executeDate ?? getCurrentDate(),
    instructionId: new Date().getTime().toString(),
    status: PaymentStatus.Started,
    memo: [],
  };
  await delay(1000);
  return Promise.resolve(savedPayment);
};

export const matchDeal = async (payment: Payment, _fxRef: string): Promise<Payment | Error> => {
  const savedPayment: Payment = {
    ...payment,
    status: PaymentStatus.Submitted,
  };
  await delay(1000);
  return Promise.resolve(savedPayment);
};

export const bookDeal = async (
  payment: Payment,
  _product: string,
  _executeDate: Date,
): Promise<Payment | Error> => {
  const savedPayment: Payment = {
    ...payment,
    status: PaymentStatus.Submitted,
  };
  await delay(1000);
  return Promise.resolve(savedPayment);
};

export const getPayment = async (site: string, instructionId: string): Promise<Payment | Error> => {
  const searchResult = await searchPayment();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find((p) => p.site === site && p.instructionId === instructionId);
    return match
      ? match
      : {
          code: 'NotFound',
          parameters: ['Payment', `instructionId = ${instructionId}`],
        };
  }
};

export const addMemo = async (payment: Payment, message: string): Promise<Payment | Error> => {
  const { memo, ...others } = payment;
  const savedPayment: Payment = {
    ...others,
    memo: [...memo, { createDatetime: new Date(), message }],
  };
  await delay(1000);
  return Promise.resolve(savedPayment);
};
