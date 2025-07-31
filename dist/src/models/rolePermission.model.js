"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class RolePermission extends sequelize_1.Model {
    roleId;
    permissionId;
    createdAt;
    updatedAt;
}
exports.RolePermission = RolePermission;
RolePermission.init({
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
    permissionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'permissions',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
});
exports.default = RolePermission;
