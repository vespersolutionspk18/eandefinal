'use client';

import { useEffect, useRef } from 'react';
import {
  ATTR_ES,
  DESC_EN,
  DESC_ES,
  ES,
  SHORT_LABEL,
  TITLE_EN,
  TITLE_ES,
} from '@/app/lib/i18n';

type Lang = 'en' | 'es';

type TextRecord = {
  node: Text;
  english: string;
  key: string;
};

type AttrRecord = {
  el: Element;
  attr: 'aria-label' | 'title' | 'alt';
  english: string;
};

declare global {
  interface Window {
    eeT?: (english: string) => string;
  }
}

function preserveWhitespace(original: string, replacement: string): string {
  const lead = (original.match(/^\s*/) || [''])[0];
  const trail = (original.match(/\s*$/) || [''])[0];
  return lead + replacement + trail;
}

function walkTextNodes(): TextRecord[] {
  if (typeof document === 'undefined') return [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|NOSCRIPT)$/i.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest('.lang-toggle')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const out: TextRecord[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    out.push({ node: t, english: t.nodeValue || '', key: (t.nodeValue || '').trim() });
  }
  return out;
}

function collectAttrNodes(): AttrRecord[] {
  if (typeof document === 'undefined') return [];
  const out: AttrRecord[] = [];
  document.querySelectorAll('[aria-label],[title],[alt]').forEach((el) => {
    (['aria-label', 'title', 'alt'] as const).forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      out.push({ el, attr, english: el.getAttribute(attr) || '' });
    });
  });
  return out;
}

export default function LanguageProvider() {
  const langRef = useRef<Lang>('en');
  const textNodesRef = useRef<TextRecord[]>([]);
  const attrNodesRef = useRef<AttrRecord[]>([]);

  useEffect(() => {
    textNodesRef.current = walkTextNodes();
    attrNodesRef.current = collectAttrNodes();

    window.eeT = (english: string) =>
      langRef.current === 'es' && ES[english] ? ES[english] : english;

    const setLanguage = (lang: Lang, remember: boolean) => {
      langRef.current = lang === 'es' ? 'es' : 'en';
      document.documentElement.lang = langRef.current;

      textNodesRef.current.forEach((rec) => {
        rec.node.nodeValue =
          langRef.current === 'es' && ES[rec.key]
            ? preserveWhitespace(rec.english, ES[rec.key])
            : rec.english;
      });

      attrNodesRef.current.forEach((rec) => {
        rec.el.setAttribute(
          rec.attr,
          langRef.current === 'es' && ATTR_ES[rec.english]
            ? ATTR_ES[rec.english]
            : rec.english,
        );
      });

      document.title = langRef.current === 'es' ? TITLE_ES : TITLE_EN;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', langRef.current === 'es' ? DESC_ES : DESC_EN);

      document.querySelectorAll('.lang-btn').forEach((btn) => {
        const on = (btn as HTMLElement).getAttribute('data-lang') === langRef.current;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      const group = document.querySelector('.lang-toggle');
      if (group) {
        group.setAttribute(
          'aria-label',
          langRef.current === 'es' ? 'Selector de idioma' : 'Language selector',
        );
      }

      const headerQuote = document.querySelector<HTMLElement>(
        '.site-header-right .btn-primary[data-short-label]',
      );
      if (headerQuote) {
        headerQuote.setAttribute(
          'data-short-label',
          langRef.current === 'es' ? SHORT_LABEL.es : SHORT_LABEL.en,
        );
      }

      if (remember !== false) {
        try {
          localStorage.setItem('ee-language', langRef.current);
        } catch {
          /* ignore */
        }
      }
    };

    document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLanguage((btn.getAttribute('data-lang') as Lang) || 'en', true);
      });
    });

    let saved: Lang = 'en';
    try {
      const v = localStorage.getItem('ee-language');
      if (v === 'es' || v === 'en') saved = v;
    } catch {
      /* ignore */
    }
    setLanguage(saved, false);
  }, []);

  return null;
}
