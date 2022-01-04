// src/logical/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResultDto } from '../../core/result.dto';
import { User } from '../user/entities/user.model';
import { JwtPayload } from './dto/jwt.payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user) {
      const hashedPassword = user.passwd;
      const salt = user.passwdSalt;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        // 密码正确
        return {
          code: 1,
          user: user.get({ plain: true }),
        };
      } else {
        // 密码错误
        return {
          code: 2,
          user: null,
        };
      }
    }
    // 查无此人
    return {
      code: 3,
      user: null,
    };
  }

  async certificate(user: User): Promise<ResultDto> {
    const payload: JwtPayload = {
      userName: user.userName,
      userId: user.userId,
    };
    try {
      const token = this.jwtService.sign(payload);
      return {
        code: '00000',
        data: {
          token,
        },
        message: `登录成功`,
      };
    } catch (error) {
      return {
        code: 'B0101',
        message: `登录失败，签署token出错，${error}`,
      };
    }
  }

  async login(loginDto: LoginDto): Promise<ResultDto> {
    const authResult = await this.validateUser(
      loginDto.userName,
      loginDto.password,
    );

    switch (authResult.code) {
      case 1:
        return this.certificate(authResult.user);
      case 2:
        return {
          code: 'A0103',
          message: `账号或密码不正确`,
        };
      default:
        return {
          code: 'A0102',
          message: `查无此人`,
        };
    }
  }

  async register(registerDto: RegisterDto): Promise<ResultDto> {
    const user = await this.usersService.findOne(registerDto.userName);
    if (user) {
      return {
        code: 'A0101',
        message: '用户已存在',
      };
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
    createUserDto.userStatus = 1;
    createUserDto.createBy = 0;
    try {
      await this.usersService.create(createUserDto);
      return {
        code: '00000',
        message: '用户已创建',
      };
    } catch (error) {
      return {
        code: 'C0101',
        message: `Service error: ${error}`,
      };
    }
  }

  async refreshToken({ userId, userName }: User): Promise<ResultDto> {
    const payload: JwtPayload = {
      userName: userName,
      userId: userId,
    };
    try {
      const token = this.jwtService.sign(payload);
      return {
        code: '00000',
        data: {
          token,
        },
        message: `刷新成功`,
      };
    } catch (error) {
      return {
        code: 'B0101',
        message: `刷新失败，签署token出错，${error}`,
      };
    }
  }

  async getProfile(userName: string): Promise<ResultDto> {
    const user = await this.usersService.findOne(userName);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwd, passwdSalt, createdAt, updatedAt, ...result } = user.get({
        plain: true,
      });
      return {
        code: '00000',
        data: result,
        message: '获取成功',
      };
    } else {
      return {
        code: 'A0102',
        message: `查无此人`,
      };
    }
  }
}
