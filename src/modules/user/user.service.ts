import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as Sequelize from 'sequelize';
import sequelize from '../../database/sequelize';
import { makeSalt, encryptPassword } from '../../utils/cryptogram';

@Injectable()
export class UserService {
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
    const salt = makeSalt();
    const hashPwd = encryptPassword(createUserDto.password, salt);
    const registerSQL = `
      INSERT INTO admin_user
        (user_name, nick_name, passwd, passwd_salt, mobile, user_status, role, create_by)
      VALUES
        ('${createUserDto.userName}', '${createUserDto.nickName}', '${hashPwd}', '${salt}', '${createUserDto.mobile}', 1, 3, 0)
    `;
    try {
      await sequelize.query(registerSQL, { logging: false });
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
        await sequelize.query(sql, {
          type: Sequelize.QueryTypes.SELECT,
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
