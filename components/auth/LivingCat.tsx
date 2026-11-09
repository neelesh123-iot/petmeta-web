'use client';
import type { CatMood } from '@/components/three/PhotoCat';
export default function LivingCat({ mood, onReady }: { mood: CatMood; onReady: () => void }) {
  return <div className={`living-photo state-${mood}`}><div className="living-photo-crop"><img src="/auth-cat.jpg" alt="A real calico cat, your little sign-in companion" onLoad={onReady} /><span className="photo-privacy" aria-hidden="true">Not looking<br />✦</span></div><span className="cat-presence" aria-hidden="true" /></div>;
}
