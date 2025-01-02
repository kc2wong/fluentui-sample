export const getCurrentDate = () => {
  const rtn = new Date();
  rtn.setHours(0);
  rtn.setMinutes(0);
  rtn.setSeconds(0);
  rtn.setMilliseconds(0);
  return rtn;
};

export const formatDateDDMMYYYY = (date?: Date): string => {
  if (date) {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    } else {
      return date;
    }
  } else {
    return '';
  }
};

export const formatDateDDMMYYYYHHMISS = (date?: Date): string => {
  if (date) {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    } else {
      return date;
    }
  } else {
    return '';
  }
};

export const parseDateMMDDYYYY = (dateStr: string): Date | undefined => {
  const [day, month, year] = dateStr.split('/').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isValid ? date : undefined;
};

export const nullDateToUndefined = (value: Date | null | undefined): Date | undefined => {
  return value === null ? undefined : value;
};

export const undefinedDateToNull = (value: Date | null | undefined): Date | null => {
  return value === undefined ? null : value;
};

export const delay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
