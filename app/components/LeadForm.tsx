'use client';

import { useState } from 'react';
import { PHONE_DISPLAY, SERVICE_NAME, trackConversion } from '@/app/lib/analytics';

// Endpoint is configured in the original deployment. If not yet provided,
// the form falls back to a friendly message and a phone CTA.
const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbz0NyIG2qBWS9Pwxth_7a1eozaaF8zJVmZEc5_7Hr4AvcZCFXh3pbiTr64X-01TEO-r8A/exec';

type Props = {
  formId?: string;
  withMessage?: boolean;
  className?: string;
  serviceName?: string;
};

type Errors = Partial<Record<'name' | 'phone' | 'zip' | 'email', boolean>>;

function endpointConfigured(): boolean {
  return (
    WEB_APP_URL.indexOf('PASTE_YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE') === -1 &&
    /^https:\/\/script\.google\.com\/.+\/exec(?:\?.*)?$/.test(WEB_APP_URL)
  );
}

function submissionId(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 12);
}

function getStatus(id: string): Promise<{ state?: string; message?: string }> {
  return new Promise((resolve, reject) => {
    const callbackName = '__eeLeadStatus_' + id.replace(/[^a-zA-Z0-9_$]/g, '');
    const script = document.createElement('script');
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        (window as unknown as Record<string, unknown>)[callbackName] = undefined;
      }
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (result: {
      state?: string;
      message?: string;
    }) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(result || { state: 'pending' });
    };

    script.onerror = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('Could not confirm lead submission.'));
    };

    timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve({ state: 'pending' });
    }, 2500);

    script.src =
      WEB_APP_URL +
      (WEB_APP_URL.indexOf('?') === -1 ? '?' : '&') +
      'action=status&submission_id=' +
      encodeURIComponent(id) +
      '&prefix=' +
      encodeURIComponent(callbackName) +
      '&_=' +
      Date.now();
    document.head.appendChild(script);
  });
}

function confirmSubmission(id: string, attemptsLeft: number): Promise<{ state?: string; message?: string }> {
  return getStatus(id).then((result) => {
    if (result && result.state === 'success') return result;
    if (result && result.state === 'error') {
      throw new Error(result.message || 'Lead submission was rejected.');
    }
    if (attemptsLeft <= 1) {
      throw new Error('Submission was sent but could not be confirmed.');
    }
    return new Promise<void>((resolve) => setTimeout(resolve, 700)).then(() =>
      confirmSubmission(id, attemptsLeft - 1),
    );
  });
}

export default function LeadForm({ formId, withMessage, className, serviceName }: Props) {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function readValue(form: HTMLFormElement, name: string): string {
    const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function setFieldState(form: HTMLFormElement, name: string, invalid: boolean) {
    const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>('[name="' + name + '"]');
    if (!el) return;
    el.style.borderColor = invalid ? '#D64545' : '';
    if (invalid) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  function validate(form: HTMLFormElement): Record<string, string> | null {
    const data = {
      name: readValue(form, 'name'),
      phone: readValue(form, 'phone'),
      zip: readValue(form, 'zip'),
      email: readValue(form, 'email'),
      message: readValue(form, 'message'),
    };
    const phoneDigits = data.phone.replace(/\D/g, '');
    const errors: Errors = {
      name: data.name.length < 2,
      phone: phoneDigits.length < 10,
      zip: !/^\d{5}(?:-\d{4})?$/.test(data.zip),
      email: !!data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    };
    (Object.keys(errors) as Array<keyof Errors>).forEach((k) => setFieldState(form, k, !!errors[k]));
    const firstInvalid = (Object.keys(errors) as Array<keyof Errors>).find((k) => errors[k]);
    if (firstInvalid) {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        '[name="' + firstInvalid + '"]',
      );
      if (el) el.focus();
      return null;
    }
    return data;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.dataset.submitting === 'true') return;

    if (!endpointConfigured()) {
      console.error('Lead form endpoint is not configured.');
      alert('Online form submission is not configured yet. Please call E&E at (805) 590-0908.');
      return;
    }

    const data = validate(form);
    if (!data) return;

    const id = submissionId();
    const params = new URLSearchParams(window.location.search);
    const formCard = form.closest('.form-card');
    const cardId = formCard ? (formCard as HTMLElement).id : '';

    const payload = new URLSearchParams();
    payload.append('submission_id', id);
    payload.append('service', SERVICE_NAME);
    payload.append('name', data.name);
    payload.append('phone', data.phone);
    payload.append('zip', data.zip);
    payload.append('email', data.email);
    payload.append('message', data.message || '');
    payload.append('form_location', cardId);
    payload.append('landing_page', window.location.href);
    payload.append('referrer', document.referrer || '');
    payload.append('utm_source', params.get('utm_source') || '');
    payload.append('utm_medium', params.get('utm_medium') || '');
    payload.append('utm_campaign', params.get('utm_campaign') || '');
    payload.append('utm_term', params.get('utm_term') || '');
    payload.append('utm_content', params.get('utm_content') || '');
    payload.append('gclid', params.get('gclid') || '');
    payload.append('gbraid', params.get('gbraid') || '');
    payload.append('wbraid', params.get('wbraid') || '');

    form.dataset.submitting = 'true';
    setSending(true);
    setSubmitted(true); // optimistic: acknowledge immediately on submit click
    setConfirmed(false);

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString(),
        keepalive: true,
      });
      await new Promise((r) => setTimeout(r, 450));
      await confirmSubmission(id, 8);

      setConfirmed(true); // backend confirmed the row was saved

      trackConversion('generate_lead', {
        service: SERVICE_NAME,
        page: window.location.pathname,
        form_location: cardId,
      });

      if (typeof window.eeGoogleAdsLeadConversion === 'function') {
        window.eeGoogleAdsLeadConversion();
      }

      document.dispatchEvent(
        new CustomEvent('ee:generate_lead', {
          detail: { service: SERVICE_NAME, form_location: cardId },
        }),
      );

      form.reset();
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea').forEach((el) => {
        el.style.borderColor = '';
        el.removeAttribute('aria-invalid');
      });

      setTimeout(() => {
        form.dataset.submitting = 'false';
        setSending(false);
        setSubmitted(false);
        setConfirmed(false);
      }, 5000);
    } catch (error) {
      console.error('Lead submission failed or could not be confirmed:', error);
      form.dataset.submitting = 'false';
      setSending(false);
      setSubmitted(false);
      setConfirmed(false);
      alert('We could not confirm your online submission. Please try again or call E&E at (805) 590-0908.');
    }
  }

  const idPrefix = formId || 'quote';
  return (
    <form className={`lead-form ${className || ''}`.trim()} data-service={serviceName || SERVICE_NAME} noValidate onSubmit={handleSubmit}>
      <div className="f-field">
        <label htmlFor={`${idPrefix}-name`}>Name</label>
        <input
          autoComplete="name"
          id={`${idPrefix}-name`}
          name="name"
          required
          type="text"
        />
      </div>
      <div className="f-row">
        <div className="f-field">
          <label htmlFor={`${idPrefix}-phone`}>Phone</label>
          <input
            autoComplete="tel"
            id={`${idPrefix}-phone`}
            inputMode="tel"
            name="phone"
            required
            type="tel"
          />
        </div>
        <div className="f-field">
          <label htmlFor={`${idPrefix}-zip`}>ZIP Code</label>
          <input
            autoComplete="postal-code"
            id={`${idPrefix}-zip`}
            inputMode="numeric"
            name="zip"
            required
            type="text"
          />
        </div>
      </div>
      <div className="f-field">
        <label htmlFor={`${idPrefix}-email`}>
          Email <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </label>
        <input autoComplete="email" id={`${idPrefix}-email`} name="email" type="email" />
      </div>
      {withMessage && (
        <div className="f-field">
          <label htmlFor={`${idPrefix}-msg`}>
            Message <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </label>
          <textarea id={`${idPrefix}-msg`} name="message" rows={3} />
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={sending}>
        {submitted
          ? "THANK YOU  -  WE'LL CALL YOU SOON"
          : 'GET MY FREE 3D DESIGN'}
      </button>
      {confirmed && (
        <p className="f-confirm-note" role="status">
          ✓ Your request is confirmed. We'll call you within one business day.
        </p>
      )}
    </form>
  );
}

export { PHONE_DISPLAY };
