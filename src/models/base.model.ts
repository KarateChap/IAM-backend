import { Model, DataTypes, Optional } from 'sequelize';

// Base attributes that all models will inherit
export interface BaseAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// Optional attributes for creation (typically id and timestamps)
export type BaseCreationAttributes = Optional<BaseAttributes, 'id' | 'createdAt' | 'updatedAt'>;

// Common model options
export const baseModelOptions = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
};
