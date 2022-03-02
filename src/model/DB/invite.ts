import { Sequelize, Model, DataTypes, BuildOptions, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export default class Invite extends Model<InferAttributes<Invite>, InferCreationAttributes<Invite>> {
  declare id: CreationOptional<number>
  declare user_id: string
  declare inviter_id: CreationOptional<string>
  declare invites: CreationOptional<number>
  declare guild_id: string
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

