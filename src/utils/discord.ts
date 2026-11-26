export const DISCORD_USER_ID = '1052690741874401360'

export const DISCORD_PROFILE_URL = `https://discord.com/users/${DISCORD_USER_ID}`

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline'

export interface DiscordProfile {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  decorationUrl: string | null
  status: DiscordStatus
  mobile: boolean
  streaming: boolean
}

interface LanyardUser {
  id?: string
  username?: string
  global_name?: string | null
  display_name?: string | null
  avatar?: string | null
  discriminator?: string
  avatar_decoration_data?: { asset?: string } | null
}

interface LanyardActivity {
  type?: number
}

interface LanyardResponse {
  success: boolean
  data?: {
    discord_user?: LanyardUser
    discord_status?: string
    active_on_discord_mobile?: boolean
    activities?: LanyardActivity[]
  }
}

const STATUSES: DiscordStatus[] = ['online', 'idle', 'dnd', 'offline']

export async function fetchDiscordProfile(): Promise<DiscordProfile | null> {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
    if (!response.ok) return null

    const payload = (await response.json()) as LanyardResponse
    const data = payload.data
    const user = payload.success ? data?.discord_user : undefined
    if (!user?.id || !user.username) return null

    const discriminator = user.discriminator ?? '0'
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(discriminator) % 5}.png`

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.global_name || user.username,
      avatarUrl,
      decorationUrl: user.avatar_decoration_data?.asset
        ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128`
        : null,
      status: STATUSES.find((status) => status === data?.discord_status) ?? 'offline',
      mobile: Boolean(data?.active_on_discord_mobile),
      streaming: (data?.activities ?? []).some((activity) => activity.type === 1),
    }
  } catch {
    return null
  }
}
