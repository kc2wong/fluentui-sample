import { TFunction } from 'i18next';

const interpolate = (template: string, values?: string[]): string => {
  let result = template;

  (values ?? []).forEach((value, index) => {
    const placeholder = `\${${index + 1}}`;
    result = result.replaceAll(placeholder, value);
  });

  return result;
};

export const snakeCaseToCamelCase = (input: string) => {
  return input
    .replace(/^[_-]+|[_-]+$/g, '') // Remove leading and trailing hyphens or underscores
    .replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase());
};

// Format number with thousand separator
export const formatNumber = (value?: number, numDecimal?: number): string => {
  if (value === undefined || value === null) {
    return '';
  }

  const num = value.toString();
  const [integer, decimal = ''] = num.split('.');

  // Format the integer part with thousand separators
  const formattedInteger = parseInt(integer, 10).toLocaleString();

  // Adjust the decimal part based on numDecimal
  let formattedDecimal = decimal;
  if (numDecimal !== undefined) {
    formattedDecimal = decimal.padEnd(numDecimal, '0').slice(0, numDecimal);
  }

  return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : formattedInteger;
};

export const constructMessage = (t: TFunction, key: string, param?: string[]): string => {
  const baseMsg = t(key);
  return key === baseMsg
    ? key
    : interpolate(
        baseMsg,
        (param ?? []).map((e) => t(e)),
      );
};

export const constructErrorMessage = (
  t: TFunction,
  errorCode: string,
  errorParam?: string[],
): string => {
  return constructMessage(t, `system.error.${errorCode}`, errorParam);
};

export const stringToEnum = <T extends Record<string, string>>(
  enumType: T,
  value: string,
): T[keyof T] | undefined => {
  return Object.values(enumType).includes(value as T[keyof T]) ? (value as T[keyof T]) : undefined;
};
