import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { BaseAttributes, BaseCreationAttributes, baseModelOptions } from './base.model';

// Module attributes
export interface ModuleAttributes extends BaseAttributes {
  name: string;
  description?: string;
  isActive: boolean;
}

// The attributes that are required for creating a new Module instance
export interface ModuleCreationAttributes extends Optional<ModuleAttributes, keyof BaseCreationAttributes> {}

// Module model class
export class Module extends Model<ModuleAttributes, ModuleCreationAttributes> implements ModuleAttributes {
  public id!: number;
  public name!: string;
  public description!: string | undefined;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Initialize Module model
Module.init(
  {
    // Base attributes
    ...baseModelOptions,
    
    // Module-specific attributes
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100], // Module name must be between 2 and 100 characters
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
    modelName: 'Module',
    tableName: 'modules',
  }
);

export default Module;
