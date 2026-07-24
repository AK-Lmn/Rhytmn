import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="Rhythm home">
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          <strong>Rhythm</strong>
          <small>Your body, in balance</small>
        </span>
      )}
    </Link>
  );
}
