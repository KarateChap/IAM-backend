"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const base_model_1 = require("./base.model");
// Permission model class
class Permission extends sequelize_1.Model {
    id;
    name;
    action;
    moduleId;
    description;
    isActive;
    createdAt;
    updatedAt;
}
exports.Permission = Permission;
// Initialize Permission model
Permission.init({
    // Base attributes
    ...base_model_1.baseModelOptions,
    // Permission-specific attributes
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100], // Permission name must be between 2 and 100 characters
        },
    },
    action: {
        type: sequelize_1.DataTypes.ENUM('create', 'read', 'update', 'delete'),
        allowNull: false,
        validate: {
            notEmpty: true,
            isIn: [['create', 'read', 'update', 'delete']],
        },
    },
    moduleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'modules',
            key: 'id',
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
    sequelize: database_1.sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    indexes: [
        {
            unique: true,
            fields: ['name', 'moduleId', 'action'], // Ensure unique permission per action and module
        },
    ],
});
// Relationships are defined in models/index.ts
exports.default = Permission;
