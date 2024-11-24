type User = {
  id: string;
  name: string;
  lastLoginDatetime: number;
};

interface Login {
  user: User;
  menu: MenuItem[];
  isAdministrator: boolean;
  isOperator: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  children?: MenuItem[];
}

export type { User, Login, MenuItem };
