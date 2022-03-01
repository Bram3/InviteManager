import {ArgsOf, GuardFunction} from 'discordx';
import {container} from 'tsyringe';
import {Logger} from 'winston';
import {Beans} from '../DI/Beans';

export const EventErrorHandler: GuardFunction<
  ArgsOf<'guildMemberAdd' | 'guildMemberRemove' | 'inviteCreate' | 'inviteDelete' | 'ready'>
> = async (_, __, next) => {
  try {
    await next();
  } catch (err) {
    const logger: Logger = container.resolve(Beans.Logger);
    logger.error(`There was an error while handling a event. ${err}`);
  }
};
