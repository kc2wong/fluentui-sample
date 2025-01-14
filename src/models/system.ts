// Available themes and languages
export enum Language {
  English = 'en',
  TraditionalChinese = 'zhHant',
}

export type UiMode = 'administrator' | 'operator';

export enum MessageType {
  Success = 'success',
  Info = 'info',
  Error = 'error',
}

export interface Message {
  key: string;
  type: MessageType;
  parameters?: string[];
}

export interface Error {
  code: string;
  parameters?: string[];
}

export class NotFound implements Error {
  code: string;
  parameters?: string[];

  constructor(parameters?: string[]) {
    this.code = 'NotFound'; // Ensure type safety
    this.parameters = parameters;
  }
}

export const isError = (object: any): object is Error => {
  const numOfAttribute = Object.keys(object).length;
  if (numOfAttribute === 1) {
    return 'code' in object;    
  }
  else if (numOfAttribute === 2) {
    return 'code' in object && 'parameters' in object;
  }
  else {
    return false
  }
};

export const isNotFound = (error: Error): error is NotFound => {
  return error.code === 'NotFound';
};

export const systemError = (message: string): Error => {
  return {
    code: 'S9999',
    parameters: [message],
  };
};

export interface ModelBase {
  lastUpdateDatetime: number;
  lastUpdateBy: string;
}
