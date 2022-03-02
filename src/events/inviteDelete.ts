import {Invite, Vanity} from 'discord.js';
import {Client, Guard} from 'discordx';
import {Discord, On} from 'discordx';
import {inject, injectable} from 'tsyringe';
import {Logger} from 'winston';
import {Beans} from '../DI/Beans';
import {EventErrorHandler} from '../guards/eventError';

@Discord()
@injectable()
export class InviteDelete {
  constructor(
    @inject(Beans.Logger) private logger: Logger,
    @inject(Client) private client: Client,
    @inject(Beans.GuildInvites)
    private guildInvites: Map<string, Invite | Vanity>,
  ) {}

  @Guard(EventErrorHandler)
  @On('inviteDelete')
  async inviteDelete(): Promise<void> {
    this.client.guilds.cache.forEach(async guild => {
      this.logger.info(`Refetching invites for ${guild.name}...`);
      let invites = (await guild.invites.fetch()) as any;
      if (guild.vanityURLCode) invites.set(guild.vanityURLCode, await guild.fetchVanityData());
      this.guildInvites.set(guild.id, invites);
    });
  }
}
