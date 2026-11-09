'use client';
import {useEffect,useRef,useState} from 'react';
import {Bomb,ArrowLeft,ArrowRight,Check,Pause,Play,Timer} from 'lucide-react';
import {ensureDeals,readDeals,saveDeals,useDeals} from '@/lib/bomb-deals';
import {storeProducts} from '@/lib/store-catalog';

export default function BombDeals({onNotice}:{onNotice:(message:string)=>void}){
  const {campaign,now,price}=useDeals();
  const rail=useRef<HTMLDivElement>(null);
  const [paused,setPaused]=useState(false),[burst,setBurst]=useState('');
  const burstTimer=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>()=>clearTimeout(burstTimer.current),[]);
  useEffect(()=>{clearTimeout(burstTimer.current);setBurst('');rail.current?.scrollTo({left:0,behavior:'auto'});},[campaign?.endsAt]);
  useEffect(()=>{
    if(paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=setInterval(()=>{
      const el=rail.current;if(!el || document.hidden)return;
      const bounds=el.getBoundingClientRect();if(bounds.bottom<0 || bounds.top>window.innerHeight)return;
      const atEnd=el.scrollLeft+el.clientWidth>=el.scrollWidth-4;
      el.scrollTo({left:atEnd?0:el.scrollLeft+ (el.firstElementChild?.clientWidth||260)+18,behavior:'smooth'});
    },4500);
    return()=>clearInterval(timer);
  },[paused]);
  const remaining=campaign?Math.max(0,Math.ceil((campaign.endsAt-now)/1000)):8*3600;
  const expired=!!campaign && remaining===0;
  function open(id:string){
    const current=ensureDeals();if(!current.ids.includes(id)){onNotice('A fresh set of Bomb Deals is ready. Choose a new deal.');return;}
    if(!current.revealed.includes(id)){
      if(!saveDeals({...current,revealed:[...current.revealed,id]}))onNotice('Deal activated for this visit. Browser storage is unavailable.');
      setBurst(id);clearTimeout(burstTimer.current);burstTimer.current=setTimeout(()=>{setBurst('');const latest=readDeals();if(latest?.endsAt===current.endsAt&&Date.now()<latest.endsAt&&latest.revealed.includes(id))window.dispatchEvent(new CustomEvent('pm-open-product',{detail:id}));},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:750);
    }else window.dispatchEvent(new CustomEvent('pm-open-product',{detail:id}));
  }
  function slide(direction:number){setPaused(true);const el=rail.current;el?.scrollBy({left:direction*((el.firstElementChild?.clientWidth||260)+18),behavior:'smooth'});}
  return <section className="bomb-deals" aria-labelledby="bomb-deals-title">
    <div className="bomb-deals-heading"><div className="bomb-title"><span className="bomb-emblem" aria-hidden="true"><Bomb size={32}/><i/></span><div><small>SMALL PRICES. BIG TAIL WAGS.</small><h2 id="bomb-deals-title">Bomb <em>Deals.</em></h2></div></div>
      <div className="bomb-countdown"><span><Timer size={15}/>{expired?'Deal window ended':'Price drops end in'}</span><div aria-label={`Time remaining ${Math.floor(remaining/3600)} hours ${Math.floor(remaining/60)%60} minutes ${remaining%60} seconds`}>{[Math.floor(remaining/3600),Math.floor(remaining/60)%60,remaining%60].map((n,i)=><span key={i}><b>{String(n).padStart(2,'0')}</b><small>{['HRS','MIN','SEC'][i]}</small></span>)}</div></div>
    </div>
    <div className="bomb-deals-sub"><p>10 surprise picks. New deals every 8 hours. Tap a bomb to reveal your price.</p><div><button aria-label="Previous deals" onClick={()=>slide(-1)}><ArrowLeft size={18}/></button><button aria-label={paused?'Play deal slideshow':'Pause deal slideshow'} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button><button aria-label="Next deals" onClick={()=>slide(1)}><ArrowRight size={18}/></button></div></div>
    <div className="bomb-deals-rail" ref={rail} onPointerDown={()=>setPaused(true)} onFocusCapture={()=>setPaused(true)}>
      {(campaign?.ids||[]).map((id,i)=>{const p=storeProducts.find(p=>p.id===id);if(!p)return null;const revealed=!expired&&campaign?.revealed.includes(id),cost=price(id,p.price);return <article className={`bomb-card ${burst===id?'bomb-burst':''}`} key={id} style={{animationDelay:`${i*60}ms`}}>
        <button className="bomb-product-open" disabled={expired} aria-label={`Reveal deal for ${p.name}`} onClick={()=>open(id)}><div className="product-photo" role="img" aria-label={p.name} style={{backgroundPosition:`${(p.tile%4)*100/3}% ${Math.floor(p.tile/4)*100/3}%`}}/><span className="bomb-tag">{revealed?<><Check size={13}/> UNLOCKED</>:<>DROP #{String(i+1).padStart(2,'0')}</>}</span><span className="bomb-card-icon" aria-hidden="true"><Bomb size={26}/></span><span className="bomb-particles" aria-hidden="true">{Array.from({length:8},(_,n)=><i key={n} style={{'--angle':`${n*45}deg`} as React.CSSProperties}/>)}</span></button>
        <div className="bomb-card-copy"><small>{p.brand} · {p.species==='All'?'All pets':p.species}</small><h3>{p.name}</h3><div className="bomb-price" aria-live="polite"><b key={cost}>₹{cost.toLocaleString('en-IN')}</b>{revealed&&<><del>₹{p.price}</del><span>−{Math.round((1-cost/p.price)*100)}%</span></>}</div><button className="bomb-reveal" disabled={expired||burst===id} onClick={()=>open(id)}>{expired?'Deal ended':burst===id?'Price dropping…':revealed?'View deal':'Reveal price drop'}<ArrowRight size={17}/></button></div>
      </article>;})}
    </div><small className="bomb-preview-note" role="status">{campaign?'Next 10 picks arrive automatically when the timer ends · Sample offers saved on this browser':'Preparing your deals…'}</small>
  </section>;
}
