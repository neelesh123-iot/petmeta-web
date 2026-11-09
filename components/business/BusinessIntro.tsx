'use client';
import {useRef,useState} from 'react';
import {ArrowRight,Volume2,VolumeX,Play} from 'lucide-react';
export default function BusinessIntro({onDone}:{onDone:()=>void}){
 const video=useRef<HTMLVideoElement>(null),finished=useRef(false);
 const [muted,setMuted]=useState(true),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false),[progress,setProgress]=useState(0);
 const finish=()=>{if(!finished.current){finished.current=true;onDone();}};
 return <div className="bm-film" data-testid="business-intro">
  <video ref={video} src="/business-assets/petmeta-intro.mp4" autoPlay muted={muted} playsInline preload="auto" onEnded={finish} onError={()=>setFailed(true)} onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)} onTimeUpdate={e=>setProgress(e.currentTarget.duration?e.currentTarget.currentTime/e.currentTarget.duration:0)}/>
  <div className="bm-film-brand"><img src="/business-assets/petmeta-logo.png" alt="PetMeta — India’s trusted pets all in one marketplace"/><span>BUSINESS</span></div>
  <div className="bm-film-controls"><button onClick={()=>setMuted(v=>!v)} aria-label={muted?'Unmute intro':'Mute intro'}>{muted?<VolumeX size={20}/>:<Volume2 size={20}/>}</button><button onClick={finish}>Continue<ArrowRight size={18}/></button></div>
  {paused&&!failed&&<button className="bm-film-play" onClick={()=>void video.current?.play()}><Play size={18}/>Play intro</button>}
  {failed&&<div className="bm-film-error"><p>The intro couldn’t load.</p><button onClick={finish}>Continue to sign in<ArrowRight size={18}/></button></div>}
  <div className="bm-film-progress" role="progressbar" aria-label="Intro progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><span style={{transform:`scaleX(${progress})`}}/></div>
 </div>;
}
