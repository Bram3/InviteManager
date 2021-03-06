import {CommandInteraction, GuildMember, MessageEmbed, User} from 'discord.js'
import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from 'discordx'
import {inject, injectable} from 'tsyringe'
import config from '../config'
import {CommandErrorHandler} from '../guards/commandError'
import {InvitesDAO} from '../DAO/invitesDAO'

@Discord()
@injectable()
@SlashGroup({
  name: 'invites',
  description: 'Lets you add, remove, reset, or see invites.',
})
@SlashGroup('invites')
@Guard(CommandErrorHandler)
export class Invites {
  constructor(
    @inject(Client) private client: Client,
    @inject(InvitesDAO) private invitesDAO: InvitesDAO,
  ) {}

  private mainEmbed(description: string): MessageEmbed {
    return new MessageEmbed()
      .setFooter({
        text: this.client.user!!.username,
        iconURL: this.client.user!!.displayAvatarURL({dynamic: true}),
      })
      .setTimestamp()
      .setColor(config.colors.main as [number, number, number])
      .setDescription(description)
  }

  private errorEmbed(description: string): MessageEmbed {
    return new MessageEmbed()
      .setFooter({
        text: this.client.user!!.username,
        iconURL: this.client.user!!.displayAvatarURL({dynamic: true}),
      })
      .setTimestamp()
      .setColor(config.colors.error as [number, number, number])
      .setDescription(description)
  }

  private getInteractionCaller(interaction: CommandInteraction): GuildMember | null {
    const {member} = interaction
    if (member == null) {
      throw new Error('Unable to extract member')
    }
    if (member instanceof GuildMember) {
      return member
    }
    return null
  }

  private async hasPermission(interaction: CommandInteraction): Promise<boolean> {
    const member = this.getInteractionCaller(interaction)
    if (member == null) return false
    if (!member.roles.cache.some(role => role.id == config.manageInvitesRoleId)) return false
    return true
  }

  @Slash('show', {
    description: 'Shows you the amount of invites someone has.',
  })
  @SlashGroup('invites')
  async show(
    @SlashOption('member', {
      type: 'USER',
      description: 'The member to see the invites of. If none is provided, shows your invites.',
      required: false,
    })
    member: GuildMember | User,
    interaction: CommandInteraction,
  ): Promise<void> {
    if (member == undefined) {
      const newMember = await interaction.guild?.members.fetch(interaction.member!.user.id)
      if (newMember != undefined) {
        member = newMember
      }
    }
    const foc = await this.invitesDAO.findById(member.id, interaction.guild!.id)
    interaction.reply({
      embeds: [this.mainEmbed(`${member.toString()} has **${foc[0].invites ? foc[0].invites : '0'}** invites!`)],
    })
  }

  @Slash('add', {description: 'Add invites to a member.'})
  async add(
    @SlashOption('member', {
      type: 'USER',
      description: 'The member to add invites to.',
    })
    member: GuildMember | User,
    @SlashOption('amount', {
      description: 'The amount of invites to add.',
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    if (!this.hasPermission(interaction)) {
      return interaction.reply({
        embeds: [this.errorEmbed("You don't have permission to use this command!")],
      })
    }

    const foc = await this.invitesDAO.findById(member.id, interaction.guild!.id)
    await foc[0].increment('invites', {by: amount})
    return interaction.reply({
      embeds: [
        this.mainEmbed(`Added ${amount} invites to ${member.toString()}! They now have **${foc[0].invites}** invites!`),
      ],
    })
  }

  @Slash('remove', {description: 'Remove invites from a member.'})
  async remove(
    @SlashOption('member', {
      type: 'USER',
      description: 'The member to remove invites from.',
    })
    member: GuildMember | User,
    @SlashOption('amount', {
      description: 'The amount of invites to remove.',
    })
    amount: number,
    interaction: CommandInteraction,
  ) {
    if (!this.hasPermission(interaction)) {
      return interaction.reply({
        embeds: [this.errorEmbed("You don't have permission to use this command!")],
      })
    }

    const foc = await this.invitesDAO.findById(member.id, interaction.guild!.id)
    if (foc[0].invites - amount < 0) {
      return interaction.reply({
        embeds: [this.errorEmbed('You cannot make someone have negative invites!')],
      })
    }
    await foc[0].decrement('invites', {by: amount})

    return interaction.reply({
      embeds: [
        this.mainEmbed(`Removed ${amount} invites from ${member.toString()}! They now have **${foc[0].invites}** invites!`),
      ],
    })
  }

  @Slash('reset', {
    description: 'Remove all invites from the mentioned member.',
  })
  @SlashGroup('invites')
  async reset(
    @SlashOption('member', {
      type: 'USER',
      description: 'The member to reset the invites of.',
      required: true,
    })
    member: GuildMember | User,
    interaction: CommandInteraction,
  ) {
    if (!this.hasPermission(interaction)) {
      return interaction.reply({
        embeds: [this.errorEmbed("You don't have permission to use this command!")],
      })
    }

    const foc = await this.invitesDAO.findById(member.id, interaction.guild!.id)

    if (!foc[0].invites)
      return interaction.reply({
        embeds: [this.mainEmbed(`Successfully removed all invites from ${member.toString()}!`)],
      })
    foc[0].decrement('invites', {by: foc[0].invites})

    return interaction.reply({
      embeds: [this.mainEmbed(`Successfully removed all invites from ${member.toString()}!`)],
    })
  }

  @Slash('leaderboard', {
    description: 'Sends a list of the top ten inviters.',
  })
  @SlashGroup('invites')
  async leaderboard(interaction: CommandInteraction) {
    const all = await this.invitesDAO.findTopTen(interaction.guild!.id)

    let LB: any[] = []
    let i = 0
    await Promise.all(
      all.map(async entry => {
        if (!entry.invites) return
        let user = await this.client.users.fetch(entry.user_id)
        i++
        LB.push(`${i}. **${user.username}**#${user.discriminator} - ${entry.invites}`)
      }),
    )

    let embed
    if (LB.length === 0) {
      embed = this.mainEmbed('No one in this server has any invites!')
    } else {
      embed = this.mainEmbed(`Here are the top ${LB.length} inviters!\n${LB.join('\n')}`)
    }
    return interaction.reply({embeds: [embed]})
  }
}
