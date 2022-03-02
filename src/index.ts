import 'reflect-metadata'
import {addColors} from 'winston'
import {Client, DIService} from 'discordx'
import {Intents, Interaction} from 'discord.js'
import {importx, dirname} from '@discordx/importer'
import {config} from 'dotenv'
import {Logger, transports, format, createLogger} from 'winston'
import {Beans} from './DI/Beans'
import {container} from 'tsyringe'
import { InvitesDAO } from './DAO/invitesDAO'

config()

export default class Bot {
  private static client: Client
  private static logger: Logger
  private static guildInvites = new Map()
  private static invitesDAO: InvitesDAO

  static get Client(): Client {
    return this.client
  }

  static async start(): Promise<void> {
    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      modules: 3,
      modwarn: 4,
      modinfo: 5,
      debug: 6,
    }

    addColors({
      error: 'red',
      warn: 'yellow',
      info: 'green',
      modules: 'cyan',
      modwarn: 'yellow',
      modinfo: 'green',
      debug: 'blue',
    })

    this.logger = createLogger({
      levels: logLevels,
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.timestamp()),
        }),
      ],
      format: format.combine(
        format.colorize(),
        format.padLevels({levels: logLevels}),
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}:${info.message}`),
      ),
      level: 'debug',
    })

    DIService.container = container
    container.registerInstance(Beans.Logger, this.logger)
    container.registerInstance(Beans.GuildInvites, this.guildInvites)

    this.invitesDAO = container.resolve(InvitesDAO)

    container.registerInstance(InvitesDAO, this.invitesDAO)

    this.client = new Client({
      botGuilds: [client => client.guilds.cache.map(guild => guild.id)],
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
    })

    container.registerInstance(Client, this.client)

    this.client.once('ready', async () => {
      await this.client.initApplicationCommands({
        guild: {log: false},
      })
      await this.client.initApplicationPermissions(true)
    })

    this.client.on('interactionCreate', (interaction: Interaction) => {
      this.client.executeInteraction(interaction)
    })

    await importx(dirname(import.meta.url) + '/{events,commands}/**/*.{ts,js}')
    if (!process.env.TOKEN) {
      throw Error('Could not find TOKEN in your environment')
    }
    Bot.logger.info('Connecting...')

    await this.client.login(process.env.TOKEN)
  }
}

Bot.start()
