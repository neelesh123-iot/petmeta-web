'use client';

import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,Sparkles} from 'lucide-react';

const banners=[
  {name:'Furry friends',slug:'furry-friends',target:'pets'},
  {name:'Accessories',slug:'accessories',target:'accessories'},
  {name:'Grooming',slug:'grooming',target:'grooming'},
  {name:'Hospital care',slug:'hospital-care',target:'vet'},
];

export default function VideoHeroWeb({onSelect}:{onSelect:(category:string)=>void}) {
  const [slide,setSlide]=useState(0);
  const [animation,setAnimation]=useState(true);
  const [motion,setMotion]=useState(true);
  const [pulse,setPulse]=useState(false);
  const banner=banners[slide];
  useEffect(()=>{
    if(!animation)return;
    const timer=window.setInterval(()=>setSlide(value=>(value+1)%banners.length),6000);
    return()=>window.clearInterval(timer);
  },[animation]);
  function move(next:number){setSlide((next+banners.length)%banners.length);if(motion){setPulse(true);window.setTimeout(()=>setPulse(false),280)}}
  return <section className="video-hero-web" aria-label="PetMeta video promotions">
    <button className={`video-hero-media ${motion&&pulse?'video-hero-pulse':''}`} onClick={()=>onSelect(banner.target)} aria-label={`Open ${banner.name}`}>
      <video key={banner.slug} autoPlay muted loop playsInline preload="metadata" poster={`/hero-banners/${banner.slug}-poster.png`} aria-label={`${banner.name} promotion`}>
        <source src={`/hero-banners/${banner.slug}.mp4`} type="video/mp4"/>
      </video>
    </button>
    <div className="video-hero-controls">
      <button aria-label="Previous banner" onClick={()=>move(slide-1)}><ArrowLeft size={18}/></button>
      <span>{slide+1}/{banners.length}</span>
      <button aria-label="Next banner" onClick={()=>move(slide+1)}><ArrowRight size={18}/></button>
      <span className="video-hero-spacer"/>
      <button className={animation?'selected':''} aria-pressed={animation} onClick={()=>{setAnimation(!animation);if(!animation)move(slide+1)}}>{animation?<Play size={16}/>:<Pause size={16}/>} Animation</button>
      <button className={motion?'selected':''} aria-pressed={motion} onClick={()=>{setMotion(!motion);setPulse(!motion);if(!motion)window.setTimeout(()=>setPulse(false),280)}}><Sparkles size={16}/> Motion effect</button>
    </div>
  </section>;
}
