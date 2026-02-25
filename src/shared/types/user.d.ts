import { PublicUser } from '@zvonimirsun/iszy-common'

export type MinimalUser = Pick<PublicUser, 'userId' | 'userName' | 'nickName'>
