import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { encryptPassword, makeSalt } from '../../utils/cryptogram';
import { User } from './entities/user.model';
import { QueryTypes } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { userAttributes } from './interfaces/user.interfaces';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(createUserDto: userAttributes) {
    return this.userModel.create(createUserDto);
  }

  async findOne(key: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        userName: key,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
