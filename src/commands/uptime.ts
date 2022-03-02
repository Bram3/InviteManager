import {CommandInteraction, MessageEmbed} from 'discord.js'
import {Client, Discord, Guard, Slash} from 'discordx'
import {inject, injectable} from 'tsyringe'
import config from '../config'
import ms from 'ms'
import {CommandErrorHandler} from '../guards/commandError'

@Discord()
@injectable()
@Guard(CommandErrorHandler)
export class Uptime {
  constructor(@inject(Client) private client: Client) {}

  @Slash('uptime', {description: 'Sends the uptime of the bot.'})
  uptime(interaction: CommandInteraction): void {
    let embed = new MessageEmbed()
      .setColor(config.colors.main as [number, number, number])
      .setDescription(`The bot has been up for ${ms(this.client.uptime!!)}`)
      .setFooter({
        text: this.client.user!!.username,
        iconURL: this.client.user!!.displayAvatarURL(),
      })
      .setTimestamp()
    interaction.reply({embeds: [embed]})
  }
}
