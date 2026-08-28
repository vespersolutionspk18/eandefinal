function ShieldIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5Zm-1 14-4-4 1.41-1.41L11 12.17l4.59-4.58L17 9Z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="m12 2 8.5 5v10L12 22l-8.5-5V7ZM12 4.3 6.25 7.4 12 10.5l5.75-3.1ZM5 9.14v6.62l6 3.48v-6.62Zm14 0-6 3.48v6.62l6-3.48Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 5h18v14H3V5Zm2 3h14V7H5v1Zm0 3v6h14v-6H5Zm2 2h5v2H7v-2Z" />
    </svg>
  );
}

export default function TrustStrip() {
  return (
    <div aria-label="E&E credentials" className="trust" role="list">
      <div className="wrap trust-in">
        <span className="trust-item" role="listitem">
          <ShieldIcon />
          25+ Years Experience
        </span>
        <span className="trust-item" role="listitem">
          <PersonIcon />
          Family Owned
        </span>
        <span className="trust-item" role="listitem">
          <CheckIcon />
          Licensed &amp; Insured
        </span>
        <span className="trust-item" role="listitem">
          <BoxIcon />
          Free 3D Design
        </span>
        <span className="trust-item" role="listitem">
          <CardIcon />
          Low Interest Financing
        </span>
      </div>
    </div>
  );
}
