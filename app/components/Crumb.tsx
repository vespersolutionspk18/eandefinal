import Link from 'next/link';

type Item = { href?: string; label: string };

type Props = { items: Item[] };

export default function Crumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i}>
            {item.href && !isLast ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className={isLast ? 'crumbs-current' : ''}>{item.label}</span>
            )}
            {!isLast && <span className="crumbs-sep"> / </span>}
          </span>
        );
      })}
    </nav>
  );
}
