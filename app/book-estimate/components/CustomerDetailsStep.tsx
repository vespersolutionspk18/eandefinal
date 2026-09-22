'use client';

import type { FormEvent, RefObject } from 'react';
import { formatPhoneInput } from '@/app/lib/booking/validation';
import type { DetailsForm } from './BookingFlow';

type Props = {
  form: DetailsForm;
  errors: Partial<Record<keyof DetailsForm, string>>;
  serviceTypes: Array<{ id: string; label: string }>;
  /** `?service=` from the ad link, used until the visitor changes the select. */
  defaultServiceId?: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onChange: (field: keyof DetailsForm, value: string) => void;
  onSubmit: () => void;
};

/**
 * STEP 1 — customer details.
 * Four fields only, no email, no message box. Validation copy comes from the
 * shared module that the API also uses, so the browser and the server agree.
 */
export default function CustomerDetailsStep({
  form,
  errors,
  serviceTypes,
  defaultServiceId,
  headingRef,
  onChange,
  onSubmit,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="bk-form" noValidate onSubmit={handleSubmit}>
      <h2 className="bk-heading" ref={headingRef} tabIndex={-1}>
        Your Details
      </h2>
      <p className="bk-lede">Name, phone and the property address — that&apos;s all we need.</p>

      <div className="f-field">
        <label htmlFor="bk-name">Full Name</label>
        <input
          aria-describedby={errors.fullName ? 'bk-name-err' : undefined}
          aria-invalid={errors.fullName ? true : undefined}
          autoComplete="name"
          id="bk-name"
          name="fullName"
          type="text"
          value={form.fullName}
          onChange={(event) => onChange('fullName', event.target.value)}
        />
        {errors.fullName && (
          <p className="bk-field-err" id="bk-name-err">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="f-field">
        <label htmlFor="bk-phone">Phone Number</label>
        <input
          aria-describedby={errors.phone ? 'bk-phone-err' : undefined}
          aria-invalid={errors.phone ? true : undefined}
          autoComplete="tel"
          id="bk-phone"
          inputMode="tel"
          name="phone"
          placeholder="(805) 555-1234"
          type="tel"
          value={form.phone}
          onChange={(event) => onChange('phone', formatPhoneInput(event.target.value))}
        />
        {errors.phone && (
          <p className="bk-field-err" id="bk-phone-err">
            {errors.phone}
          </p>
        )}
      </div>

      <div className="f-field">
        <label htmlFor="bk-address">Property Address</label>
        <input
          aria-describedby={errors.address ? 'bk-address-err' : undefined}
          aria-invalid={errors.address ? true : undefined}
          autoComplete="street-address"
          id="bk-address"
          name="address"
          placeholder="123 Main Street, Santa Barbara, CA"
          type="text"
          value={form.address}
          onChange={(event) => onChange('address', event.target.value)}
        />
        {errors.address && (
          <p className="bk-field-err" id="bk-address-err">
            {errors.address}
          </p>
        )}
      </div>

      <div className="f-field">
        <label htmlFor="bk-service">Service / Project Type</label>
        <select
          aria-describedby={errors.serviceType ? 'bk-service-err' : undefined}
          aria-invalid={errors.serviceType ? true : undefined}
          id="bk-service"
          name="serviceType"
          value={form.serviceType || defaultServiceId || ''}
          onChange={(event) => onChange('serviceType', event.target.value)}
        >
          <option value="" disabled>
            Choose a project type
          </option>
          {serviceTypes.map((service) => (
            <option key={service.id} value={service.id}>
              {service.label}
            </option>
          ))}
        </select>
        {errors.serviceType && (
          <p className="bk-field-err" id="bk-service-err">
            {errors.serviceType}
          </p>
        )}
      </div>

      <div className="bk-actions">
        <button className="btn btn-primary bk-cta" type="submit">
          CONTINUE
        </button>
      </div>
      <p className="bk-note">Free estimate · No obligation · Free 3D design</p>
    </form>
  );
}
