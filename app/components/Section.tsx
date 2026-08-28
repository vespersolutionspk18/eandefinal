import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  center?: boolean;
  children: ReactNode;
  className?: string;
  background?: 'paper' | 'mist' | 'tint' | 'tint-2' | 'teal' | 'dark';
  id?: string;
  size?: 'default' | 'tight' | 'wide';
};

export default function Section({
  eyebrow,
  title,
  subtitle,
  center = true,
  children,
  className,
  background,
  id,
  size = 'default',
}: Props) {
  const sectionClass = `sec ${size === 'tight' ? 'sec-tight' : ''} ${className || ''}`.trim();
  const bgStyle: React.CSSProperties =
    background === 'mist'
      ? { background: 'var(--mist)' }
      : background === 'tint'
        ? { background: 'var(--tint-2)' }
        : background === 'teal'
          ? { background: 'var(--teal)', color: '#fff' }
          : background === 'dark'
            ? { background: '#102F37', color: '#fff' }
            : {};
  return (
    <section id={id} className={sectionClass} style={bgStyle}>
      <div className="wrap">
        {(eyebrow || title || subtitle) && (
          <header className={center ? 'shead center' : 'shead'}>
            {eyebrow && (
              <span className={eyebrow.toLowerCase().includes('kicker') || eyebrow.toLowerCase().includes('recognition') ? 'eyebrow' : 'wcy-kicker'}>{eyebrow}</span>
            )}
            {title && (
              <h2 className="h2" style={background === 'teal' || background === 'dark' ? { color: '#fff' } : undefined}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="lead" style={background === 'teal' || background === 'dark' ? { color: '#D7EDF2' } : undefined}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
