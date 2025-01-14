// import * as Sentry from '@sentry/react';

import { jwtDecode } from 'jwt-decode';
import { Login, MenuItem, User } from '../models/login';
import { post } from '../utils/http-util';
import { Error, isError } from '../models/system';

type SignInResp = {
  jwt: string;
  menu: MenuItem[];
};

export const signIn = async (id: string, _password: string | undefined): Promise<Login | Error> => {
  const resp = await post<SignInResp>('https://demo1029256.mockable.io/users', { id: id });
  if (isError(resp)) {
    return resp;
  } else {
    const { user } = jwtDecode<{ user: User }>(resp.jwt);
    const login: Omit<Login, 'isAdministrator' | 'isOperator'> = {
      user,
      menu: resp.menu,
    };
    const isAdministrator = login.menu.find((m) => m.id === 'administrator') !== undefined;
    const isOperator = login.menu.find((m) => m.id === 'operator') !== undefined;
    return { ...login, isAdministrator: isAdministrator, isOperator };
  }

  // const traceId = Sentry.getCurrentScope().getPropagationContext().traceId;
  // // eslint-disable-next-line no-console
  // console.log(`traceId = ${traceId}`)

  // const res = await fetch('https://demo1029256.mockable.io/users', {
  //   method: 'POST',
  //   body: JSON.stringify({ id: id }),
  //   headers: {
  //     'Content-type': 'application/json; charset=UTF-8',
  //   },
  // });
  // const data = await res.json();
  // const { user } = jwtDecode<{ user: User }>(data.jwt);
  // const login: Omit<Login, 'isAdministrator' | 'isOperator'> = {
  //   user,
  //   menu: data.menu,
  // };
  // const isAdministrator = login.menu.find((m) => m.id === 'administrator') !== undefined;
  // const isOperator = login.menu.find((m) => m.id === 'operator') !== undefined;
  // return { ...login, isAdministrator: isAdministrator, isOperator };
};
