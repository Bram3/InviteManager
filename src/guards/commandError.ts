import { CommandInteraction, MessageEmbed } from "discord.js";
import { GuardFunction } from "discordx";
import { container } from "tsyringe";
import { Logger } from "winston";
import config from "../config";
import { Beans } from "../DI/Beans";

export const CommandErrorHandler: GuardFunction<CommandInteraction> = async (
  interaction,
  client,
  next
) => {
  function errorEmbed(description: string): MessageEmbed {
    return new MessageEmbed()
      .setFooter({
        text: client.user!!.username,
        iconURL: client.user!!.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(config.colors.error as [number, number, number])
      .setDescription(description);
  }
  try {
    await next();
  } catch (err) {
    const logger: Logger = container.resolve(Beans.Logger);

    interaction.reply({
      embeds: [errorEmbed("There was an error executing this command.")],
    });
    logger.error(
      `There was an error executing ${interaction.commandName} in ${interaction.guild?.name}. ${err}`
    );
  }
};
