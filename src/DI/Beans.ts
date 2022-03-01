export namespace Beans {
  export const Logger = Symbol('Logger')
  export const Invites = Symbol('ModelStatic<any>')
  export const GuildInvites = Symbol('Map<string, Invite | Vanity>')
}
