import 'reflect-metadata'
import { addColors } from 'winston'
import { Client, DIService } from 'discordx'
import { Intents, Interaction } from 'discord.js'
import { importx, dirname } from '@discordx/importer'
import { config } from 'dotenv'
import { Logger, transports, format, createLogger } from 'winston'
import { Beans } from './DI/Beans'
import { DATE, INTEGER, NOW, Sequelize, STRING } from 'sequelize'
import { container } from 'tsyringe'
config()

export default class Bot {
  private static client: Client
  private static logger: Logger
  private static guildInvites = new Map()
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
        format.padLevels({ levels: logLevels }),
        format.timestamp(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}:${info.message}`
        )
      ),
      level: 'debug',
    })

    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env

    const sequelize = new Sequelize(
      `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
      {
        logging: false,
      }
    )

    try {
      await sequelize.authenticate()
      Bot.logger.info('Database connection has been established successfully.')
    } catch (error) {
      Bot.logger.error('Unable to connect to the database:', error)
    }

    const invites = sequelize.define('invites', {
      user_id: STRING,
      inviter_id: STRING,
      invites: INTEGER,
      guild_id: STRING,
      createdAt: {
        type: DATE,
        defaultValue: NOW,
      },
      updatedAt: {
        type: DATE,
        defaultValue: NOW,
      },
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    })
    invites.sync()

    this.client = new Client({
      botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
      ],
    })

    this.client.once('ready', async () => {
      await this.client.initApplicationCommands({
        guild: { log: false },
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

    DIService.container = container
    container.registerInstance(Beans.Logger, this.logger)
    container.registerInstance(Client, this.client)
    container.registerInstance(Beans.Invites, invites)
    container.registerInstance(Beans.GuildInvites, this.guildInvites)

    await this.client.login(process.env.TOKEN)
  }
}

Bot.start()
