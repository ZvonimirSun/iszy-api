import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Sequelize } from 'sequelize-typescript';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { User } from './entities/user.entity';
import { QueryTypes } from 'sequelize';

@Injectable()
export class UserService {
  constructor(private sequelize: Sequelize) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.password !== createUserDto.rePassword) {
      return {
        code: 400,
        msg: '两次密码输入不一致',
      };
    }
    const user = await this.findOne(createUserDto.userName);
    if (user) {
      return {
        code: 400,
        msg: '用户已存在',
      };
    }
    const newUser = new User();
    newUser.user_name = createUserDto.userName;
    newUser.nick_name = createUserDto.nickName;
    newUser.mobile = createUserDto.mobile;
    newUser.passwd_salt = makeSalt();
    newUser.passwd = encryptPassword(
      createUserDto.password,
      newUser.passwd_salt,
    );
    newUser.user_status = 1;
    newUser.role = 3;
    newUser.create_by = 0;
    const registerSQL = `
      INSERT INTO admin_user
        (user_name, nick_name, passwd, passwd_salt, mobile, user_status, role, create_by)
      VALUES
        ('${newUser.user_name}', '${newUser.nick_name}', '${newUser.passwd}', '${newUser.passwd_salt}', '${newUser.mobile}', '${newUser.user_status}', '${newUser.role}', '${newUser.create_by}')
    `;
    try {
      await this.sequelize.query(registerSQL, { logging: false });
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

  async findOne(key: string): Promise<any | undefined> {
    let sql;
    if (isNaN(parseInt(key))) {
      sql = `SELECT
          user_id userId, user_name username, nick_name nickName, passwd password, passwd_salt salt, mobile, role
        FROM
          admin_user
        WHERE
          user_name = '${key}'
      `;
    } else {
      sql = `SELECT
          user_id id, nick_name nickName, role
        FROM
          admin_user
        WHERE
          user_id = '${key}'
      `;
    }
    try {
      const user = (
        await this.sequelize.query(sql, {
          type: QueryTypes.SELECT,
          raw: true,
          logging: false,
        })
      )[0];
      return user;
    } catch (error) {
      return void 0;
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
