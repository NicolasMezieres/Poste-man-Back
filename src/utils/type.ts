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

export type querySearchProject = {
  page: number;
  search: string;
};
export type querySearchAdminProject = {
  page: number;
  search: string;
  fromDate: string;
  toDate: string;
};

export type message = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  message: string;
  user: { username: string };
};
