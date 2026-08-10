import { Button } from '@akknerds/ui';
import { ArrowLeft, PackageX } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BlogPostCard } from '../components/blog/blog-post-card';
import { EmptyState } from '../components/common/empty-state';
import { SectionHeader } from '../components/common/section';
import { BLOG_POSTS, formatBlogDate, getBlogPost } from '../config/blog';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<PackageX />}
          title="Article not found"
          description="This article may have moved or been unpublished."
          action={
            <Button asChild>
              <Link to="/blog">Back to blog</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const Icon = post.icon;
  const more = BLOG_POSTS.filter((p) => p.slug !== post.slug);

  return (
    <div className="container max-w-3xl py-8">
      <Link
        to="/blog"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to blog
      </Link>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <span className="bg-primary/15 text-primary grid size-12 place-items-center rounded-xl">
            <Icon className="size-6" aria-hidden />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="text-muted-foreground text-sm">
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time> · {post.readMinutes} min
            read
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {post.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-foreground text-xl font-bold tracking-tight">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <section className="mt-16">
        <SectionHeader title="Keep reading" />
        <div className="grid gap-5 sm:grid-cols-2">
          {more.map((p) => (
            <BlogPostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
