import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ImageLightbox } from './image-lightbox.js';

const IMAGES = ['https://cdn.test/a.png', 'https://cdn.test/b.png', 'https://cdn.test/c.png'];

/** Controlled harness — the lightbox owns no index/open state of its own. */
function Harness({ images = IMAGES }: { images?: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <ImageLightbox
        images={images}
        open={open}
        onOpenChange={setOpen}
        index={index}
        onIndexChange={setIndex}
        alt="Charizard"
      />
    </>
  );
}

describe('ImageLightbox', () => {
  it('opens from a trigger and shows the first image', async () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveAttribute('src', IMAGES[0]);
  });

  it('navigates with the next control', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await userEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveAttribute('src', IMAGES[1]);
  });

  it('wraps to the last image when going back from the first', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByRole('img', { name: 'Charizard' })).toHaveAttribute('src', IMAGES[2]);
  });

  it('closes via the close button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('omits navigation controls for a single image', async () => {
    render(<Harness images={[IMAGES[0]]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
  });
});
