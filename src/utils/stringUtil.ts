import { TFunction } from 'i18next';

const interpolate = (template: string, values?: string[]): string => {
  let result = template;

  (values ?? []).forEach((value, index) => {
    const placeholder = `\${${index + 1}}`;
    result = result.replaceAll(placeholder, value);
  });

  return result;
};

export const capitalize = (str: string) => {
  return `${str.charAt(0)}${str.slice(1)}`;
};

export const snakeCaseToCamelCase = (input: string) => {
  return input.replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase());
};

export const constructMessage = (
  t: TFunction,
  key: string,
  param?: string[]
) => {
  const baseMsg = t(key);
  return key === baseMsg ? key : interpolate(baseMsg, (param ?? []).map(e => t(e)));
};

export const constructErrorMessage = (
  t: TFunction,
  errorCode: string,
  errorParam?: string[]
) => {
  return constructMessage(t, `system.error.${errorCode}`, errorParam);
};
