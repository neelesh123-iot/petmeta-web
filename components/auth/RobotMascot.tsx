'use client';
import { useEffect } from 'react';
import type { CatMood } from '@/components/three/PhotoCat';
export default function RobotMascot({ mood, onReady }: { mood: CatMood; onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return <div className={`robot state-${mood}`} role="img" aria-label={mood === 'shy' ? 'Robot turned away for password privacy' : 'Animated white robot with cyan eyes'}><div className="robot-float"><div className="robot-turn"><div className="robot-antenna"/><div className="robot-head"><i className="robot-ear left"/><i className="robot-ear right"/><div className="robot-visor"><i className="robot-eye"/><i className="robot-eye"/></div><div className="robot-back"/></div><div className="robot-neck"/><div className="robot-body"/><i className="robot-arm left"/><i className="robot-arm right"/><i className="robot-foot left"/><i className="robot-foot right"/></div></div></div>;
}
