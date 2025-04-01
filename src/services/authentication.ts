import { jwtDecode } from 'jwt-decode';
import { Login, MenuItem, User } from '../models/login';
import { post } from '../utils/http-util';
import { Error, isError } from '../models/system';
import { API_ROOT_URL } from './env';

type SignInResp = {
  jwt: string;
  menu: MenuItem[];
};

export const signIn = async (id: string, _password: string | undefined): Promise<Login | Error> => {
  const resp = await post<SignInResp>(`${API_ROOT_URL}/users`, { id: id });
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
};
