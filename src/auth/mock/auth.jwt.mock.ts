export const JwtMock = {
  signAsync: jest.fn().mockResolvedValue('jwtToken'),
};
