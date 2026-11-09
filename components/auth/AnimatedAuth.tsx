'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, Eye, EyeOff, LockKeyhole, Mail, PawPrint, UserRound, LoaderCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authErrorMessage } from '@/lib/auth-errors';
import { sendPasswordResetEmail } from 'firebase/auth';
import type { CatMood } from '@/components/three/PhotoCat';
import Confetti from '@/components/animation/Confetti';
const AnimatedKitten = dynamic(() => import('@/components/three/PhotoCat'), { ssr: false });

type Person = { name: string; email: string; uid?: string };
type Field = 'name' | 'email' | 'password' | '';
const moodText: Record<CatMood, string> = {
  idle: 'Hello there, future best friend.', curious: 'What should I call you?', reading: 'Enter your email address 📧',
  shy: 'I’m covering my eyes! Your password is private 🙈🔒', sad: 'Let’s give that another try.', happy: 'That looks purr-fect!',
  joyful: 'You’re part of the family!', anticipating: 'Ready when you are!', sleepy: 'Just resting my eyes…',
};

export default function AnimatedAuth({ register, onSuccess, onDemo }: { register: boolean; onSuccess: (person: Person) => void; onDemo: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [field, setField] = useState<Field>('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serviceError, setServiceError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const lastActivity = useRef(Date.now());
  const successTimer = useRef<ReturnType<typeof setTimeout>>();
  const loaded = useCallback(() => setReady(true), []);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const strongPassword = password.length >= 8 && /[a-zA-Z]/.test(password) && /[^a-zA-Z]/.test(password);
  const invalid = Object.keys(errors).length > 0 || !!serviceError;
  const mood: CatMood = success ? 'joyful' : invalid ? 'sad' : field === 'password' ? 'shy' : sleepy ? 'sleepy' : hovered || busy ? 'anticipating' : field === 'name' ? 'curious' : field === 'email' ? validEmail ? 'happy' : 'reading' : validEmail && strongPassword ? 'happy' : 'idle';

  const wake = () => { lastActivity.current = Date.now(); setSleepy(false); };
  useEffect(() => {
    const timer = setInterval(() => setSleepy(Date.now() - lastActivity.current > 8000), 500);
    return () => { clearInterval(timer); clearTimeout(successTimer.current); };
  }, []);
  function focus(value: Field) { wake(); setField(value); }
  function edit(value: string, target: Field) {
    wake(); setErrors(old => { const next = { ...old }; delete next[target]; return next; }); setServiceError('');
    if (target === 'name') setName(value); else if (target === 'email') setEmail(value); else setPassword(value);
  }
  function validateField(target: Field) {
    const message = target === 'name' && register && !name.trim() ? 'Please enter your name.'
      : target === 'email' && email && !validEmail ? 'Enter a valid email address.'
      : target === 'password' && password && (register ? !strongPassword : password.length === 0) ? register ? 'Use 8+ characters with a letter and a number or symbol.' : 'Enter your password.' : '';
    if (message) setErrors(old => ({ ...old, [target]: message }));
    setField('');
  }
  function celebrate(next: () => void) {
    if (successTimer.current) return;
    setSuccess(true); setBusy(false); setErrors({}); setServiceError('');
    successTimer.current = setTimeout(next, 1700);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); wake();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (register && !name.trim()) nextErrors.name = 'Please enter your name.';
    if (!validEmail) nextErrors.email = 'Enter a valid email address.';
    if (register ? !strongPassword : password.length === 0) nextErrors.password = register ? 'Use 8+ characters with a letter and a number or symbol.' : 'Enter your password.';
    setErrors(nextErrors); setServiceError('');
    if (Object.keys(nextErrors).length) return;
    if (!auth) { setServiceError('Account sign-in is not connected yet. Try the demo below.'); return; }
    setBusy(true);
    try {
      const result = register ? await createUserWithEmailAndPassword(auth, email.trim(), password) : await signInWithEmailAndPassword(auth, email.trim(), password);
      if (register) await updateProfile(result.user, { displayName: name.trim() });
      celebrate(() => onSuccess({ name: name.trim() || result.user.displayName || 'Pet parent', email, uid: result.user.uid }));
    } catch (error) { setServiceError(authErrorMessage(error)); setBusy(false); }
  }
  async function social(kind: 'google' | 'apple') {
    wake();
    if (!auth) { setServiceError('Social sign-in is not connected yet. Try the demo below.'); return; }
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, kind === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com'));
      celebrate(() => onSuccess({ name: result.user.displayName || 'Pet parent', email: result.user.email || '', uid: result.user.uid }));
    } catch (error) { setServiceError(authErrorMessage(error)); setBusy(false); }
  }
  async function resetPassword() {
    if (!validEmail) { setErrors(old => ({ ...old, email: 'Enter your email address first.' })); return; }
    setBusy(true); setServiceError(''); setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage('If an account exists for this email, a password-reset link will arrive shortly. Check your inbox and spam folder.');
    } catch (error) { setServiceError(authErrorMessage(error)); }
    finally { setBusy(false); }
  }
  const disabled = busy || success;
  return <div className={`animated-auth ${register ? '' : 'is-signin'}`} onPointerMove={wake} onKeyDown={wake}>
    <header className="animated-auth-header"><Link href="/" aria-label="PetMeta intro"><img src="/logo.jpg" alt="PetMeta" /></Link><span>A little care. A lot of love.</span></header>
    <main className="auth-center">
      <div className="auth-heading"><span>A little care. A lot of love.</span><h1>Login Authentication</h1></div>
      <div className="auth-stack">
        <div className={`reactive-cat mood-${mood}`} data-testid="reactive-cat" data-mood={mood} data-ready={ready}>
          {!ready && <div className="cat-loading"><PawPrint size={28} /><span>Your little companion is coming…</span></div>}
          <AnimatedKitten mood={mood} onReady={loaded} />
          <AnimatePresence mode="wait"><motion.div className="mood-bubble" key={mood} initial={{ opacity: 0, y: 5, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }} aria-live="polite">{moodText[mood]}</motion.div></AnimatePresence>
          {(mood === 'happy' || success) && <div className="cat-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>}
        </div>
        <motion.section className={`auth-card reactive-auth-card ${invalid ? 'has-error' : ''}`} animate={{ x: invalid ? [0, -5, 5, -3, 3, 0] : 0 }} transition={{ duration: 0.4 }}>
          {success && <Confetti />}
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button role="tab" aria-selected={register} className={register ? 'active' : ''} disabled={disabled} onClick={() => router.push('/register')}>Register</button>
            <button role="tab" aria-selected={!register} className={!register ? 'active' : ''} disabled={disabled} onClick={() => router.push('/login')}>Sign In</button>
          </div>
          <h2>{success ? 'Welcome to the family!' : register ? 'Create Account' : 'Welcome back'}</h2>
          <p>{register ? 'Join us today & get access to your dashboard' : 'Your pet’s happy place is waiting for you.'}</p>
          <form onSubmit={submit} noValidate>
            {register && <label htmlFor="auth-name">Full Name<div className={`input-wrap ${errors.name ? 'invalid' : ''}`}><UserRound size={18} /><input id="auth-name" aria-label="Full Name" autoComplete="name" placeholder="e.g. Usman Shams" value={name} disabled={disabled} onFocus={() => focus('name')} onBlur={() => validateField('name')} onChange={e => edit(e.target.value, 'name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} /></div>{errors.name && <span className="field-error" id="name-error">{errors.name}</span>}</label>}
            <label htmlFor="auth-email">Email Address<div className={`input-wrap ${errors.email ? 'invalid' : validEmail ? 'valid' : ''}`}><Mail size={18} /><input id="auth-email" aria-label="Email Address" type="email" autoComplete="email" placeholder="usman@company.com" value={email} disabled={disabled} onFocus={() => focus('email')} onBlur={() => validateField('email')} onChange={e => edit(e.target.value, 'email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />{validEmail && <Check size={17} />}</div>{errors.email && <span className="field-error" id="email-error">{errors.email}</span>}</label>
            <label htmlFor="auth-password">Password<div className={`input-wrap ${errors.password ? 'invalid' : ''}`}><LockKeyhole size={18} /><input id="auth-password" aria-label="Password" type={show ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Create a strong password' : 'Your password'} value={password} disabled={disabled} onFocus={() => focus('password')} onBlur={() => validateField('password')} onChange={e => edit(e.target.value, 'password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : register ? 'password-help' : undefined} /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onPointerDown={e => e.preventDefault()} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password ? <span className="field-error" id="password-error">{errors.password}</span> : register && <span id="password-help" className={`password-help ${strongPassword ? 'is-strong' : ''}`}>{strongPassword ? '✓ Strong password. Your secret is safe.' : '8+ characters, including a letter and a number or symbol.'}</span>}</label>
            {!register && <button type="button" className="password-reset" disabled={disabled} onClick={resetPassword}>Forgot password?</button>}{resetMessage && <p role="status" className="reset-message">{resetMessage}</p>}{serviceError && <p className="error" role="alert">{serviceError}</p>}
            <motion.button className="button auth-submit" disabled={disabled} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onPointerEnter={() => { wake(); setHovered(true); }} onPointerLeave={() => setHovered(false)}>{busy ? <LoaderCircle className="spin" size={19} /> : success ? <Check size={19} /> : register ? 'Create Account' : 'Sign In'}<ArrowRight size={18} /></motion.button>
          </form>
          <div className="or"><span />or continue with<span /></div>
          <div className="social-buttons"><button disabled={disabled} onClick={() => social('google')}><b>G</b> Google</button><button disabled={disabled} onClick={() => social('apple')}>● Apple</button></div>
          <p className="auth-footer">{register ? 'Already have an account?' : 'New to PetMeta?'} <Link href={register ? '/login' : '/register'}>{register ? 'Sign In' : 'Register'}</Link></p>
          <button className="demo-button" disabled={disabled} onClick={() => celebrate(onDemo)}>Explore the demo <ArrowUpRight size={16} /></button>
          <small className="demo-hint">No account needed. Demo data stays on this device.</small>
        </motion.section>
      </div>
      <p className="auth-bottom-note">A little care. A lot of love. <PawPrint size={13} /></p>
    </main>
  </div>;
}




