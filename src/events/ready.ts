import { ExcludeEnum, Invite, PresenceStatusData, Vanity } from 'discord.js'
import { ActivityTypes } from 'discord.js/typings/enums'
import { ArgsOf, Client, Discord, Guard, Once } from 'discordx'
import { inject, singleton } from 'tsyringe'
import { Logger } from 'winston'
import config from '../config'
import { Beans } from '../DI/Beans'
import { EventErrorHandler } from '../guards/eventError'

@Discord()
@singleton()
export class AppDiscord {
  constructor(
    @inject(Beans.Logger) private logger: Logger,
    @inject(Beans.GuildInvites)
    private guildInvites: Map<string, Invite | Vanity>,
    @inject(Client) private client: Client
  ) {}

  @Guard(EventErrorHandler)
  @Once('ready')
  async onReady([client]: ArgsOf<'ready'>): Promise<void> {
    this.logger.info(
      `Logged in as: ${client.user?.tag} (id: ${client.user?.id})`
    )
    if (config.botstatus.enabled === true) {
      if (config.botstatus.activity_type.toUpperCase() == 'STREAMING') {
        this.client.user?.setPresence({
          activities: [
            {
              name: config.botstatus.activity_text,
              type: config.botstatus.activity_type as
                | ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>
                | undefined,
              url: config.botstatus.activity_url,
            },
          ],
          status: config.botstatus.status.toLowerCase() as
            | PresenceStatusData
            | undefined,
        })
      } else {
        client.user.setPresence({
          activities: [
            {
              name: config.botstatus.activity_text,
              type: config.botstatus.activity_type.toUpperCase() as
                | ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>
                | undefined,
            },
          ],
          status: config.botstatus.status.toLowerCase() as
            | PresenceStatusData
            | undefined,
        })
      }
    }
    client.guilds.cache.forEach(async (guild) => {
      this.logger.info(`Refetching invites for ${guild.name}...`)
      let invites = (await guild.invites.fetch()) as any
      if (guild.vanityURLCode)
        invites.set(guild.vanityURLCode, await guild.fetchVanityData())
      this.guildInvites.set(guild.id, invites)
    })
  }
}
