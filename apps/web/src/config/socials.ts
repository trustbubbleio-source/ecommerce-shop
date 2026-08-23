import { SITE } from './site';

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'discord';

export interface SocialChannel {
  id: SocialPlatform;
  name: string;
  handle: string;
  href: string;
  blurb: string;
  cta: string;
}

export interface ContestGoal {
  platform: Extract<SocialPlatform, 'instagram' | 'tiktok'>;
  label: string;
  current: number;
  goal: number;
}

export interface Contest {
  id: string;
  status: 'active' | 'upcoming' | 'ended';
  badge: string;
  title: string;
  summary: string;
  body: string[];
  goals?: ContestGoal[];
  reward: string;
  howToJoin: string[];
}

/** Update `current` as you grow — progress bars read from here. */
export const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: SITE.socialHandles.instagram,
    href: SITE.social.instagram,
    blurb: 'Drops, pulls, store vibes and giveaway announcements.',
    cta: 'Follow on Instagram',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: SITE.socialHandles.tiktok,
    href: SITE.social.tiktok,
    blurb: 'Rips, chase moments and behind-the-counter energy.',
    cta: 'Follow on TikTok',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: SITE.socialHandles.facebook,
    href: SITE.social.facebook,
    blurb: 'Store updates, events and community posts for collectors nearby.',
    cta: 'Follow on Facebook',
  },
  {
    id: 'discord',
    name: 'Discord',
    handle: SITE.socialHandles.discord,
    href: SITE.social.discord,
    blurb: 'Talk sealed product, trades and local Båstad hangouts.',
    cta: 'Join Discord',
  },
];

export const CONTESTS: Contest[] = [
  {
    id: '5k-challenge',
    status: 'active',
    badge: 'Live challenge',
    title: '5K Challenge',
    summary:
      'Help One More Rip hit 5,000 followers on Instagram and TikTok — and unlock a community celebration drop.',
    body: [
      'We’re building in public. Every follow, share and tag pushes the meter.',
      'When both Instagram and TikTok hit 5K, we throw a thank-you moment for the community — think sealed prizes, shoutouts and shop love.',
    ],
    goals: [
      {
        platform: 'instagram',
        label: 'Instagram',
        current: 3546,
        goal: 5000,
      },
      {
        platform: 'tiktok',
        label: 'TikTok',
        current: 3479,
        goal: 5000,
      },
    ],
    reward: 'Community thank-you drop when both platforms hit 5,000 followers.',
    howToJoin: [
      `Follow ${SITE.socialHandles.instagram} on Instagram`,
      `Follow ${SITE.socialHandles.tiktok} on TikTok`,
      'Share a story or post tagging us — tell collectors where to find the shop',
      'Keep an eye on Socials for progress updates and the unlock announcement',
    ],
  },
];

export function contestProgressPercent(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}
