import { ZodObject, ZodRawShape } from 'zod';
import { ModelBase } from '../models/system';

// Derive a new type where only one of the properties is defined at a time
export type OneOnly<T> = {
  [K in keyof T]: { [P in K]: T[P] } & Partial<Record<Exclude<keyof T, K>, undefined>>;
}[keyof T];

export const isEmpty = (object?: object) =>
  object === undefined || object === null || Object.keys(object).length === 0;

export const isNotEmpty = (object?: object) => !isEmpty(object);

export const emptyStringToUndefined = <T>(obj: T | string): T | string | undefined => {
  if (Array.isArray(obj)) {
    // If it's an array, recursively apply the function to each element
    return obj.map(emptyStringToUndefined) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    // If it's an object, recursively apply the function to each property
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        value === '' ? undefined : emptyStringToUndefined(value),
      ]),
    ) as T;
  } else if (obj === '') {
    return undefined;
  }
  // Return the original value if it's not an array or object
  return obj;
};

export const undefinedToEmptyString = <T>(obj: T | string | undefined): T | string => {
  if (obj === undefined) {
    return '';
  } else if (Array.isArray(obj)) {
    return obj.map(undefinedToEmptyString) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        value === undefined ? '' : undefinedToEmptyString(value),
      ]),
    ) as T;
  }
  return obj;
};

export const createEmptyObject = <T extends ZodRawShape>(
  schema: ZodObject<T>,
): { [K in keyof T]: string } =>
  Object.keys(schema.shape).reduce(
    (result, key) => {
      result[key as keyof T] = '';
      return result;
    },
    {} as { [K in keyof T]: string },
  );

const emptyModelBase: ModelBase = {
  lastUpdateDatetime: 0,
  lastUpdateBy: '',
};

export const isNewRecord = (object: object): boolean => {
  const isExistingObject = Object.keys(emptyModelBase).reduce((result, key) => {
    return result && key in object;
  }, true);
  return !isExistingObject;
};

export const isEqual = <T extends string | number = string | number>(a: T[], b: T[]) => {
  let i = a.length;
  if (i !== b.length) {
    return false;
  }
  while (i--) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
