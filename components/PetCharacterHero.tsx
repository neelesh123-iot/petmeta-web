'use client';

import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {ArrowLeft, ArrowRight, Pause, PawPrint, Play} from 'lucide-react';

const ANIMALS = [
  {name:'Dog', src:'/pet-hero/dog.webp', bg:'#F4845F', panel:'#F79B7F', title:'DOGS. BIG LOVE.', description:'Big personalities. Even bigger hearts. Meet your kind of happy.', target:'dogs', href:'/pets/dog'},
  {name:'Cat', src:'/pet-hero/cat.webp', bg:'#6BBF7A', panel:'#85CC92', title:'CATS. PURE CHARM.', description:'Curious souls. Main-character energy. A world for your favourite feline.', target:'cats', href:'/pets/cat'},
  {name:'Rabbit', src:'/pet-hero/rabbit.webp', bg:'#E882B4', panel:'#ED9DC4', title:'SMALL HOPS. BIG JOY.', description:'Soft ears, tiny noses, endless charm. Meet our smaller companions.', target:'rabbits', href:'/pets/rabbit'},
  {name:'Bird', src:'/pet-hero/bird.webp', bg:'#6EB5FF', panel:'#8DC4FF', title:'BIRDS. BRIGHT DAYS.', description:'A little colour. A world of wonder. Explore your pet’s happy place.', target:'Bird', href:'/pets/bird'},
  {name:'Fish', src:'/pet-hero/fish.webp', bg:'#439AA7', panel:'#67B2BC', title:'TINY FINS. BIG WONDER.', description:'A little shimmer. A calmer world. Discover your underwater companions.', target:'Fish', href:'/pets/fish'},
  {name:'Tortoise', src:'/pet-hero/tortoise.webp', bg:'#A18B52', panel:'#BBA66F', title:'SLOW DAYS. SWEET COMPANY.', description:'Small steps. A lifetime of character. Meet the gentle side of the family.', target:'Tortoise', href:'/pets/tortoise'},
] as const;
const ROTATION_INTERVAL = 5500;

export default function PetCharacterHero({onSelect}:{onSelect:(category:string)=>void}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const current = ANIMALS[activeIndex];

  useEffect(() => {
    ANIMALS.forEach(animal => {const img = new Image(); img.src = animal.src;});
    const hero = heroRef.current;
    const visibility = new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{threshold:.3});
    if(hero) visibility.observe(hero);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => {if(motion.matches)setAutoPlay(false);};
    reduce(); motion.addEventListener('change',reduce);
    return () => {visibility.disconnect(); motion.removeEventListener('change',reduce); if (timer.current) clearTimeout(timer.current);};
  }, []);

  useEffect(()=>{
    if(!autoPlay||hovered||!inView) return;
    let rotation:ReturnType<typeof setTimeout>|undefined;
    const schedule=()=>{if(rotation)clearTimeout(rotation);if(!document.hidden)rotation=setTimeout(()=>navigate('next'),ROTATION_INTERVAL);};
    schedule(); document.addEventListener('visibilitychange',schedule);
    return()=>{if(rotation)clearTimeout(rotation);document.removeEventListener('visibilitychange',schedule);};
  },[autoPlay,hovered,inView,activeIndex]);

  function navigate(direction:'next'|'prev') {
    if (locked.current) return;
    locked.current = true;
    setIsAnimating(true);
    setActiveIndex(index => (index + (direction === 'next' ? 1 : ANIMALS.length-1)) % ANIMALS.length);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    timer.current = setTimeout(() => {locked.current = false; setIsAnimating(false);}, duration);
  }

  function role(index:number) {
    if (index === activeIndex) return 'center';
    if (index === (activeIndex + ANIMALS.length-1) % ANIMALS.length) return 'left';
    if (index === (activeIndex + 1) % ANIMALS.length) return 'right';
    return 'back';
  }

  return <section
    className="pet-character-hero"
    ref={heroRef}
    aria-label="Meet the PetMeta family"
    aria-roledescription="carousel"
    style={{'--hero-bg':current.bg, '--hero-panel':current.panel} as CSSProperties}
    onMouseEnter={()=>setHovered(true)}
    onMouseLeave={()=>setHovered(false)}
    onFocusCapture={event=>{if(!(event.target as HTMLElement).closest('.pet-hero-rotation'))setAutoPlay(false);}}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(event.key === 'ArrowLeft' ? 'prev' : 'next');
      }
    }}
  >
    <div className="pet-hero-grain" aria-hidden="true"/>
    <div className="pet-hero-wordmark" aria-hidden="true">PET PALS</div>
    <div className="pet-hero-brand"><PawPrint size={18} strokeWidth={2}/><span>PETMETA<span>THE LITTLE THINGS. THE BIG LOVE.</span></span></div>
    <div className="pet-hero-edition" aria-hidden="true"><span>THE HAPPY FAMILY</span><b>0{activeIndex + 1}<i> / 0{ANIMALS.length}</i></b></div>
    <div className="pet-hero-stage" aria-hidden="true">
      <div className="pet-hero-pool"/>
      {ANIMALS.map((animal, index) => <div className="pet-hero-character" data-role={role(index)} data-animal={animal.name} key={animal.name}>
        <img src={animal.src} alt="" width={animal.name==='Fish'||animal.name==='Tortoise'?1254:1024} height={animal.name==='Fish'||animal.name==='Tortoise'?1254:1536} draggable={false} fetchPriority={index === 0 ? 'high' : 'auto'}/>
      </div>)}
    </div>
    <div className="pet-hero-copy">
      <div className="pet-hero-caption" aria-live={autoPlay?'off':'polite'} aria-atomic="true">
        <span className="pet-hero-kicker">MEET YOUR KIND OF HAPPY · {current.name.toUpperCase()}</span>
        <h1>{current.title}</h1>
        <p>{current.description}</p>
      </div>
      <div className="pet-hero-navigation">
        <button type="button" aria-label="Previous animal" aria-disabled={isAnimating} onClick={() => navigate('prev')}><ArrowLeft size={26} strokeWidth={2.25}/></button>
        <button type="button" aria-label="Next animal" aria-disabled={isAnimating} onClick={() => navigate('next')}><ArrowRight size={26} strokeWidth={2.25}/></button>
        <button type="button" className="pet-hero-rotation" aria-label={autoPlay?'Pause automatic rotation':'Start automatic rotation'} onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?<Pause size={17}/>:<Play size={17}/>}</button>
        <span className="pet-hero-counter" aria-hidden="true">0{activeIndex + 1} <span>— 0{ANIMALS.length}</span></span>
      </div>
    </div>
    <a className="pet-hero-discover" href={current.href} onClick={event => {event.preventDefault(); onSelect(current.target);}}>DISCOVER IT <ArrowRight strokeWidth={2.25}/></a>
    <span className="pet-hero-footnote" aria-hidden="true">A LITTLE CARE. A LOT OF LOVE.</span>
  </section>;
}
