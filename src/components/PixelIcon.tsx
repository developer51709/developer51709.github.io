import {
  BoltSolid,
  RobotSolid,
  CommentDotsSolid,
  EnvelopeSolid,
  Github,
  ExternalLinkSolid,
  Youtube,
  Discord,
  Tiktok,
  Twitch,
  Bluesky,
  Threads,
  Instagram,
  Linkedin,
  X,
  GlobeAmericas,
  MusicSolid,
  Pinterest,
  CodeSolid,
  PhoneRingingHighSolid,
} from '@2hoch1/pixel-icon-library-react'

const ICON_MAP = {
  'bolt': BoltSolid,
  'robot': RobotSolid,
  'comment': CommentDotsSolid,
  'envelope': EnvelopeSolid,
  'github': Github,
  'external-link': ExternalLinkSolid,
  'youtube': Youtube,
  'discord': Discord,
  'tiktok': Tiktok,
  'twitch': Twitch,
  'bluesky': Bluesky,
  'threads': Threads,
  'instagram': Instagram,
  'linkedin': Linkedin,
  'x': X,
  'globe': GlobeAmericas,
  'music': MusicSolid,
  'pinterest': Pinterest,
  'code': CodeSolid,
  'phone': PhoneRingingHighSolid,
} as const

export type PixelIconName = keyof typeof ICON_MAP

interface PixelIconProps {
  name: PixelIconName
  size?: number | string
  className?: string
  style?: React.CSSProperties
}

export function PixelIcon({ name, size = 24, className, style }: PixelIconProps) {
  const Icon = ICON_MAP[name]
  return <Icon width={size} height={size} className={className} style={style} />
}
