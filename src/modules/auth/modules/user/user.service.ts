import { Injectable } from '@nestjs/common';
import { User } from './entities/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './entities/role.model';
import { Privilege } from './entities/privilege.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(user: Partial<User>) {
    return this.userModel.create(user);
  }

  async findOne(key: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        userName: key,
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
