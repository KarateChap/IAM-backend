import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { BaseAttributes, BaseCreationAttributes, baseModelOptions } from './base.model';
import User from './user.model';

// Group attributes
export interface GroupAttributes extends BaseAttributes {
  name: string;
  description?: string;
  isActive: boolean;
}

// The attributes that are required for creating a new Group instance
export interface GroupCreationAttributes extends Optional<GroupAttributes, keyof BaseCreationAttributes> {}

// Group model class
export class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
  public id!: number;
  public name!: string;
  public description!: string | undefined;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Initialize Group model
Group.init(
  {
    // Base attributes
    ...baseModelOptions,
    
    // Group-specific attributes
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100], // Group name must be between 2 and 100 characters
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
    modelName: 'Group',
    tableName: 'groups',
  }
);

export default Group;
