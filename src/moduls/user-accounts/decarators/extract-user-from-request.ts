import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../dto/user.context.dto';

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context.switchToHttp().getRequest();
    console.log('Request user from extract decorator:', request.user);
    const user = request.user;

    if (!user) {
      throw new Error('there is no user in the request object!');
    }
    return user;
  },
);
