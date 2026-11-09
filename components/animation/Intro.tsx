'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

export default function Intro({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const callback = useRef(onDone);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  callback.current = onDone;
  const finish = useCallback(() => { if (!done.current) { done.current = true; callback.current(); } }, []);
  // Use media time and ended, not a wall-clock timer: a slow video must not be skipped.
  useEffect(() => { video.current?.play().catch(() => setPaused(true)); }, []);
  return <div className="intro intro-clean" data-testid="intro">
    <video ref={video} src="/videos/petmeta-intro-v3.mp4" autoPlay muted={muted} playsInline preload="auto" onEnded={finish}
      onError={() => setFailed(true)} onPlaying={() => setPaused(false)}
      onTimeUpdate={event => { const media = event.currentTarget; setProgress(media.duration ? media.currentTime / media.duration : 0); }} />
    <button onClick={finish} className="skip">Skip intro <ArrowRight size={16} /></button>
    {!failed && <button className="intro-sound" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute intro video' : 'Mute intro video'}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>}
    {paused && !failed && <button className="intro-play button" onClick={() => video.current?.play()}>Play intro</button>}
    {failed && <div className="intro-fallback"><p>The intro video couldn’t load.</p><button className="button" onClick={finish}>Continue to sign in <ArrowRight size={18} /></button></div>}
    <div className="intro-timeline"><span style={{ transform: `scaleX(${progress})` }} /></div>
  </div>;
}

