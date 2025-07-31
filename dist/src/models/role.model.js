"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const base_model_1 = require("./base.model");
// Role model class
class Role extends sequelize_1.Model {
    id;
    name;
    description;
    isActive;
    createdAt;
    updatedAt;
}
exports.Role = Role;
// Initialize Role model
Role.init({
    // Base attributes
    ...base_model_1.baseModelOptions,
    // Role-specific attributes
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 100], // Role name must be between 2 and 100 characters
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Role',
    tableName: 'roles',
});
exports.default = Role;
