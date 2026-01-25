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
export type queryMessage = {
  items: string;
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
  icon: string | null;
};
export type userDataGateway = {
  username: string;
  icon: string | null;
};
export type memberGateway = {
  user: userDataGateway;
  userId: string;
  isBanned: boolean;
  isConnected: boolean;
};

export type resMessageType = { body: { message: string } };

export type queryUserList = { page: number; search: string };

export type postType = {
  user: userType;
  vote: voteType[];
  text: string;
  id: string;
  isVisible: boolean;
  isArchive: boolean;
  createdAt: Date;
  updatedAt: Date;
  poseX: number | null;
  poseY: number | null;
  score: number;
};
export type userType = {
  username: string;
  id: string;
};
export type voteType = {
  isUp: boolean | null;
};
