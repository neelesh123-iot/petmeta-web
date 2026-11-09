'use client';
import {useRef} from 'react';
export default function RealisticCatHero(){
 const el=useRef<HTMLDivElement>(null);
 return <div ref={el} className="realistic-cat-stage" onPointerMove={e=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--rx',`${-(e.clientY-r.top-r.height/2)/r.height*5}deg`);e.currentTarget.style.setProperty('--ry',`${(e.clientX-r.left-r.width/2)/r.width*8}deg`)}} onPointerLeave={()=>{el.current?.style.setProperty('--rx','0deg');el.current?.style.setProperty('--ry','0deg')}}><div className="realistic-cat-plane"><img src="/realistic-cat-hero.png" alt="Realistic orange and white cat lifting a paw"/><span className="photo-caption">A little curiosity. A whole lot of love.</span></div><span className="floating-paw paw-one">✧</span><span className="floating-paw paw-two">✦</span></div>
}
