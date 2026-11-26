import { useEffect, useState } from 'react'
import { fetchDiscordProfile, type DiscordProfile } from '../utils/discord'

// Start the request while the app's modules are still loading, so the boot
// animation covers the network round trip instead of the main page.
const profileRequest = fetchDiscordProfile()

const LOADING_GUARD_MS = 6000

interface LanyardState {
  profile: DiscordProfile | null
  loading: boolean
}

export function useLanyard(): LanyardState {
  const [state, setState] = useState<LanyardState>({ profile: null, loading: true })

  useEffect(() => {
    let active = true

    profileRequest.then((profile) => {
      if (active) setState({ profile, loading: false })
    })

    // Never hold the page longer than this, even if the request stalls.
    const guard = setTimeout(() => {
      if (active) setState((prev) => (prev.loading ? { ...prev, loading: false } : prev))
    }, LOADING_GUARD_MS)

    return () => {
      active = false
      clearTimeout(guard)
    }
  }, [])

  return state
}
