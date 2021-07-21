import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as Sequelize from 'sequelize';
import sequelize from '../../database/sequelize';

@Injectable()
export class UserService {
  async create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findOne(key: string): Promise<any | undefined> {
    let sql;
    if (isNaN(parseInt(key))) {
      sql = `SELECT
          user_id id, real_name realName, role
        FROM
          admin_user
        WHERE
          account_name = '${key}'
      `;
    } else {
      sql = `SELECT
          user_id id, real_name realName, role
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
          logging: true,
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
