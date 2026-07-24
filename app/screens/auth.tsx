"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "../components/logo";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { useAppStore } from "../store/app-store";

export function AuthScreen({ mode }: { mode: "login" | "register" | "forgot" }) {
  const startDemo = useAppStore((state) => state.startDemo);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    if (!auth) {
      setStatus("Firebase isn’t connected yet. Add the environment values from .env.example, or explore the demo.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setStatus("Reset link sent. Check your inbox.");
      } else if (isRegister) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        window.location.href = "/onboarding";
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "/home";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.replace("Firebase: ", "") : "Something went wrong.";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    if (!auth) {
      setStatus("Firebase isn’t connected yet. Add your Firebase environment values first.");
      return;
    }
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.href = isRegister ? "/onboarding" : "/home";
    } catch (error) {
      setStatus(error instanceof Error ? error.message.replace("Firebase: ", "") : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const demo = () => {
    startDemo();
    window.location.href = "/home";
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link className="back-link" href="/"><ArrowLeft size={18} /> Back</Link>
        <Logo />
        <div className="auth-quote">
          <span className="logo-mark large" aria-hidden="true"><i /><i /><i /></span>
          <h2>A calmer way to understand your daily rhythm.</h2>
          <p>Private by design. Friendly by nature. Always descriptive—never diagnostic.</p>
          <div className="auth-trust"><LockKeyhole /><span><strong>Your entries stay yours</strong>No social features or public profiles.</span></div>
        </div>
      </div>
      <main className="auth-panel">
        <section className="auth-card">
          <p className="eyebrow">{mode === "forgot" ? "Account recovery" : isRegister ? "Create your space" : "Welcome back"}</p>
          <h1>{mode === "forgot" ? "Reset your password" : isRegister ? "Start your rhythm" : "Sign in to Rhythm"}</h1>
          <p>{mode === "forgot" ? "We’ll email you a secure reset link." : isRegister ? "A private space for simple, thoughtful tracking." : "Your private wellness space is ready when you are."}</p>

          {mode !== "forgot" && (
            <>
              <button className="button google" type="button" onClick={google} disabled={loading}>
                <span>G</span> Continue with Google
              </button>
              <div className="divider"><span>or use email</span></div>
            </>
          )}

          <form onSubmit={submit}>
            {isRegister && (
              <label>Preferred name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" required /></label>
            )}
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            {mode !== "forgot" && (
              <label>Password
                <span className="password-field">
                  <input type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </span>
              </label>
            )}
            {isLogin && <a className="forgot-link" href="/forgot-password">Forgot password?</a>}
            {status && <div className="form-status" role="status">{status}</div>}
            <button className="button primary full" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "forgot" ? "Send reset link" : isRegister ? "Create account" : "Sign in"}</button>
          </form>

          {mode === "forgot" ? (
            <p className="auth-switch"><a href="/login">Return to sign in</a></p>
          ) : (
            <>
              <p className="auth-switch">{isRegister ? "Already have an account?" : "New to Rhythm?"} <a href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create account"}</a></p>
              <button className="demo-link" onClick={demo}>Explore with fictional demo data</button>
            </>
          )}

          {!isFirebaseConfigured && <p className="setup-note">Demo mode is ready. Account sign-in becomes active after Firebase is configured.</p>}
        </section>
      </main>
    </div>
  );
}
