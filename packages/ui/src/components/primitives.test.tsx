import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './alert.js';
import { Badge } from './badge.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card.js';
import { Separator } from './separator.js';
import { Skeleton } from './skeleton.js';
import { Spinner } from './spinner.js';

describe('Badge', () => {
  it('renders with the default and a custom variant', () => {
    const { rerender } = render(<Badge>New</Badge>);
    expect(screen.getByText('New').className).toContain('bg-primary');
    rerender(<Badge variant="success">Sale</Badge>);
    expect(screen.getByText('Sale').className).toContain('text-success');
  });
});

describe('Card', () => {
  it('composes header, content and footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

describe('Alert', () => {
  it('renders with an icon and role=alert', () => {
    render(
      <Alert variant="destructive" icon={<svg data-testid="icon" />}>
        Something failed
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

describe('Separator', () => {
  it('reflects orientation', () => {
    const { rerender } = render(<Separator />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
    rerender(<Separator orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

describe('Skeleton', () => {
  it('renders an aria-hidden placeholder', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Spinner', () => {
  it('exposes an accessible status label', () => {
    render(<Spinner label="Saving" />);
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();
  });
});
