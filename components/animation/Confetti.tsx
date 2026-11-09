'use client';
import { motion, useReducedMotion } from 'framer-motion';
export default function Confetti() {
  const reduced = useReducedMotion();
  return <div className="celebration" aria-hidden="true">{!reduced && Array.from({ length: 32 }, (_, i) => <motion.i key={i}
    style={{ background: ['#6C63FF', '#D9B965', '#B3ACFF', '#ffeeb2'][i % 4], left: `${(i * 37) % 100}%`, borderRadius: i % 3 ? '2px' : '50%' }}
    initial={{ y: 80, opacity: 0, rotate: 0 }} animate={{ y: [80, -150 - i % 7 * 20, 320], x: [0, (i % 2 ? 1 : -1) * (20 + i * 3)], opacity: [0, 1, 1, 0], rotate: i * 47 }}
    transition={{ duration: 1.8, delay: i % 5 * 0.04, ease: 'easeOut' }} />)}</div>;
}

