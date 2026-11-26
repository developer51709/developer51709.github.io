export interface SocialProfileStat {
  label: string
  value: number
  /** Pre-formatted label for counts the source abbreviates ("21.4M"). */
  display?: string
}

export interface SocialProfile {
  platform: string
  displayName: string
  handle: string
  avatar: string | null
  bio: string
  profileUrl: string | null
  stats: SocialProfileStat[]
}

/**
 * Platforms whose public APIs allow browser requests, so the call goes out from
 * the visitor's own IP instead of a shared server egress pool.
 */
const CLIENT_PLATFORMS = new Set(['github', 'bluesky', 'stackoverflow', 'dev'])

/**
 * Platforms that need credentials or block cross-origin requests. These are
 * served by the existing portfolio API, which accepts cross-origin reads.
 */
const SERVER_PLATFORMS = new Set(['youtube', 'x', 'tiktok', 'twitch', 'pinterest', 'spotify'])

/**
 * The old portfolio's API already aggregates the platforms that block browser
 * requests. It is CORS-enabled, so the static GitHub Pages build can call it
 * directly without a same-origin server.
 */
const SERVER_API = 'https://sorenthedev.indevs.in/api/social-profile'

const asNumber = (value: unknown): number => Number(value ?? 0)

const clean = (value: unknown): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)

async function fetchGitHub(handle: string): Promise<SocialProfile> {
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) throw new Error(`GitHub profile request failed (${response.status})`)

  const user = (await response.json()) as Record<string, unknown>
  return {
    platform: 'github',
    displayName: String(user.name || user.login),
    handle: `@${user.login}`,
    avatar: (user.avatar_url as string) ?? null,
    bio: clean(user.bio),
    profileUrl: (user.html_url as string) ?? null,
    stats: [
      { label: 'Followers', value: asNumber(user.followers) },
      { label: 'Following', value: asNumber(user.following) },
      { label: 'Repos', value: asNumber(user.public_repos) },
    ],
  }
}

async function fetchBluesky(handle: string): Promise<SocialProfile> {
  const actor = handle.replace(/^@/, '')
  const response = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
  )
  if (!response.ok) throw new Error(`Bluesky profile request failed (${response.status})`)

  const profile = (await response.json()) as Record<string, unknown>
  return {
    platform: 'bluesky',
    displayName: String(profile.displayName || profile.handle),
    handle: `@${profile.handle}`,
    avatar: (profile.avatar as string) ?? null,
    bio: clean(profile.description),
    profileUrl: `https://bsky.app/profile/${profile.handle}`,
    stats: [
      { label: 'Followers', value: asNumber(profile.followersCount) },
      { label: 'Following', value: asNumber(profile.followsCount) },
      { label: 'Posts', value: asNumber(profile.postsCount) },
    ],
  }
}

async function fetchStackOverflow(handle: string): Promise<SocialProfile> {
  const userId = String(handle).split('/')[0]
  if (!/^\d+$/.test(userId)) throw new Error('Stack Overflow needs a numeric user id')

  const response = await fetch(`https://api.stackexchange.com/2.3/users/${userId}?site=stackoverflow`)
  if (!response.ok) throw new Error(`Stack Overflow profile request failed (${response.status})`)

  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> }
  const user = payload.items?.[0]
  if (!user) throw new Error('Stack Overflow user not found')

  const badges = (user.badge_counts ?? {}) as Record<string, unknown>
  return {
    platform: 'stackoverflow',
    displayName: String(user.display_name),
    handle: `@${user.display_name}`,
    avatar: (user.profile_image as string) ?? null,
    bio: `${asNumber(badges.gold)} gold · ${asNumber(badges.silver)} silver · ${asNumber(badges.bronze)} bronze badges`,
    profileUrl: (user.link as string) ?? null,
    stats: [
      { label: 'Reputation', value: asNumber(user.reputation) },
      { label: 'Answers', value: asNumber(user.answer_count) },
      { label: 'Questions', value: asNumber(user.question_count) },
    ],
  }
}

async function fetchDevTo(handle: string): Promise<SocialProfile> {
  const username = handle.replace(/^@/, '')
  const [userResponse, articlesResponse] = await Promise.all([
    fetch(`https://dev.to/api/users/by_username?url=${encodeURIComponent(username)}`),
    fetch(`https://dev.to/api/articles?username=${encodeURIComponent(username)}&per_page=1000`),
  ])
  if (!userResponse.ok) throw new Error(`Dev.to profile request failed (${userResponse.status})`)

  const user = (await userResponse.json()) as Record<string, unknown>
  const articles = articlesResponse.ok
    ? ((await articlesResponse.json()) as Array<Record<string, unknown>>)
    : []
  const total = (key: string) =>
    articles.reduce((sum, article) => sum + asNumber(article[key]), 0)

  return {
    platform: 'dev',
    displayName: String(user.name || user.username),
    handle: `@${user.username}`,
    avatar: (user.profile_image as string) ?? null,
    bio: clean(user.summary),
    profileUrl: `https://dev.to/${user.username}`,
    stats: [
      { label: 'Posts', value: articles.length },
      { label: 'Reactions', value: total('public_reactions_count') },
      { label: 'Comments', value: total('comments_count') },
    ],
  }
}

async function fetchFromServer(platform: string, handle: string): Promise<SocialProfile> {
  const query = `?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handle)}`
  const response = await fetch(`${SERVER_API}${query}`)
  if (!response.ok) throw new Error(`${platform} profile request failed (${response.status})`)
  return (await response.json()) as SocialProfile
}

export function isSocialProfilePlatform(platform: string): boolean {
  return CLIENT_PLATFORMS.has(platform) || SERVER_PLATFORMS.has(platform)
}

export async function fetchSocialProfile(
  platform: string,
  handle: string,
): Promise<SocialProfile | null> {
  if (platform === 'github') return fetchGitHub(handle)
  if (platform === 'bluesky') return fetchBluesky(handle)
  if (platform === 'stackoverflow') return fetchStackOverflow(handle)
  if (platform === 'dev') return fetchDevTo(handle)
  if (SERVER_PLATFORMS.has(platform)) return fetchFromServer(platform, handle)
  return null
}
