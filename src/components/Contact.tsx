import { useScrollReveal } from '../hooks/useScrollReveal'
import { useSocialProfile } from '../hooks/useSocialProfile'
import { DISCORD_PROFILE_URL, type DiscordProfile, type DiscordStatus } from '../utils/discord'
import { DiscordAvatar } from './DiscordAvatar'
import { PixelIcon, type PixelIconName } from './PixelIcon'

interface SocialLink {
  key: string
  label: string
  handle?: string
  value: string
  href: string
  icon: PixelIconName
}

const SOCIAL_LINKS: SocialLink[] = [
  { key: 'github', label: 'GitHub', handle: 'developer51709', value: '@developer51709', href: 'https://github.com/developer51709', icon: 'github' },
  { key: 'x', label: 'X', handle: 'sorenthedev', value: '@sorenthedev', href: 'https://x.com/sorenthedev', icon: 'x' },
  { key: 'youtube', label: 'YouTube', handle: 'sorenthedev', value: '@sorenthedev', href: 'https://youtube.com/@sorenthedev', icon: 'youtube' },
  { key: 'twitch', label: 'Twitch', handle: 'sorenthedev', value: 'sorenthedev', href: 'https://twitch.tv/sorenthedev', icon: 'twitch' },
  { key: 'tiktok', label: 'TikTok', handle: 'sorenthedev', value: '@sorenthedev', href: 'https://tiktok.com/@sorenthedev', icon: 'tiktok' },
  { key: 'pinterest', label: 'Pinterest', handle: 'sorenthedev', value: '@sorenthedev', href: 'https://pinterest.com/sorenthedev', icon: 'pinterest' },
  { key: 'bluesky', label: 'Bluesky', handle: 'sorenthedev.bsky.social', value: 'sorenthedev.bsky.social', href: 'https://bsky.app/profile/sorenthedev.bsky.social', icon: 'bluesky' },
  { key: 'spotify', label: 'Spotify', handle: '31kc6tv66sgkold3ojvlnyejkbn4', value: 'Soren', href: 'https://open.spotify.com/user/31kc6tv66sgkold3ojvlnyejkbn4', icon: 'music' },
  { key: 'dev', label: 'Dev.to', handle: 'developer51709', value: '@developer51709', href: 'https://dev.to/developer51709', icon: 'code' },
  { key: 'stackoverflow', label: 'Stack Overflow', handle: '32959452', value: '@Soren', href: 'https://stackoverflow.com/users/32959452/soren', icon: 'comment' },
  { key: 'threads', label: 'Threads', value: '@sorenthedev', href: 'https://threads.net/@sorenthedev', icon: 'threads' },
  { key: 'phone', label: 'Phone', value: '+1 (762) 435-4135', href: 'tel:+17624354135', icon: 'phone' },
  { key: 'email', label: 'Email', value: 'developer51709@proton.me', href: 'mailto:developer51709@proton.me', icon: 'envelope' },
]

const STATUS_LABELS: Record<DiscordStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
}

export function Contact({ discord }: { discord: DiscordProfile | null }) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <div
      ref={ref}
      className="content scroll-reveal"
      style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(0,255,0,0.2)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <h2 className="section-title">Contact Me</h2>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
        Feel free to reach out — I'm always open to conversations about tech, projects, or collaboration.
      </p>
      <div className="contact-grid">
        <DiscordCard discord={discord} />
        {SOCIAL_LINKS.map((social) => (
          <SocialCard key={social.key} social={social} enabled={isVisible} />
        ))}
      </div>
    </div>
  )
}

function DiscordCard({ discord }: { discord: DiscordProfile | null }) {
  const status = discord
    ? discord.streaming
      ? 'Streaming'
      : STATUS_LABELS[discord.status]
    : null

  return (
    <a className="social-card" href={DISCORD_PROFILE_URL} target="_blank" rel="noopener noreferrer">
      <span className="social-card-avatar">
        {discord ? (
          <DiscordAvatar profile={discord} size={42} />
        ) : (
          <PixelIcon name="discord" size={26} style={{ color: '#00ff00' }} />
        )}
      </span>
      <span className="social-card-body">
        <span className="social-card-label">Discord</span>
        <span className="social-card-value">{discord ? `@${discord.username}` : 'view profile'}</span>
        {discord && status && (
          <span className={`social-card-stats discord-presence is-${discord.streaming ? 'streaming' : discord.status}`}>
            {status}
          </span>
        )}
      </span>
    </a>
  )
}

function SocialCard({ social, enabled }: { social: SocialLink; enabled: boolean }) {
  const { profile } = useSocialProfile(social.key, social.handle ?? '', enabled && Boolean(social.handle))
  const stats = profile?.stats ?? []

  return (
    <a className="social-card" href={profile?.profileUrl ?? social.href} target="_blank" rel="noopener noreferrer">
      <span className="social-card-icon">
        <PixelIcon name={social.icon} size={26} style={{ color: '#00ff00' }} />
      </span>
      <span className="social-card-body">
        <span className="social-card-label">{social.label}</span>
        <span className="social-card-value">{profile?.handle ?? social.value}</span>
        {stats.length > 0 && (
          <span className="social-card-stats">
            {stats
              .slice(0, 3)
              .map((stat) => `${stat.display ?? stat.value.toLocaleString()} ${stat.label.toLowerCase()}`)
              .join(' · ')}
          </span>
        )}
      </span>
    </a>
  )
}
