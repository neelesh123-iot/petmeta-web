import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import RiderApp from '../components/rider/RiderApp';
import {screens,Screen} from '../components/rider/data';
import '../components/rider/rider.css';
function App(){const [screen,setScreen]=useState<Screen>('splash');const [menu,setMenu]=useState(false);const [trail,setTrail]=useState<Screen[]>([]);
const navigate=(s:Screen)=>{setTrail(t=>[...t,screen]);setScreen(s)};
useEffect(()=>{const back=()=>{if(menu){setMenu(false);return}setTrail(t=>{if(t.length){setScreen(t[t.length-1]);return t.slice(0,-1)}setMenu(true);return t})};window.addEventListener('rider-back',back);return()=>window.removeEventListener('rider-back',back)},[menu]);
return <div className="rd-root rd-frame-only rd-native"><RiderApp initial={screen} onNavigate={navigate}/><button className="rider-screen-button" aria-label="Explore 28 design screens" onClick={()=>setMenu(true)}>28 screens</button>{menu&&<div className="rider-screen-menu" role="dialog" aria-label="Rider design screens"><header><strong>PetMeta Rider</strong><button onClick={()=>setMenu(false)}>Close ×</button></header><p>Interactive app preview · sample orders</p>{screens.map(([id,title],i)=><button key={id} onClick={()=>{navigate(id);setMenu(false)}}><span>{String(i+1).padStart(2,'0')}</span>{title}</button>)}</div>}</div>}
createRoot(document.getElementById('root')!).render(<App/>);
