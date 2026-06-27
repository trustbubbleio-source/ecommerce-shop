import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from './button.js';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honours an explicit type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="outline" size="lg">
        Outline
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-border');
    expect(btn.className).toContain('h-12');
  });

  it('renders as a child element via asChild (no type attribute)', () => {
    render(
      <Button asChild>
        <a href="/shop">Shop</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Shop' });
    expect(link).toHaveAttribute('href', '/shop');
    expect(link).not.toHaveAttribute('type');
  });

  it('exposes buttonVariants helper', () => {
    expect(buttonVariants({ variant: 'primary' })).toContain('bg-primary');
    expect(buttonVariants({ block: true })).toContain('w-full');
  });
});
