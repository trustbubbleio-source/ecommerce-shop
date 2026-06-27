import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Field } from './field.js';
import { Input } from './input.js';
import { Label } from './label.js';
import { Select } from './select.js';
import { Textarea } from './textarea.js';

describe('Input', () => {
  it('accepts typing', async () => {
    render(<Input placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email');
    await userEvent.type(input, 'hi@a.com');
    expect(input).toHaveValue('hi@a.com');
  });

  it('marks invalid state', () => {
    render(<Input invalid placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Textarea', () => {
  it('renders and marks invalid state', () => {
    render(<Textarea invalid placeholder="Message" />);
    expect(screen.getByPlaceholderText('Message')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Label', () => {
  it('associates with a control via htmlFor', () => {
    render(
      <>
        <Label htmlFor="x">My Field</Label>
        <input id="x" />
      </>,
    );
    expect(screen.getByText('My Field')).toHaveAttribute('for', 'x');
  });
});

describe('Field', () => {
  it('wires label, control and error message', () => {
    render(
      <Field label="Email" error="Required" required>
        {(props) => <Input {...props} placeholder="Email" />}
      </Field>,
    );
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Required');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('shows a hint when there is no error', () => {
    render(
      <Field label="Email" hint="We never share it">
        {(props) => <Input {...props} />}
      </Field>,
    );
    expect(screen.getByText('We never share it')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Select', () => {
  it('renders options and fires change', async () => {
    const onChange = vi.fn();
    render(
      <Select
        aria-label="Sort"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'b');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('combobox')).toHaveValue('b');
  });
});
