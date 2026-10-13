import { Button } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/page-header';
import { SITE } from '../../config/site';

export function GradingSubmissionPage() {
  return (
    <div className="container py-10">
      <PageHeader
        title="Grading Submission"
        description="Send your cards through us for professional grading. Details on partners, pricing and turnaround are coming soon — reach out if you want to get on the list."
      />
      <Button asChild>
        <a href={`mailto:${SITE.email.support}?subject=Grading%20submission`}>Ask about grading</a>
      </Button>
      <p className="text-muted-foreground mt-6 text-sm">
        Looking for graded stock instead?{' '}
        <Link to="/shop?category=graded-slab" className="text-foreground font-medium underline-offset-4 hover:underline">
          Browse graded slabs
        </Link>
        .
      </p>
    </div>
  );
}
