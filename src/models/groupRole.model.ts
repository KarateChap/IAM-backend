import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * GroupRole Model
 * Junction table for the many-to-many relationship between Groups and Roles
 */
export interface GroupRoleAttributes {
  groupId: number;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GroupRole extends Model<GroupRoleAttributes> implements GroupRoleAttributes {
  public groupId!: number;
  public roleId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GroupRole.init(
  {
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
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'group_roles',
    modelName: 'GroupRole',
  }
);

export default GroupRole;
