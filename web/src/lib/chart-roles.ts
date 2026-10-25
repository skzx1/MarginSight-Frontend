/** Chart colour roles for sales channels. Colour follows the platform name, never the row position. */
export const CHANNEL_ROLES = ['shopee', 'lazada', 'tiktok', 'line', 'store', 'other'] as const;
export type ChannelRole = typeof CHANNEL_ROLES[number];

const ROLE_BY_NAME: Record<string, ChannelRole> = {
  shopee: 'shopee',
  lazada: 'lazada',
  tiktok: 'tiktok', 'tiktok shop': 'tiktok',
  line: 'line', 'line shop': 'line', 'line oa': 'line',
  'in-store': 'store', 'in store': 'store', instore: 'store', store: 'store', 'หน้าร้าน': 'store',
};

export function channelRole(platform: string | null | undefined): ChannelRole {
  const key = (platform ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return ROLE_BY_NAME[key] ?? 'other';
}

/** CSS class that sets both `stroke` and `background` to the channel's chart colour (globals.css). */
export const channelColorClass = (platform: string | null | undefined) => `channel-color-${channelRole(platform)}`;
