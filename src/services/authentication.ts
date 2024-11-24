import { jwtDecode } from 'jwt-decode';
import { Login, User } from '../models/login';

export const signIn = async (
  id: string,
  _password: string | undefined
): Promise<Login> => {
  const res = await fetch(`https://demo1029256.mockable.io/users`, {
    method: 'POST',
    body: JSON.stringify({ id: id }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });
  const data = await res.json();
  const { user } = jwtDecode<{ user: User }>(data.jwt);
  const login: Omit<Login, 'isAdministrator' | 'isOperator'> = {
    user,
    menu: data.menu,
  };
  const isAdministrator =
    login.menu.find((m) => m.id === 'administrator') !== undefined;
  const isOperator = login.menu.find((m) => m.id === 'operator') !== undefined;
  return { ...login, isAdministrator: isAdministrator, isOperator };
};
