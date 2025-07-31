import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes, BaseCreationAttributes, baseModelOptions } from './base.model';

// Role attributes
export interface RoleAttributes extends BaseAttributes {
  name: string;
  description?: string;
  isActive: boolean;
}

// The attributes that are required for creating a new Role instance
export interface RoleCreationAttributes
  extends Optional<RoleAttributes, keyof BaseCreationAttributes> {}

// Role model class
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description!: string | undefined;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Initialize Role model
Role.init(
  {
    // Base attributes
    ...baseModelOptions,

    // Role-specific attributes
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100], // Role name must be between 2 and 100 characters
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  }
);

export default Role;
