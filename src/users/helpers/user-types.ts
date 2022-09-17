import { User } from '../entities/user.entity';

export type UserHash = Record<'userHash', User['hash']>;

export type UserId = Pick<User, 'id'>;
