import {Sequelize} from 'sequelize'
import {Logger} from 'winston'

export abstract class BaseDAO {
  public sequelize: Sequelize
  constructor(logger: Logger) {
    const {DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME} = process.env

    this.sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
      logging: false,
    })

    this.verifyConnection(logger)
  }

  private async verifyConnection(logger: Logger) {
    try {
      await this.sequelize.authenticate()
      logger.info('Database connection has been established successfully.')
    } catch (error) {
      logger.error('Unable to connect to the database:', error)
    }
  }
}
