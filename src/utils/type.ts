import { role } from './enum';

export type UserWithRole = {
  id: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
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

export type userGateway = {
  clientId: string;
  userId: string;
  projectMemberIds: string[];
  projectId?: string;
};
export type userDataGateway = {
  username: string;
  icon: {
    image: string;
  } | null;
};
export type memberGateway = {
  user: userDataGateway;
  userId: string;
  isBanned: boolean;
  isConnected: boolean;
};

export type resMessageType = { body: { message: string } };

export type queryUserList = { page: number; search: string };
