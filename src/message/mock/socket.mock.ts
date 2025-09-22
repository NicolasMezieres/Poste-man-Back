import { Socket } from 'socket.io';

export const socketMock = {
  join: jest.fn(),
} as unknown as Socket;
