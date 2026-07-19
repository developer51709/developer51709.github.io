export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface LanyardSpotify {
  track_id: string;
  timestamps: {
    start: number;
    end: number;
  };
  album: string;
  album_art_url: string;
  artist: string;
  song: string;
}

export interface LanyardActivity {
  application_id?: string;
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  created_at?: number;
  details?: string;
  flags?: number;
  id: string;
  name: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  /**
   * Activity types:
   * 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = Custom, 5 = Competing
   */
  type: number;
  url?: string;
}

export interface LanyardDiscordUser {
  avatar: string;
  discriminator: string;
  display_name: string;
  global_name: string;
  id: string;
  public_flags: number;
  username: string;
}

export interface LanyardData {
  active_on_discord_desktop: boolean;
  active_on_discord_embedded: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_vr: boolean;
  active_on_discord_web: boolean;
  activities: LanyardActivity[];
  discord_status: DiscordStatus;
  discord_user: LanyardDiscordUser;
  kv: Record<string, string>;
  listening_to_spotify: boolean;
  spotify: LanyardSpotify | null;
}
