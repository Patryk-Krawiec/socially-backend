/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cloudinaryUpload from '@global/helpers/cloudinary-upload';
import { CustomError } from '@global/helpers/error-handler';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/mock.auth';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';
import { Request, Response } from 'express';
import { SignUp } from '../signup';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@global/helpers/cloudinary-upload');

describe('SignUp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should throw an error if username is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'john@test.pl',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'jo',
        email: 'john@test.pl',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if email is not valid', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'not valid email',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  it('should throw an error if email is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: '',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email is a required field');
    });
  });

  it('should throw an error if password is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'john@test.pl',
        password: '',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password length is less than a minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'john@test.pl',
        password: 'jo',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw an error if password length is greater than a maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'john@test.pl',
        password: 'jonathakowalski1234567890',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw unauthorize error is user already exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'john@test.pl',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);
    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Johnny',
        email: 'john@test.pl',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbC8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse() as Response;

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any);
    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');
    jest
      .spyOn(cloudinaryUpload, 'uploads')
      .mockImplementation((): any => Promise.resolve({ version: '1234512', public_id: '123456' }));

    await SignUp.prototype.create(req, res);
    expect(req.session!.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });
  });
});
