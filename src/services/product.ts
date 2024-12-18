import { getCurrentDate } from '../utils/dateUtil';

export const searchProductValueDate = async (): Promise<
  Record<string, Date[]>
> => {
  const delay = async () => new Promise((resolve) => setTimeout(resolve, 1000));
  await delay();

  const currentDate = getCurrentDate();
  const nextDate = new Date(currentDate.getTime());
  nextDate.setDate(nextDate.getDate() + 1);
  const nextTwoDate = new Date(currentDate.getTime());
  nextTwoDate.setDate(nextDate.getDate() + 2);
  return Promise.resolve({
    PRODUCT_1: [currentDate, nextDate, nextTwoDate],
    PRODUCT_2: [currentDate, nextDate, nextTwoDate],
    PRODUCT_3: [currentDate, nextDate, nextTwoDate],
  });
};
