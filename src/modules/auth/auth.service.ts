// src/logical/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './modules/user/user.service';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto } from './modules/user/dto/create-user.dto';
import { User } from './modules/user/entities/user.model';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UserService) {}

  private readonly logger = new Logger(AuthService.name);

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    if (user) {
      const hashedPassword = user.passwd;
      const salt = user.passwdSalt;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        // 密码正确
        const { passwd, passwdSalt, ...result } = await user.get({
          plain: true,
        });
        return result;
      } else {
        this.logger.error('密码错误');
        return null;
      }
    }
    // 查无此人
    this.logger.error('用户不存在');
    return null;
  }

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const createUserDto: CreateUserDto = new CreateUserDto();
      createUserDto.userName = registerDto.userName;
      createUserDto.nickName = registerDto.nickName;
      createUserDto.passwdSalt = makeSalt();
      createUserDto.passwd = encryptPassword(
        registerDto.password,
        createUserDto.passwdSalt,
      );
      createUserDto.mobile = registerDto.mobile || undefined;
      createUserDto.email = registerDto.email || undefined;
      createUserDto.userStatus = 0;
      await this.usersService.create(createUserDto);
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0];
        if (error) {
          this.logger.error(error.message);
          switch (error.path) {
            case 'userName': {
              throw new Error('用户已存在');
            }
            case 'mobile': {
              throw new Error('手机号已存在');
            }
            case 'email': {
              throw new Error('邮箱已被绑定');
            }
            default: {
              throw new Error(error.message);
            }
          }
        } else {
          throw new Error(e.name);
        }
      }
      throw new Error(e.name ? e.name + e.message : e.message);
    }
  }

  async getProfile(userName: string): Promise<User> {
    const user = await this.usersService.findOne(userName);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwd, passwdSalt, ...result } = user.get({
        plain: true,
      });
      return result as User;
    }
    this.logger.error('用户不存在');
    throw new Error('用户不存在');
  }
}
