/**
 * TC-303 (component): NewWeddingForm — US-009 happy path + past-date flow.
 *
 * Verifies the form contract documented in tech-spec.md §Frontend
 * §Interaction §UI Behavior Rules:
 *   - Save action is disabled until every required field passes
 *     validation (Rule 10 of the functional spec).
 *   - Past dates surface an inline warning with a confirmation
 *     control; the save action stays disabled until acknowledged
 *     (Rule 7).
 *   - Trimming whitespace is enforced on submit (Rule 11).
 *   - Failed-submit banner surfaces a non-field server error (Rule 14).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type CreateWeddingDto } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import { NewWeddingForm } from './new-wedding-form';

function renderForm(props: Parameters<typeof NewWeddingForm>[0]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <NewWeddingForm {...props} />
    </I18nextProvider>,
  );
}

function futureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function pastDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function fillValidForm(): void {
  fireEvent.input(screen.getByLabelText(/Partner 1/i), {
    target: { value: 'Sofía Ramírez' },
  });
  fireEvent.input(screen.getByLabelText(/Partner 2/i), {
    target: { value: 'Andrés López' },
  });
  fireEvent.input(screen.getByLabelText(/Wedding Date/i), {
    target: { value: futureDate() },
  });
  fireEvent.input(screen.getByLabelText(/Venue Name/i), {
    target: { value: 'Hacienda San Miguel' },
  });
  fireEvent.input(screen.getByLabelText(/City/i), {
    target: { value: 'CDMX' },
  });
}

describe('TC-303: NewWeddingForm — US-009', () => {
  it('disables Save until every required field is filled', () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    const save = screen.getByRole('button', { name: /save & continue/i });
    expect(save).toBeDisabled();

    fillValidForm();

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    return waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('shows the past-date warning and keeps Save disabled until acknowledged', () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    fireEvent.input(screen.getByLabelText(/Partner 1/i), {
      target: { value: 'A' },
    });
    fireEvent.input(screen.getByLabelText(/Partner 2/i), {
      target: { value: 'B' },
    });
    fireEvent.input(screen.getByLabelText(/Wedding Date/i), {
      target: { value: pastDate() },
    });
    fireEvent.input(screen.getByLabelText(/Venue Name/i), {
      target: { value: 'V' },
    });
    fireEvent.input(screen.getByLabelText(/City/i), {
      target: { value: 'C' },
    });

    const save = screen.getByRole('button', { name: /save & continue/i });
    expect(save).toBeDisabled();

    expect(
      screen.getByText(/this date is in the past/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    return waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('trims whitespace before submitting', () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    fireEvent.input(screen.getByLabelText(/Partner 1/i), {
      target: { value: '  Sofía Ramírez  ' },
    });
    fireEvent.input(screen.getByLabelText(/Partner 2/i), {
      target: { value: '  Andrés López  ' },
    });
    fireEvent.input(screen.getByLabelText(/Wedding Date/i), {
      target: { value: futureDate() },
    });
    fireEvent.input(screen.getByLabelText(/Venue Name/i), {
      target: { value: '  Hacienda  ' },
    });
    fireEvent.input(screen.getByLabelText(/City/i), {
      target: { value: '  CDMX  ' },
    });

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    return waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    }).then(() => {
      const dto = onSubmit.mock.calls[0]![0] as CreateWeddingDto;
      expect(dto.partner1Name).toBe('Sofía Ramírez');
      expect(dto.partner2Name).toBe('Andrés López');
      expect(dto.venueName).toBe('Hacienda');
      expect(dto.venueCity).toBe('CDMX');
    });
  });

  it('surfaces a non-field server error in a banner', () => {
    renderForm({
      isSubmitting: false,
      serverError: { message: 'We could not save the wedding.' },
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    });

    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(/we could not save the wedding/i);
  });
});