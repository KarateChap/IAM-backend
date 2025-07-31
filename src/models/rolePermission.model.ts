import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * RolePermission Model
 * Junction table for the many-to-many relationship between Roles and Permissions
 */
export interface RolePermissionAttributes {
  roleId: number;
  permissionId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public roleId!: number;
  public permissionId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
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
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
  }
);

export default RolePermission;
