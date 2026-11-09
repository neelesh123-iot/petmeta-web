'use client';
import { useRef, useState } from 'react';
import { Maximize, Volume2, VolumeX, RotateCcw } from 'lucide-react';
export default function RunningTransition({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  return <section className="welcome-film" data-testid="running-transition" aria-label="Welcome to PetMeta">
    <video ref={video} src="/opening-reference.mp4" autoPlay muted={muted} playsInline onEnded={() => { setEnded(true); onDone(); }} onError={() => setFailed(true)} onPause={() => setPaused(true)} onPlaying={() => setPaused(false)} />
    <div className="film-controls">
      <button aria-label={muted ? 'Unmute video' : 'Mute video'} onClick={() => setMuted(!muted)}>{muted ? <VolumeX/> : <Volume2/>}</button>
      <button aria-label="Full screen" onClick={() => video.current?.parentElement?.requestFullscreen().catch(() => {})}><Maximize/></button>
      {ended && <button aria-label="Replay animation" onClick={() => { setEnded(false); if(video.current){video.current.currentTime=0;void video.current.play();} }}><RotateCcw/></button>}
    </div>
    {paused && !ended && !failed && <button className="film-play" onClick={() => video.current?.play()}>Play animation</button>}
    {failed && <div className="intro-fallback"><p>The video could not load.</p><button onClick={() => video.current?.load()}>Retry video</button></div>}
  </section>;
}

