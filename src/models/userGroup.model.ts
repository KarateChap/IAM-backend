import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * UserGroup Model
 * Junction table for the many-to-many relationship between Users and Groups
 */
export interface UserGroupAttributes {
  userId: number;
  groupId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserGroup extends Model<UserGroupAttributes> implements UserGroupAttributes {
  public userId!: number;
  public groupId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserGroup.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'user_groups',
    modelName: 'UserGroup',
  }
);

export default UserGroup;
