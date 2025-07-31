"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const base_model_1 = require("./base.model");
// Group model class
class Group extends sequelize_1.Model {
    id;
    name;
    description;
    isActive;
    createdAt;
    updatedAt;
}
exports.Group = Group;
// Initialize Group model
Group.init({
    // Base attributes
    ...base_model_1.baseModelOptions,
    // Group-specific attributes
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 100], // Group name must be between 2 and 100 characters
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
    modelName: 'Group',
    tableName: 'groups',
});
exports.default = Group;
