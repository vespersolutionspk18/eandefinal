'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LeadForm, { PHONE_DISPLAY } from './LeadForm';
import { PHONE_NUMBER, trackConversion } from '@/app/lib/analytics';

const SEEN_KEY = 'ee_rehook_seen_v3';
const CONVERTED_KEY = 'ee_lead_converted_v3';

function storageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5h18v14H3V5Zm2 3h14V7H5v1Zm0 3v6h14v-6H5Zm2 2h5v2H7v-2Z" />
    </svg>
  );
}

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const openedRef = useRef(false);
  const allowUnloadRef = useRef(false);
  const previousOverflowRef = useRef('');

  const isEligible = useCallback(() => {
    if (storageGet(CONVERTED_KEY)) return false;
    if (openedRef.current) return false;
    const testMode =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('rehooktest') === '1';
    if (!testMode && storageGet(SEEN_KEY)) return false;
    return true;
  }, []);

  const closeRehook = useCallback((reason: string) => {
    setOpen(false);
    openedRef.current = false;
    document.body.style.overflow = previousOverflowRef.current;
    if (reason && typeof window !== 'undefined') {
      trackConversion('exit_intent_dismissed', {
        page: window.location.pathname,
        reason,
      });
    }
  }, []);

  const showRehook = useCallback(
    (trigger: string) => {
      if (typeof window === 'undefined') return;
      if (!isEligible()) return;
      openedRef.current = true;
      const testMode = new URLSearchParams(window.location.search).get('rehooktest') === '1';
      if (!testMode) storageSet(SEEN_KEY, '1');
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setOpen(true);
      trackConversion('exit_intent_shown', {
        page: window.location.pathname,
        trigger,
      });
      setTimeout(() => {
        const btn = document.getElementById('ee-rehook-close');
        if (btn) {
          try {
            btn.focus({ preventScroll: true });
          } catch {
            btn.focus();
          }
        }
      }, 0);
    },
    [isEligible],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isMobileLike = !isDesktop || window.matchMedia('(max-width: 760px)').matches;
    const testMode = new URLSearchParams(window.location.search).get('rehooktest') === '1';
    let pageInteracted = false;
    let lastY: number | null = null;

    const onInteraction = () => {
      pageInteracted = true;
    };
    ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach((evt) =>
      window.addEventListener(evt, onInteraction, { passive: true }),
    );

    if (testMode) {
      setTimeout(() => showRehook('test_mode'), 250);
    }

    if (isDesktop) {
      const header = document.querySelector('.hdr');
      const onMouseMove = (event: MouseEvent) => {
        const currentY = event.clientY;
        if (!isEligible()) {
          lastY = currentY;
          return;
        }
        if (header && lastY !== null) {
          const rect = header.getBoundingClientRect();
          const movingUp = currentY < lastY;
          const insideHeader = currentY >= rect.top && currentY <= rect.bottom;
          const cameFromBelow = lastY > rect.bottom;
          if (movingUp && insideHeader && cameFromBelow) {
            showRehook('desktop_header_exit_intent');
          }
        }
        lastY = currentY;
      };
      document.addEventListener('mousemove', onMouseMove, { passive: true });

      const onMouseLeave = (event: MouseEvent) => {
        if (event.clientY <= 0) showRehook('desktop_mouseleave');
      };
      document.documentElement.addEventListener('mouseleave', onMouseLeave);

      const onMouseOut = (event: MouseEvent) => {
        const e = event as MouseEvent & { toElement?: Element };
        if (e.relatedTarget || e.toElement) return;
        if (event.clientY <= 12) showRehook('desktop_mouseout');
      };
      document.addEventListener('mouseout', onMouseOut);

      const onKeyDown = (event: KeyboardEvent) => {
        const key = String(event.key || '').toLowerCase();
        const closeShortcut =
          key === 'w' && (event.ctrlKey || event.metaKey) && !event.altKey;
        if (!closeShortcut || storageGet(CONVERTED_KEY)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        showRehook(event.metaKey ? 'cmd_w' : 'ctrl_w');
      };
      window.addEventListener('keydown', onKeyDown, true);

      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (allowUnloadRef.current || storageGet(CONVERTED_KEY) || !pageInteracted) return;
        event.preventDefault();
        event.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', onBeforeUnload);

      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.documentElement.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('beforeunload', onBeforeUnload);
        ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach((evt) =>
          window.removeEventListener(evt, onInteraction),
        );
      };
    }

    if (isMobileLike) {
      const onScroll = () => {
        if (!isEligible()) return;
        const doc = document.documentElement;
        const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
        const progress = window.scrollY / scrollable;
        if (progress >= 0.5) showRehook('mobile_scroll_50');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach((evt) =>
          window.removeEventListener(evt, onInteraction),
        );
      };
    }

    return () => {
      ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach((evt) =>
        window.removeEventListener(evt, onInteraction),
      );
    };
  }, [isEligible, showRehook]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onLead = (event: Event) => {
      const detail = (event as CustomEvent<{ form_location?: string; service?: string }>).detail || {};
      storageSet(CONVERTED_KEY, '1');
      allowUnloadRef.current = true;
      if (detail.form_location === 'exit-rehook') {
        trackConversion('exit_intent_lead', {
          service: detail.service || '',
          page: window.location.pathname,
        });
      }
      closeRehook('');
    };
    document.addEventListener('ee:generate_lead', onLead);

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const phoneLink = target?.closest?.('#ee-rehook a[href^="tel:"]') as HTMLAnchorElement | null;
      if (!phoneLink) return;
      allowUnloadRef.current = true;
      trackConversion('exit_intent_phone_click', {
        page: window.location.pathname,
        phone: PHONE_NUMBER,
      });
    };
    document.addEventListener('click', onClick);

    const onInnerClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.indexOf('#') === 0 || href.indexOf('javascript:') === 0) return;
      if (!link.closest('#ee-rehook')) allowUnloadRef.current = true;
    };
    document.addEventListener('click', onInnerClick);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) closeRehook('escape');
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('ee:generate_lead', onLead);
      document.removeEventListener('click', onClick);
      document.removeEventListener('click', onInnerClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closeRehook]);

  return (
    <div
      aria-hidden={open ? 'false' : 'true'}
      aria-labelledby="ee-rehook-title"
      aria-modal="true"
      className={`ee-rehook ${open ? 'is-open' : ''}`}
      id="ee-rehook"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRehook('backdrop');
      }}
    >
      <div className="ee-rehook-card form-card" id="exit-rehook">
        <button
          aria-label="Close free 3D design form"
          className="ee-rehook-close"
          id="ee-rehook-close"
          type="button"
          onClick={() => closeRehook('close_button')}
        >
          ×
        </button>
        <span className="ee-rehook-kicker">FREE 3D DESIGN</span>
        <h2 className="ee-rehook-title" id="ee-rehook-title">
          GET YOUR FREE 3D DESIGN
        </h2>
        <p className="ee-rehook-copy">
          Tell us where to reach you and we&apos;ll follow up about your free 3D design for your
          bathroom remodel.
        </p>
        <p className="ee-rehook-benefit">
          <CardIcon />
          Low Interest Financing Available
        </p>
        <LeadForm formId="exit-bathroom" />
        <p className="ee-rehook-phone">
          Prefer to talk? <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
        </p>
      </div>
    </div>
  );
}
