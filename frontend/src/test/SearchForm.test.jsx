import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from '../components/SearchForm';

describe('SearchForm', () => {
  let onSubmit;

  beforeEach(() => {
    onSubmit = vi.fn();
  });

  it('renders input, select, and submit button', () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('input accepts and reflects typed text', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Who is Dumbledore?');
    expect(input.value).toBe('Who is Dumbledore?');
  });

  it('select changes value when an option is chosen', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, '1');
    expect(select.value).toBe('1');
  });

  it('submit button is disabled when isLoading=true', () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submit button is disabled when question is empty', () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('form submission calls onSubmit with { question, bookNumber: null } when no book selected', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    await userEvent.type(screen.getByRole('textbox'), 'Who is Harry?');
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ question: 'Who is Harry?', bookNumber: null });
  });

  it('form submission calls onSubmit with selected bookNumber', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    await userEvent.type(screen.getByRole('textbox'), 'What is the sorting hat?');
    await userEvent.selectOptions(screen.getByRole('combobox'), '3');
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledWith({ question: 'What is the sorting hat?', bookNumber: '3' });
  });

  it('pressing Enter in the input submits the form', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    await userEvent.type(screen.getByRole('textbox'), 'Who is Voldemort?{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ question: 'Who is Voldemort?', bookNumber: null });
  });

  it('submit is blocked when question input is empty', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    // Button is disabled — click should not reach onSubmit
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submit is blocked when isLoading is true even with question', async () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={true} />);
    // Can't type because input is also disabled, so onSubmit should not fire
    expect(screen.getByRole('button')).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('loading state shows summoning spinner text', () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={true} />);
    expect(screen.getByRole('button')).toHaveTextContent(/summoning/i);
  });

  it('non-loading state shows Accio Answer button text', () => {
    render(<SearchForm onSubmit={onSubmit} isLoading={false} />);
    expect(screen.getByRole('button')).toHaveTextContent(/accio answer/i);
  });

  it('handleSubmit isLoading guard: fires form submit directly while loading does not call onSubmit', () => {
    const { container } = render(<SearchForm onSubmit={onSubmit} isLoading={true} />);
    fireEvent.submit(container.querySelector('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
