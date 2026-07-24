import { Logo } from "./components/logo";

export default function NotFound() {
  return (
    <div className="not-found">
      <Logo />
      <span className="empty-orbit"><i /><i /><i /></span>
      <p className="eyebrow">404</p>
      <h1>This page is out of rhythm.</h1>
      <p>The link may be old, or the page may have moved.</p>
      <a className="button primary" href="/home">Return home</a>
    </div>
  );
}
