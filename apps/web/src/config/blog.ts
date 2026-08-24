import type { LucideIcon } from 'lucide-react';
import { Heart, Package, ShieldCheck, Users } from 'lucide-react';

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date — machine-readable for <time>, formatted at the edge. */
  date: string;
  readMinutes: number;
  icon: LucideIcon;
  sections: BlogSection[];
}

/** Format a post's ISO date for display. Cheap, runs at render time only. */
export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Hardcoded blog content. We keep only a handful of evergreen articles, so
 * shipping them as static data (no API, no fetching, tree-shakeable) is both
 * simpler and faster than a CMS round-trip.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'who-are-we',
    title: 'Who are we?',
    excerpt:
      'Meet the small crew behind One More Rip — a couple, a handful of friends, and a shared obsession that started long before booster boxes had fancy ETBs.',
    date: '2026-08-20',
    readMinutes: 4,
    icon: Users,
    sections: [
      {
        heading: 'A couple, some friends, and a lot of cardboard',
        paragraphs: [
          'One More Rip is not a faceless warehouse with a logo slapped on the side. We are a couple who grew up chasing holos after school, plus a small circle of friends who somehow never grew out of it either. Between us we have binders from the Base Set era, modern chase cards we still get excited about, and more packing tape than anyone reasonably needs.',
          'We live and work out of Båstad, Sweden — and in October 2026 we open both the online shop and a physical store where collectors can hang out, rip packs, and talk way too long about pull rates.',
        ],
      },
      {
        heading: 'Hooked since we were kids',
        paragraphs: [
          'Pokémon found us early. Recess trades, lunchtime battles, the ritual of peeling open a pack and hoping for something shiny. One of us still remembers the exact Charizard that ruined every other card forever. Another still has the crumpled checklist from a set that never quite got finished — and somehow that unfinished binder is part of the charm.',
          'Growing up did not kill the hobby. It just changed the stakes: nicer sleeves, better storage, and the quiet understanding that “just one more rip” is never actually just one more rip.',
        ],
      },
      {
        heading: 'Why we started the shop',
        paragraphs: [
          'We got tired of ordering sealed product that arrived crushed, singles that looked nothing like the photos, and shops that treated collectors like a transaction instead of a community. So we built the shop we always wished existed — honest condition grades, careful packing, and people on the other end who actually know what a white border means.',
          'Our friends pitch in where it counts: sorting inventory, hunting good wholesale, testing packing methods until the cardboard stops complaining, and reminding us that the vibe matters as much as the stock list.',
        ],
      },
      {
        heading: 'What you can expect from us',
        paragraphs: [
          'When you order from One More Rip, you are buying from collectors who still get that little jolt when a box lands on the doorstep. We source sealed product the right way, inspect singles under proper light, and pack every order like it is headed to someone we will see at the shop next week — because often, we will.',
          'If you are ever in Båstad after we open, come say hi. Bring your binder stories. We will almost certainly have one that matches.',
        ],
      },
    ],
  },
  {
    slug: 'how-we-pack',
    title: 'How we are packing',
    excerpt:
      'Every order is packed by hand to arrive exactly the way it left us — protected, sealed, and collector-ready.',
    date: '2025-03-12',
    readMinutes: 3,
    icon: Package,
    sections: [
      {
        heading: 'Protection first, always',
        paragraphs: [
          'Cards and sealed product are fragile in different ways, so we pack them differently. Single cards go straight into a penny sleeve, then a rigid top-loader or semi-rigid holder, taped closed so nothing slides out in transit.',
          'Graded slabs get a snug foam or bubble wrap and are boxed so the case cannot flex or corner-ding. We never ship a slab in a plain envelope — it always travels in a rigid box.',
        ],
      },
      {
        heading: 'Sealed boxes travel in their own armour',
        paragraphs: [
          'Booster boxes and Elite Trainer Boxes ship in their original factory shrink, then inside a snug outer shipper with corner support so the edges stay crisp. Collectors care about the box as much as what is inside it, and so do we.',
          'We size the outer carton to the product, not the other way around. Less empty space means less movement, and less movement means fewer dents.',
        ],
      },
      {
        heading: 'A tidy unboxing',
        paragraphs: [
          'You should not need a knife and a lot of patience to reach your cards. We pack securely but sensibly, so opening your parcel is part of the fun — not a wrestling match. Every order also ships fully tracked.',
        ],
      },
    ],
  },
  {
    slug: 'quality-controls',
    title: 'Controls of quality',
    excerpt:
      'From sourcing to the final inspection before dispatch, here is how we make sure what you order is what you receive.',
    date: '2025-04-02',
    readMinutes: 4,
    icon: ShieldCheck,
    sections: [
      {
        heading: 'Sourced from authorised channels',
        paragraphs: [
          'Every sealed product we sell comes from authorised distributors and arrives factory-sealed. We never resell tampered or resealed product, and anything that does not meet that bar simply does not make it onto the shop.',
        ],
      },
      {
        heading: 'Every single is inspected and graded',
        paragraphs: [
          'Raw singles are checked by hand under good light before they are listed. We grade in-house as Mint, Near Mint, Lightly Played, or Moderately Played, and the condition you see on the product page is the condition you receive.',
          'When a card is not up to standard, we say so plainly in the listing rather than hiding it in the photos. No surprises when the parcel arrives.',
        ],
      },
      {
        heading: 'One last look before it ships',
        paragraphs: [
          'Right before packing, each order gets a final check against what you ordered — the correct card, set, number, and condition. It is a small step that catches the rare mistake before it ever leaves the building.',
          'And if something is ever not right, we make it right quickly. Reach out and our team replies within one business day.',
        ],
      },
    ],
  },
  {
    slug: 'why-we-love-pokemon',
    title: 'Why we love Pokémon',
    excerpt:
      'One More Rip started with a shoebox of cards and a lot of nostalgia. Here is why the hobby still means so much to us.',
    date: '2025-05-20',
    readMinutes: 3,
    icon: Heart,
    sections: [
      {
        heading: 'It started with a single pack',
        paragraphs: [
          'Most of us remember the exact card that hooked us — a first holo, a lucky pull, a trade at the lunch table. Pokémon has a way of turning a small moment into a lasting memory, and that feeling is the whole reason we do this.',
        ],
      },
      {
        heading: 'A hobby that grows with you',
        paragraphs: [
          'What starts as a childhood game becomes a lifelong hobby: chasing a set, completing a binder, learning the history behind each era of the TCG. There is always a new set to look forward to and an old one to appreciate.',
          'It is also wonderfully social. Collections spark conversations, trades build friendships, and every pull is better when there is someone to show it to.',
        ],
      },
      {
        heading: 'Why it shapes how we run the shop',
        paragraphs: [
          'Because we are collectors first, we treat your cards the way we treat our own. Careful packing, honest grading, and fair prices are not policies to us — they are just how we would want to be treated on the other side of the order.',
        ],
      },
    ],
  },
];

/** Look up a post by its slug. */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
