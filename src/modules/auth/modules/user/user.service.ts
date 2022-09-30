import { Injectable } from '@nestjs/common';
import { User } from './entities/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './entities/role.model';
import { Privilege } from './entities/privilege.model';
import { Sequelize } from 'sequelize-typescript';
import { UserStatus } from './variables/user.status';
import { Op } from 'sequelize';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  async create(user: Partial<User>, userId?: number): Promise<User> {
    return await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };
      if (userId != null) {
        return await this.userModel.create(
          { ...user, userId },
          transactionHost,
        );
      } else {
        const userEntity = await this.userModel.create(user, transactionHost);
        return await userEntity.update({
          createBy: userEntity.id,
          updateBy: userEntity.id,
        });
      }
    });
  }

  async findOne(key: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        userName: key,
        status: {
          [Op.ne]: UserStatus.DELETED,
        },
      },
      include: [
        {
          model: Role,
          attributes: ['name', 'alias'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: Privilege,
              attributes: ['type'],
              through: {
                attributes: [],
              },
            },
          ],
        },
      ],
    });
  }

  update(user: Partial<User>) {
    console.log(user);
    return `This action updates a #${user.userId} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
