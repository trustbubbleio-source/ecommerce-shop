import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type BlogPost, formatBlogDate } from '../../config/blog';

export function BlogPostCard({ post }: { post: BlogPost }) {
  const Icon = post.icon;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group border-border bg-card/50 hover:border-primary/30 flex flex-col gap-4 rounded-2xl border p-6 transition-colors"
    >
      <span className="bg-primary/15 text-primary grid size-11 place-items-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-lg font-bold leading-snug">{post.title}</h3>
        <p className="text-muted-foreground text-sm">{post.excerpt}</p>
      </div>
      <div className="text-muted-foreground mt-auto flex items-center justify-between gap-3 text-xs">
        <span>
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time> · {post.readMinutes} min read
        </span>
        <ArrowRight
          className="text-primary size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
