"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseModelOptions = void 0;
const sequelize_1 = require("sequelize");
// Common model options
exports.baseModelOptions = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
};
