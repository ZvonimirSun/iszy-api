// src/logical/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.model';
import { JwtPayload } from './dto/jwt.payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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
        return user.get({ plain: true });
      } else {
        this.logger.error('密码错误');
        throw new Error('密码错误');
      }
    }
    // 查无此人
    this.logger.error('用户不存在');
    throw new Error('用户不存在');
  }

  certificate(user: User): string {
    const payload: JwtPayload = {
      userName: user.userName,
      userId: user.userId,
    };
    return this.jwtService.sign(payload);
  }

  async login(loginDto: LoginDto): Promise<string> {
    const authResult = await this.validateUser(
      loginDto.userName,
      loginDto.password,
    );
    return this.certificate(authResult);
  }

  async register(registerDto: RegisterDto): Promise<void> {
    const user = await this.usersService.findOne(registerDto.userName);
    if (user) {
      this.logger.error('用户已存在');
      throw new Error('用户已存在');
    }
    const createUserDto: CreateUserDto = new CreateUserDto();
    createUserDto.userName = registerDto.userName;
    createUserDto.nickName = registerDto.nickName;
    createUserDto.passwdSalt = makeSalt();
    createUserDto.passwd = encryptPassword(
      registerDto.password,
      createUserDto.passwdSalt,
    );
    createUserDto.mobile = registerDto.mobile;
    createUserDto.email = registerDto.email;
    createUserDto.userStatus = 0;
    await this.usersService.create(createUserDto);
  }

  async getProfile(userName: string): Promise<User> {
    const user = await this.usersService.findOne(userName);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwd, passwdSalt, createdAt, updatedAt, ...result } = user.get({
        plain: true,
      });
      return result as User;
    }
    this.logger.error('用户不存在');
    throw new Error('用户不存在');
  }
}
