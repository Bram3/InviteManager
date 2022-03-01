import {ArgsOf, Client, Guard} from 'discordx';
import {Discord, On} from 'discordx';
import {ModelStatic} from 'sequelize/types';
import {inject, injectable} from 'tsyringe';
import {Logger} from 'winston';
import {Beans} from '../DI/Beans';
import {EventErrorHandler} from '../guards/eventError';

@Discord()
@injectable()
export class AppDiscord {
  constructor(
    @inject(Beans.Logger) private logger: Logger,
    @inject(Client) private client: Client,
    @inject(Beans.Invites) private invites: ModelStatic<any>,
  ) {}

  @Guard(EventErrorHandler)
  @On('guildMemberRemove')
  async guildMemberRemove([member]: ArgsOf<'guildMemberAdd'>): Promise<unknown> {
    if (member.user.bot)
      return this.logger.info(`${member.displayName} left ${member.guild.name} (Invited by: unknown) `);
    let user = await this.invites.findOne({
      where: {user_id: member.id, guild_id: member.guild.id},
    });
    if (!user || !user.inviter_id) return;
    if (user.inviter === 'VANITY')
      return this.logger.info(`${member.displayName} left ${member.guild.name} (Invited by: vanity) `);
    let inviter = await this.invites.findOne({
      where: {
        user_id: `${user ? user.inviter_id : `none`}`,
        guild_id: member.guild.id,
      },
    });
    if (!inviter) {
      return;
    }
    const inviterUser = await this.client.users.fetch(inviter.user_id);
    this.logger.info(
      `${member.displayName} left ${member.guild.name} (Invited by: ${inviterUser.username}#${inviterUser?.discriminator}) `,
    );
    await inviter.decrement('invites');
    await this.invites.destroy({
      where: {
        user_id: user.user_id,
        guild_id: member.guild.id,
      },
    });
  }
}
