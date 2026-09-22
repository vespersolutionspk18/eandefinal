'use client';

// ============================================================================
// CUSTOMER DETAILS STORE (Step 1 answers)
// ----------------------------------------------------------------------------
// A tiny external store backed by session storage. Using
// `useSyncExternalStore` keeps the answers across a refresh or an accidental
// back navigation, while the server snapshot stays empty so SSR and hydration
// always agree — no setState-in-effect, no hydration mismatch.
// ============================================================================

import type { DetailsForm } from './BookingFlow';

const STORAGE_KEY = 'ee_booking_details';

const EMPTY: DetailsForm = { fullName: '', phone: '', address: '', serviceType: '' };

let snapshot: DetailsForm = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function loadFromStorage(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<DetailsForm>;
    snapshot = {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      serviceType: typeof parsed.serviceType === 'string' ? parsed.serviceType : '',
    };
  } catch {
    /* malformed storage — start from an empty form */
  }
}

export const detailsStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Client snapshot; hydrates from session storage on first read. */
  getSnapshot(): DetailsForm {
    loadFromStorage();
    return snapshot;
  },

  /** Server snapshot — identical to a fresh form so hydration matches. */
  getServerSnapshot(): DetailsForm {
    return EMPTY;
  },

  set(next: DetailsForm): void {
    snapshot = next;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable (private mode) — the form still works */
    }
    listeners.forEach((listener) => listener());
  },
};
