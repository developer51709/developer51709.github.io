import type { CSSProperties } from 'react'
import type { DiscordProfile, DiscordStatus } from '../utils/discord'

const STATUS_LABELS: Record<DiscordStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
}

/** Discord only draws the phone-shaped badge for these statuses. */
const MOBILE_STATUSES = new Set<DiscordStatus>(['online', 'idle', 'dnd'])

interface DiscordAvatarProps {
  profile: DiscordProfile
  size?: number
}

/**
 * Avatar, decoration and presence badge for the Discord social card.
 *
 * Ported from the main portfolio: the status icon sits in a notch masked out of
 * the avatar and its decoration (so the card surface shows through) rather than
 * being painted on top of a ring. `size` drives the notch proportions through
 * the same custom properties the original stylesheet uses.
 */
export function DiscordAvatar({ profile, size = 42 }: DiscordAvatarProps) {
  const shown = profile.streaming ? 'streaming' : profile.status
  const mobileIcon = !profile.streaming && profile.mobile && MOBILE_STATUSES.has(profile.status)
  const label = profile.streaming ? 'Streaming' : STATUS_LABELS[profile.status]

  const style = {
    '--status-avatar-size': `${size}px`,
    '--status-icon-size': `${Math.max(10, Math.round(size * 0.32))}px`,
  } as CSSProperties

  return (
    <span
      className={`discord-status-avatar${mobileIcon ? ' is-mobile' : ''}`}
      style={style}
    >
      <span className="discord-status-avatar-art">
        <span className="discord-status-avatar-art-inner">
          <img
            className="presence-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} avatar`}
            loading="lazy"
          />
          {profile.decorationUrl && (
            <img
              className="presence-avatar-decoration"
              src={profile.decorationUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          )}
        </span>
      </span>
      <img
        className="discord-status-icon"
        src={`${import.meta.env.BASE_URL}discord-status/status_${shown}${mobileIcon ? '_mobile' : ''}.png`}
        alt={label}
        title={label}
      />
    </span>
  )
}
