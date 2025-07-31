import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { BaseAttributes, BaseCreationAttributes, baseModelOptions } from './base.model';
import Module from './module.model';

// Permission attributes
export interface PermissionAttributes extends BaseAttributes {
  name: string;
  action: 'create' | 'read' | 'update' | 'delete';
  moduleId: number;
  description?: string;
  isActive: boolean;
}

// The attributes that are required for creating a new Permission instance
export interface PermissionCreationAttributes extends Optional<PermissionAttributes, keyof BaseCreationAttributes> {}

// Permission model class
export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public action!: 'create' | 'read' | 'update' | 'delete';
  public moduleId!: number;
  public description!: string | undefined;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Initialize Permission model
Permission.init(
  {
    // Base attributes
    ...baseModelOptions,
    
    // Permission-specific attributes
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100], // Permission name must be between 2 and 100 characters
      },
    },
    action: {
      type: DataTypes.ENUM('create', 'read', 'update', 'delete'),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['create', 'read', 'update', 'delete']],
      },
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id',
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
    modelName: 'Permission',
    tableName: 'permissions',
    indexes: [
      {
        unique: true,
        fields: ['name', 'moduleId', 'action'], // Ensure unique permission per action and module
      },
    ],
  }
);

// Relationships are defined in models/index.ts

export default Permission;
