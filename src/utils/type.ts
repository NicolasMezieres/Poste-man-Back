import { role } from './enum';

export type UserWithRole = {
  id: string;
  role: {
    name: role;
  };
};

export type JwtValidatedUser = {
  id: string;
  isActive: boolean;
  role: {
    name: string;
  };
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};
