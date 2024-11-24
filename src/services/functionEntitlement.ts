import { FunctionGroup, FunctionGroupBase, FunctionTree } from '../models/functionEntitlement';
import { Error, systemError } from '../models/system';

export const searchFunctionTree = async (): Promise<FunctionTree[] | Error> => {
  const url = 'https://demo1029256.mockable.io/functions';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });
  if (res.status === 200) {
    return await res.json();
  } else {
    const text = await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = JSON.parse(text);
      const errorCode = json.code;
      const errorParameters = json.parameters;
      return { code: errorCode, parameters: errorParameters as string[] };
    } else {
      return systemError(text);
    }
  }
};

export const searchFunctionGroup = async (): Promise<FunctionGroup[] | Error> => {
  const url = 'https://demo1029256.mockable.io/functiongroups';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });
  if (res.status === 200) {
    return await res.json();
  } else {
    const text = await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = JSON.parse(text);
      const errorCode = json.code;
      const errorParameters = json.parameters;
      return { code: errorCode, parameters: errorParameters as string[] };
    } else {
      return systemError(text);
    }
  }
};

export const addFunctionGroup = async (
  functionGroup: FunctionGroupBase
): Promise<FunctionGroup | Error> => {
  const url = 'https://demo1029256.mockable.io/functiongroups';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(functionGroup),
  });
  if (res.status === 201) {
    return await res.json();
  } else {
    const text = await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = JSON.parse(text);
      const errorCode = json.code;
      const errorParameters = json.parameters;
      return { code: errorCode, parameters: errorParameters as string[] };
    } else {
      return systemError(text);
    }
  }
};

export const updateFunctionGroup = async (
  functionGroup: FunctionGroup
): Promise<FunctionGroup | Error> => {
  const url = `https://demo1029256.mockable.io/functiongroup/${functionGroup.code}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(functionGroup),
  });
  if (res.status === 201) {
    return await res.json();
  } else {
    const text = await res.text();
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = JSON.parse(text);
      const errorCode = json.code;
      const errorParameters = json.parameters;
      return { code: errorCode, parameters: errorParameters as string[] };
    } else {
      return systemError(text);
    }
  }
};

export const getFunctionGroup = async (code: string): Promise<FunctionGroup | Error> => {
  const searchResult = await searchFunctionGroup();
  if ('code' in searchResult) {
    return searchResult;
  } else {
    const match = searchResult.find((c) => c.code === code);
    return match
      ? match
      : { code: 'NotFound', parameters: ['Function Group', `code = ${code}`] };
  }
};