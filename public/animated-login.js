/* Standalone interaction demo. No credentials are stored or sent. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const inputs = [$('full-name'), $('email'), $('password')];
  const tabs = [$('register-tab'), $('signin-tab')];
  let register = true, celebrating = false, resetTimer, flashTimer;
  const messages = { idle: 'Hello there, future best friend.', curious: 'What should I call you?', reading: 'Enter your email address 📧', shy: 'I’m covering my eyes! Your password is private 🙈🔒', sad: 'A little fix, and you’re all set.', joyful: 'You’re all set! 🎉', welcome: 'Welcome back! Good to see you 😊' };
  function mood(state) {
    $('mascot').className = `reactive-cat mood-${state}`;
    $('mascot').dataset.mood = state;
    $('photo').className = `cat-character state-${state}`;
    $('bubble').textContent = messages[state];
    $('photo').setAttribute('aria-label', state === 'shy' ? 'Kitten covering its eyes with its paws' : 'Animated orange kitten');
  }
  function clearErrors() {
    ['name', 'email', 'password'].forEach(id => $(id + '-error').textContent = '');
    inputs.forEach(input => { input.removeAttribute('aria-invalid'); input.parentElement.classList.remove('invalid'); });
    $('card').classList.remove('has-error');
  }
  function switchMode(next) {
    clearTimeout(resetTimer); celebrating = false; register = next; document.body.classList.toggle('is-signin', !register); $('forgot-password').hidden = register;
    inputs.forEach(input => input.disabled = false);
    tabs.forEach((tab, i) => { const selected = i === (register ? 0 : 1); tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', selected); tab.tabIndex = selected ? 0 : -1; });
    $('account-panel').setAttribute('aria-labelledby', register ? 'register-tab' : 'signin-tab');
    $('name-label').hidden = !register; $('full-name').disabled = !register;
    $('password').value = ''; $('password').type = 'password';
    $('password').autocomplete = register ? 'new-password' : 'current-password';
    $('toggle-password').setAttribute('aria-pressed', 'false'); $('toggle-password').setAttribute('aria-label', 'Show password'); $('eye-slash').setAttribute('hidden', '');
    $('password-help').hidden = !register;
    $('form-title').textContent = register ? 'Create Account' : 'Welcome Back';
    $('subtitle').textContent = register ? 'Join us today & get access to your dashboard' : 'Sign in to access your account dashboard';
    $('submit-button').disabled = false; $('submit-button').textContent = register ? 'Create Account' : 'Sign In';
    $('footer-text').textContent = register ? 'Already have an account?' : 'Don’t have an account?';
    $('footer-link').textContent = register ? 'Sign In' : 'Register';
    $('footer-link').href = register ? '#signin' : '#register';
    $('status').textContent = ''; clearErrors(); mood(register ? 'idle' : 'welcome');
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => switchMode(i === 0));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i;
      switchMode(next === 0); tabs[next].focus();
    });
  });
  $('footer-link').addEventListener('click', event => { event.preventDefault(); switchMode(!register); });
  $('forgot-password').addEventListener('click', () => {
    $('status').textContent = 'Password reset is not connected in this demo. No email has been sent.';
  });
  inputs.forEach((input, i) => {
    input.addEventListener('focus', () => { if (!celebrating) mood(['curious', 'reading', 'shy'][i]); });
    input.addEventListener('blur', () => { if (!celebrating) mood('idle'); });
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid'); input.parentElement.classList.remove('invalid');
      $(['name', 'email', 'password'][i] + '-error').textContent = '';
      $('status').textContent = ''; mood(['curious', 'reading', 'shy'][i]);
    });
  });
  $('toggle-password').addEventListener('pointerdown', event => event.preventDefault());
  $('toggle-password').addEventListener('click', () => {
    const show = $('password').type === 'password'; $('password').type = show ? 'text' : 'password';
    $('toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    $('toggle-password').setAttribute('aria-pressed', String(show));
    $('eye-slash').toggleAttribute('hidden', !show); mood('shy');
  });
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 44; i++) {
      const bit = document.createElement('i'); bit.className = 'confetti-bit'; bit.setAttribute('aria-hidden', 'true');
      bit.style.cssText = `background:${['#9384ff','#daba69','#c7bcff'][i % 3]};--x:${Math.cos(i * 2.4) * (95 + i * 3)}px;--y:${Math.sin(i * 2.4) * 170 + 95}px;--r:${i * 41}deg;animation-delay:${i % 5 * 30}ms`;
      $('card').append(bit); bit.addEventListener('animationend', () => bit.remove(), { once: true });
    }
  }
  $('account-form').addEventListener('submit', event => {
    event.preventDefault(); if (celebrating) return; clearErrors();
    const errors = [];
    if (register && !$('full-name').value.trim()) errors.push([0, 'Please enter your name.']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim())) errors.push([1, 'Enter a valid email address.']);
    const password = $('password').value;
    if (register ? password.length < 8 || !/[a-z]/i.test(password) || !/[^a-z]/i.test(password) : !password) errors.push([2, register ? 'Use 8+ characters, with a letter and a number or symbol.' : 'Please enter your password.']);
    if (errors.length) {
      errors.forEach(([i, message]) => { inputs[i].setAttribute('aria-invalid', 'true'); inputs[i].parentElement.classList.add('invalid'); $(['name', 'email', 'password'][i] + '-error').textContent = message; });
      inputs[errors[0][0]].focus(); mood('sad');
      void $('card').offsetWidth; $('card').classList.add('has-error');
      clearTimeout(flashTimer); flashTimer = setTimeout(() => $('card').classList.remove('has-error'), 750);
      $('status').textContent = 'Please check the highlighted fields.'; return;
    }
    celebrating = true; mood('joyful'); confetti();
    $('status').textContent = register ? 'Looking good! Demo complete — no account was created.' : 'Demo complete — no sign-in request was sent.';
    $('submit-button').textContent = '✓ Demo complete'; $('submit-button').disabled = true;
    inputs.forEach(input => input.disabled = true);
    resetTimer = setTimeout(() => {
      celebrating = false; inputs.forEach(input => input.disabled = false); $('full-name').disabled = !register;
      $('submit-button').disabled = false; $('submit-button').textContent = register ? 'Create Account' : 'Sign In'; mood('idle');
    }, 2600);
  });
})();

