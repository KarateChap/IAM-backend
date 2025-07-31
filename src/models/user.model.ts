import { Model, DataTypes, Optional, BelongsToMany } from 'sequelize';
import bcryptjs from 'bcryptjs';
import { sequelize } from '../config/database';
import { BaseAttributes, BaseCreationAttributes, baseModelOptions } from './base.model';

// User attributes
export interface UserAttributes extends BaseAttributes {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  groups?: any[]; // Add this for type compatibility with UserPermissionController
}

// The attributes that are required for creating a new User instance
export interface UserCreationAttributes extends Optional<UserAttributes, keyof BaseCreationAttributes> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Use declare to tell TypeScript about properties without creating class fields
  // This avoids shadowing Sequelize's getters and setters
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare firstName: string | undefined;
  declare lastName: string | undefined;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  
  // Association properties - use declare to avoid shadowing
  declare groups?: any[];

  // Define associations
  static associate() {
    // This will be set up in database.ts
  }

  // Helper method to validate password
  public async validatePassword(candidatePassword: string): Promise<boolean> {
    return await bcryptjs.compare(candidatePassword, this.password);
  }
}

// Initialize User model
User.init(
  {
    // Base attributes
    ...baseModelOptions,
    
    // User-specific attributes
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50], // Username must be between 3 and 50 characters
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, // Validate email format
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100], // Password must be at least 6 characters
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
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
    modelName: 'User',
    tableName: 'users',
    // Hash password before saving
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcryptjs.genSalt(10);
          user.password = await bcryptjs.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        // Only hash the password if it's being changed
        if (user.changed('password')) {
          const salt = await bcryptjs.genSalt(10);
          user.password = await bcryptjs.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
