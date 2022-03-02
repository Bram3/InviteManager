import {ArgsOf, Client, Guard} from 'discordx'
import {Discord, On} from 'discordx'
import {ModelStatic} from 'sequelize/types'
import {inject, injectable} from 'tsyringe'
import {Logger} from 'winston'
import {InvitesDAO} from '../DAO/invitesDAO'
import {Beans} from '../DI/Beans'
import {EventErrorHandler} from '../guards/eventError'

@Discord()
@injectable()
export class AppDiscord {
  constructor(
    @inject(Beans.Logger) private logger: Logger,
    @inject(Client) private client: Client,
    @inject(Beans.Invites) private invites: ModelStatic<any>,
    @inject(InvitesDAO) private invitesDAO: InvitesDAO,
  ) {}

  @Guard(EventErrorHandler)
  @On('guildMemberRemove')
  async guildMemberRemove([member]: ArgsOf<'guildMemberAdd'>): Promise<unknown> {
    if (member.user.bot)
      return this.logger.info(`${member.displayName} left ${member.guild.name} (Invited by: unknown) `)
    let user = await this.invitesDAO.findById(member.id, member.guild.id)
    if (!user[0].inviter_id) return
    if (user[0].inviter_id === 'VANITY')
      return this.logger.info(`${member.displayName} left ${member.guild.name} (Invited by: vanity) `)
    let inviter = await this.invitesDAO.findById(user[0].inviter_id, member.guild.id)
    if (!inviter) {
      return
    }
    const inviterUser = await this.client.users.fetch(inviter[0].user_id)
    this.logger.info(
      `${member.displayName} left ${member.guild.name} (Invited by: ${inviterUser.username}#${inviterUser?.discriminator}) `,
    )
    await inviter[0].decrement('invites')
    await this.invites.destroy({
      where: {
        user_id: user[0].user_id,
        guild_id: member.guild.id,
      },
    })
    await this.invitesDAO.deleteEntry(user[0].user_id, member.guild.id)
  }
}
