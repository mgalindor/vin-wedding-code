// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi } from 'vitest';

import i18n from '@/i18n/config';

import { OnboardWeddingPlannerForm } from './onboard-wedding-planner-form';

function renderForm(props: Parameters<typeof OnboardWeddingPlannerForm>[0]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <OnboardWeddingPlannerForm {...props} />
    </I18nextProvider>,
  );
}

describe('OnboardWeddingPlannerForm', () => {
  it('shows validation errors when required fields are missing', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    // The submit button is disabled until the form is valid. Fire
    // submit on the <form> element directly so RHF's required-field
    // validators run regardless of the disabled state.
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
    expect(
      screen.getAllByText(/This field is required/i).length,
    ).toBeGreaterThan(0);
  });

  it('rejects a slug with an @ symbol', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    fireEvent.input(screen.getByLabelText(/First Name/i), {
      target: { value: 'Ada' },
    });
    fireEvent.input(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Lovelace' },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'ada.lovelace@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: 'ada@wendy' },
    });
    fireEvent.input(screen.getByLabelText(/Initial Password/i), {
      target: { value: 'a-strong-passphrase' },
    });

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
    expect(
      screen.getByText(/lowercase letters and digits only/i),
    ).toBeInTheDocument();
  });

  it('rejects a password shorter than 10 characters', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    fireEvent.input(screen.getByLabelText(/First Name/i), {
      target: { value: 'Ada' },
    });
    fireEvent.input(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Lovelace' },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'ada.lovelace@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: 'ada' },
    });
    fireEvent.input(screen.getByLabelText(/Initial Password/i), {
      target: { value: 'short' },
    });

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
    expect(
      screen.getAllByText(/Password must be 10-25 characters/i).length,
    ).toBeGreaterThan(0);
  });

  it('submits a well-formed payload and forwards it to onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderForm({
      isSubmitting: false,
      serverError: null,
      onSubmit,
      onCancel: vi.fn(),
    });

    fireEvent.input(screen.getByLabelText(/First Name/i), {
      target: { value: 'Ada' },
    });
    fireEvent.input(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Lovelace' },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'ada.lovelace@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: 'ada' },
    });
    fireEvent.input(screen.getByLabelText(/Initial Password/i), {
      target: { value: 'a-strong-passphrase' },
    });

    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada.lovelace@example.com',
      username: 'ada',
      password: 'a-strong-passphrase',
      phone: '',
    });
  });

  it('shows a server-side conflict on the email field', () => {
    renderForm({
      isSubmitting: false,
      serverError: { field: 'email', message: 'Email already in use' },
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    });

    expect(screen.getByText(/Email already in use/i)).toBeInTheDocument();
  });
});