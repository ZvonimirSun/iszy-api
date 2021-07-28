// src/logical/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // JWT验证 - Step 2: 校验用户信息
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
          user,
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

  // JWT验证 - Step 3: 处理 jwt 签证
  async certificate(user: any) {
    const payload = {
      username: user.username,
      sub: user.userId,
      nickName: user.nickName,
      role: user.role,
    };
    try {
      const token = this.jwtService.sign(payload);
      return {
        code: 200,
        data: {
          token,
        },
        msg: `登录成功`,
      };
    } catch (error) {
      return {
        code: 600,
        msg: `账号或密码错误`,
      };
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    const authResult = await this.validateUser(
      loginDto.userName,
      loginDto.password,
    );

    switch (authResult.code) {
      case 1:
        return this.certificate(authResult.user);
      case 2:
        return {
          code: 600,
          msg: `账号或密码不正确`,
        };
      default:
        return {
          code: 600,
          msg: `查无此人`,
        };
    }
  }

  async register(registerDto: RegisterDto): Promise<any> {
    if (registerDto.password !== registerDto.rePassword) {
      return {
        code: 400,
        msg: '两次密码输入不一致',
      };
    }
    const user = await this.usersService.findOne(registerDto.userName);
    if (user) {
      return {
        code: 400,
        msg: '用户已存在',
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
        code: 200,
        msg: 'Success',
      };
    } catch (error) {
      return {
        code: 503,
        msg: `Service error: ${error}`,
      };
    }
  }
}
