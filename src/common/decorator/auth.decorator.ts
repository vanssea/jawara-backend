import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
// import { AuthUser } from '../types/types';

export const Auth = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user) {
      return user;
    } else {
      throw new HttpException('Unauthorized', 401);
    }
  },
);
