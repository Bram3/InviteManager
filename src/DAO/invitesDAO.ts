import Invite from '../model/DB/invite'
import {BaseDAO} from './baseDAO'
import {DataTypes} from 'sequelize'
import {inject, singleton} from 'tsyringe'
import {Beans} from '../DI/Beans'
import {Logger} from 'winston'

@singleton()
export class InvitesDAO extends BaseDAO {
  constructor(@inject(Beans.Logger) private logger: Logger) {
    super(logger)
    this.init()
  }
  private init() {
    Invite.init(
      {
        id: {
          type: DataTypes.NUMBER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: DataTypes.STRING,
        invites: {
          type: DataTypes.NUMBER,
          defaultValue: 0,
        },
        guild_id: DataTypes.STRING,
        inviter_id: DataTypes.STRING,
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: 'invites',
        sequelize: this.sequelize,
      },
    )
  }

  public async findById(userId: string, guildId: string, inviterId?: string): Promise<[Invite, boolean]> {
    if (typeof inviterId === 'undefined') {
      return await Invite.findOrCreate({
        where: {user_id: userId, guild_id: guildId},
        defaults: {
          user_id: userId,
          guild_id: guildId,
        },
      })
    }
    return await Invite.findOrCreate({
      where: {user_id: userId, guild_id: guildId},
      defaults: {
        inviter_id: inviterId,
        user_id: userId,
        guild_id: guildId,
      },
    })
  }

  public async findTopTen(guildId: string): Promise<Invite[]> {
    return await Invite.findAll({
      order: [['invites', 'DESC']],
      limit: 10,
      where: {guild_id: guildId},
    })
  }

  public async deleteEntry(userId: string, guildId: string): Promise<void> {
    await Invite.destroy({
      where: {
        user_id: userId,
        guild_id: guildId,
      },
    })
  }

}
