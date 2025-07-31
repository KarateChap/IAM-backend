"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGroup = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class UserGroup extends sequelize_1.Model {
    userId;
    groupId;
    createdAt;
    updatedAt;
}
exports.UserGroup = UserGroup;
UserGroup.init({
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    groupId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'groups',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'user_groups',
    modelName: 'UserGroup',
});
exports.default = UserGroup;
