import { Model, Table, Column, DataType } from 'sequelize-typescript';
import { userAttributes } from '../interfaces/user.interfaces';

@Table({
  tableName: 'user',
  timestamps: true,
  comment: '后台用户表',
})
export class User extends Model<userAttributes> implements userAttributes {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.SMALLINT,
    comment: '用户ID',
  })
  userId?: number;

  @Column({
    type: DataType.STRING(24),
    comment: '用户账号',
  })
  userName!: string;

  @Column({
    type: DataType.STRING(24),
    comment: '昵称',
  })
  nickName!: string;

  @Column({ type: DataType.CHAR(32), comment: '密码' })
  passwd!: string;

  @Column({
    type: DataType.CHAR(6),
    comment: '密码盐',
  })
  passwdSalt!: string;

  @Column({ type: DataType.STRING(15), comment: '手机号码' })
  mobile!: string;

  @Column({
    type: DataType.TINYINT,
    comment:
      '用户角色：0-超级管理员|1-管理员|2-开发&测试&运营|3-普通用户（只能查看）',
  })
  role!: number;

  @Column({
    type: DataType.TINYINT,
    comment: '状态：0-失效|1-有效|2-删除',
  })
  userStatus!: number;

  @Column({
    type: DataType.SMALLINT,
    comment: '创建人ID',
  })
  createBy!: number;

  @Column({
    type: DataType.SMALLINT,
    comment: '修改人ID',
  })
  updateBy!: number;
}
