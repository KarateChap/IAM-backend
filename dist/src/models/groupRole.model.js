"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRole = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class GroupRole extends sequelize_1.Model {
    groupId;
    roleId;
    createdAt;
    updatedAt;
}
exports.GroupRole = GroupRole;
GroupRole.init({
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
    roleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'roles',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'group_roles',
    modelName: 'GroupRole',
});
exports.default = GroupRole;
