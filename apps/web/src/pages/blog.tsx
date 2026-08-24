import { BlogPostCard } from '../components/blog/blog-post-card';
import { PageHeader } from '../components/common/page-header';
import { BLOG_POSTS } from '../config/blog';

export function BlogPage() {
  return (
    <div className="container py-8">
      <PageHeader
        title="Blog"
        description="Stories from behind the counter — who we are, how we pack, and why we do it."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
