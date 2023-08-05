import { AuthPayload } from '@auth/interfaces/auth.interface';
import { Response } from 'express';

export const authMockRequest = (
  sessionData: IJWT,
  body: IAuthMock,
  currentUser?: AuthPayload | null,
  params?: any
) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const authMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

export interface IJWT {
  jwt?: string;
}

export interface IAuthMock {
  _id?: string;
  username?: string;
  email?: string;
  uId?: string;
  password?: string;
  avatarColor?: string;
  avatarImage?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
