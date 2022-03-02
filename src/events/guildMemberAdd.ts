import {Invite, Vanity, MessageEmbed, TextChannel} from 'discord.js';
import {ArgsOf, Client, Guard} from 'discordx';
import {Discord, On} from 'discordx';
import {inject, injectable} from 'tsyringe';
import {Logger} from 'winston';
import config from '../config';
import { InvitesDAO } from '../DAO/invitesDAO';
import {Beans} from '../DI/Beans';
import {EventErrorHandler} from '../guards/eventError';

@Discord()
@injectable()
export class GuildMemberAdd {
  constructor(
    @inject(Beans.Logger) private logger: Logger,
    @inject(Client) private client: Client,
    @inject(Beans.GuildInvites)
    private guildInvites: Map<string, Invite | Vanity>,
    @inject(InvitesDAO) private invitesDAO: InvitesDAO
  ) {}

  private mainEmbed(description: string): MessageEmbed {
    return new MessageEmbed()
      .setFooter({
        text: this.client.user!!.username,
        iconURL: this.client.user!!.displayAvatarURL({dynamic: true}),
      })
      .setTimestamp()
      .setColor(config.colors.main as [number, number, number])
      .setDescription(description);
  }

  @Guard(EventErrorHandler)
  @On('guildMemberAdd')
  async guildMemberAdd([member]: ArgsOf<'guildMemberAdd'>): Promise<unknown> {
    let guild = member.guild;
    if (member.partial) member = await member.fetch();
    if (member.user.bot) {
      if (config.welcomeMessage) {
        const channel = this.client.channels.cache.get(config.welcomeChannel) as TextChannel;
        this.logger.info(`${member.displayName} joined ${member.guild.name} using OAuth flow.`);
        return channel.send({
          embeds: [this.mainEmbed(`${member.toString()} joined the server using OAuth flow.`)],
        });
      }
    }
    const cachedInvites = this.guildInvites.get(member.guild.id) as any;
    const newInvites = (await guild.invites.fetch({cache: false})) as any;
    if (member.guild.vanityURLCode) {
      newInvites.set(member.guild.vanityURLCode, await member.guild.fetchVanityData());
    }
    this.guildInvites.set(member.guild.id, newInvites);

    let usedInvite;
    for (let [key, value] of newInvites) {
      const oldInvite = cachedInvites.get(key);
      if (value.uses > oldInvite.uses) {
        usedInvite = value;
      }
    }

    if (!usedInvite) {
      this.logger.info(`${member.displayName} joined ${member.guild.name}. (Invited by: unknown)`);
      if (config.welcomeMessage) {
        const channel = this.client.channels.cache.get(config.welcomeChannel) as TextChannel;
        channel.send({
          embeds: [
            this.mainEmbed(
              `${member.toString()} has joined the server! #${
                member.guild.memberCount
              }\nPlease give them a warm welcome!\n(Could not figure out who invited them. Perhaps a temporary invite?)`,
            ),
          ],
        });
      }
      return;
    }

    if (usedInvite.code === member.guild.vanityURLCode) {
      this.logger.info(`${member.displayName} joined ${member.guild.name}. (Invited by: vanity)`);
      if (config.welcomeMessage) {
        const channel = this.client.channels.cache.get(config.welcomeChannel) as TextChannel;
        channel.send({
          embeds: [
            this.mainEmbed(
              `${member.toString()} has joined the server! #${
                member.guild.memberCount
              }\nPlease give them a warm welcome!`,
            ).setFooter({
              text: 'Joined with vanity code',
            }),
          ],
        });
      }
      await this.invitesDAO.findById(member.id, member.guild.id, 'VANITY')
      return;
    }
    const foc = await this.invitesDAO.findById(usedInvite.inviter.id, member.guild.id)
    await this.invitesDAO.findById(member.id, member.guild.id, usedInvite.inviter.id)

    await foc[0].increment('invites');

    this.logger.info(
      `${member.displayName} joined ${member.guild.name}. (Invited by: ${usedInvite.inviter.username}#${usedInvite.inviter.discriminator})`,
    );
    if (config.welcomeMessage) {
      const channel = this.client.channels.cache.get(config.welcomeChannel) as TextChannel;
      if (channel == null) return;
      channel.send({
        embeds: [
          this.mainEmbed(
            `${member.toString()} has joined the server! #${
              member.guild.memberCount
            }\nPlease give them a warm welcome!`,
          ).setFooter({
            text: `Invited by ${usedInvite.inviter.tag}`,
            iconURL: usedInvite.inviter.displayAvatarURL({dynamic: true}),
          }),
        ],
      });
    }
  }
}
