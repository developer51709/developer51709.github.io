import { useEffect, useState } from 'react'
import {
  fetchSocialProfile,
  isSocialProfilePlatform,
  type SocialProfile,
} from '../utils/socialProfile'

const cache = new Map<string, Promise<SocialProfile | null>>()

function loadProfile(platform: string, handle: string): Promise<SocialProfile | null> {
  const key = `${platform}:${handle}`
  let pending = cache.get(key)

  if (!pending) {
    pending = fetchSocialProfile(platform, handle).catch(() => null)
    cache.set(key, pending)
  }

  return pending
}

/**
 * Loads one social profile (handle and counters) once the contact section is in
 * view. Results are cached per platform + handle, so revisits and re-renders do
 * not hit the APIs again.
 */
export function useSocialProfile(
  platform: string,
  handle: string,
  enabled: boolean,
): { profile: SocialProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<SocialProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !handle || !isSocialProfilePlatform(platform)) return

    let active = true
    setLoading(true)

    loadProfile(platform, handle).then((result) => {
      if (!active) return
      setProfile(result)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [platform, handle, enabled])

  return { profile, loading }
}
