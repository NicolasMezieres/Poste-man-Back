import { Server } from 'socket.io';
export const serverMock = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  disconnectSockets: jest.fn(),
} as unknown as Server;
