"use client";

import { ArrowRight, BarChart3, Droplets, HeartPulse, LockKeyhole, MoonStar, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "../components/logo";
import { useAppStore } from "../store/app-store";

export function LandingScreen() {
  const startDemo = useAppStore((state) => state.startDemo);
  const explore = () => {
    startDemo();
    window.location.href = "/home";
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <div>
          <a className="text-link" href="/login">Sign in</a>
          <a className="button primary small" href="/register">Start tracking</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="pill"><ShieldCheck size={15} /> Private wellness tracking, made human</div>
            <h1>Find the rhythm in how you <em>feel.</em></h1>
            <p>
              Quietly track bathroom habits, hydration, and daily wellness—then notice gentle patterns without judgment or diagnosis.
            </p>
            <div className="hero-actions">
              <a className="button primary large" href="/register">Create your private space <ArrowRight size={19} /></a>
              <button className="button secondary large" onClick={explore}>Explore with demo data</button>
            </div>
            <div className="trust-row">
              <span><LockKeyhole size={15} /> User-owned records</span>
              <span><MoonStar size={15} /> Light & dark</span>
              <span><HeartPulse size={15} /> No diagnoses</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Preview of the Rhythm wellness dashboard">
            <div className="visual-glow" />
            <div className="phone">
              <div className="phone-bar"><span>9:41</span><i /></div>
              <div className="mini-greeting"><span>Good morning, Alex</span><strong>Today’s rhythm</strong></div>
              <div className="mini-actions">
                <span className="amber"><i>◌</i>Poop</span>
                <span className="blue"><Droplets />Pee</span>
                <span className="green"><Droplets />Water</span>
              </div>
              <div className="mini-water">
                <div className="mini-ring"><span>72%</span></div>
                <div><strong>1,580 ml</strong><span>of 2,200 ml today</span><i><b /></i></div>
              </div>
              <div className="mini-chart">
                {[46, 62, 54, 78, 68, 88, 74].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
              </div>
              <div className="mini-observation"><Sparkles /><span><strong>A gentle pattern</strong>Your logs are usually earlier on weekdays.</span></div>
            </div>
            <div className="float-card float-one"><Droplets /><span><strong>Hydration on track</strong>Nice steady progress</span></div>
            <div className="float-card float-two"><BarChart3 /><span><strong>7 day rhythm</strong>5 days logged</span></div>
          </div>
        </section>

        <section className="feature-strip">
          <article><span className="feature-icon amber"><HeartPulse /></span><div><h2>Log in a few taps</h2><p>Friendly, one-handed forms keep sensitive tracking simple.</p></div></article>
          <article><span className="feature-icon blue"><BarChart3 /></span><div><h2>Notice useful patterns</h2><p>Clear observations help you understand routines over time.</p></div></article>
          <article><span className="feature-icon green"><ShieldCheck /></span><div><h2>Designed for privacy</h2><p>Discreet copy, private mode, and no public profile—ever.</p></div></article>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <p>Rhythm is for personal awareness and does not provide medical diagnosis or treatment.</p>
        <a href="/privacy">Privacy promise</a>
      </footer>
    </div>
  );
}
