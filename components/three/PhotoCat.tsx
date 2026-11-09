'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

export type CatMood = 'idle' | 'curious' | 'reading' | 'shy' | 'sad' | 'happy' | 'joyful' | 'anticipating' | 'sleepy';
const frames: Record<CatMood, number> = { idle: 0, curious: 1, reading: 2, shy: 3, sad: 4, happy: 5, joyful: 6, anticipating: 7, sleepy: 8 };

// The photograph-derived poses are sampled from a local atlas. Chroma keying is
// performed at render time, preserving the generated source file unchanged.
const fragmentShader = `
  uniform sampler2D atlas;
  uniform float previousFrame, nextFrame, blend, time, blink, energy;
  uniform vec2 gaze;
  varying vec2 vUv;
  vec4 pose(float index, vec2 p) {
    bool openEyes = index < 3.0 || (index > 4.5 && index < 7.5);
    float head = 1.0 - smoothstep(0.38, 0.56, p.y);
    p.x -= gaze.x * 0.008 * head;
    p.y -= sin(time * 1.8) * 0.003 * energy * (1.0 - smoothstep(0.4, 0.9, p.y));
    // Independent tail sway in the lower right, and very small ear movement.
    float tail = smoothstep(0.61, 0.79, p.x) * smoothstep(0.61, 0.80, p.y);
    p.y += sin(time * (2.2 + energy)) * 0.012 * tail * energy;
    float ears = (1.0 - smoothstep(0.06, 0.22, p.y));
    p.x += sin(time * 1.1 + p.x * 8.0) * 0.003 * ears * energy;
    if (openEyes) {
      vec2 leftEye = vec2(0.417, 0.305);
      vec2 rightEye = vec2(0.578, 0.325);
      if (index > 0.5) { leftEye = vec2(0.42, 0.33); rightEye = vec2(0.58, 0.34); }
      float l = 1.0 - smoothstep(0.025, 0.065, distance(p, leftEye));
      float r = 1.0 - smoothstep(0.025, 0.065, distance(p, rightEye));
      p -= gaze * 0.009 * (l + r);
      p.y += ((p.y - leftEye.y) * l + (p.y - rightEye.y) * r) * blink * 3.5;
    }
    vec2 cell = vec2(mod(index, 3.0), floor(index / 3.0));
    vec2 uv = vec2((cell.x + clamp(p.x, 0.002, 0.998)) / 3.0, 1.0 - (cell.y + clamp(p.y, 0.002, 0.998)) / 3.0);
    vec4 color = texture2D(atlas, uv);
    float green = color.g - max(color.r, color.b);
    float alpha = 1.0 - smoothstep(0.05, 0.30, green);
    color.g = min(color.g, max(color.r, color.b) + 0.015);
    return vec4(color.rgb, alpha);
  }
  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y);
    vec4 a = pose(previousFrame, p);
    vec4 b = pose(nextFrame, p);
    float opacity = mix(a.a, b.a, blend);
    vec3 rgb = mix(a.rgb * a.a, b.rgb * b.a, blend) / max(opacity, 0.001);
    gl_FragColor = vec4(rgb, opacity);
    if (gl_FragColor.a < 0.015) discard;
  }
`;

function PhotoPuppet({ mood, reduced, onReady }: { mood: CatMood; reduced: boolean; onReady?: () => void }) {
  const texture = useTexture('/cat-moods.png');
  const { camera, size } = useThree();
  useEffect(() => { (camera as THREE.OrthographicCamera).zoom = Math.min(size.width, size.height) / 3.8; camera.updateProjectionMatrix(); }, [camera, size]);
  const mesh = useRef<THREE.Mesh>(null);
  const gaze = useRef(new THREE.Vector2());
  const lastFrame = useRef(frames[mood]);
  const uniforms = useMemo(() => ({
    atlas: { value: texture }, previousFrame: { value: frames[mood] }, nextFrame: { value: frames[mood] },
    blend: { value: 1 }, time: { value: 0 }, blink: { value: 0 }, energy: { value: 1 }, gaze: { value: new THREE.Vector2() },
  // Only a new texture requires new uniform objects; mood changes update them below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [texture]);
  useEffect(() => { onReady?.(); }, [onReady]);
  useEffect(() => {
    uniforms.previousFrame.value = lastFrame.current;
    uniforms.nextFrame.value = frames[mood];
    uniforms.blend.value = reduced ? 1 : 0;
    lastFrame.current = frames[mood];
  }, [mood, reduced, uniforms]);
  useEffect(() => {
    const move = (event: PointerEvent) => gaze.current.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    uniforms.time.value = reduced ? 0 : t;
    uniforms.blend.value = Math.min(1, uniforms.blend.value + delta / 0.38);
    uniforms.gaze.value.lerp(reduced ? new THREE.Vector2() : gaze.current, Math.min(1, delta * 7));
    const blinkPhase = t % 5.8;
    uniforms.blink.value = reduced ? 0 : blinkPhase > 5.5 ? Math.sin((blinkPhase - 5.5) / 0.3 * Math.PI) : 0;
    uniforms.energy.value = mood === 'sad' || mood === 'sleepy' ? 0 : mood === 'happy' || mood === 'joyful' ? 1.8 : 1;
    if (mesh.current && !reduced) {
      const targetTilt = mood === 'curious' ? -0.045 : mood === 'sad' ? 0.035 : gaze.current.x * -0.012;
      mesh.current.rotation.z = THREE.MathUtils.damp(mesh.current.rotation.z, targetTilt, 8, delta);
      mesh.current.position.y = mood === 'joyful' ? Math.abs(Math.sin(t * 6)) * 0.11 : Math.sin(t * 1.6) * 0.012;
      const scale = mood === 'anticipating' || mood === 'curious' ? 1.025 : 1;
      mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x, scale, 8, delta));
    }
  });
  return <mesh ref={mesh}>
    <planeGeometry args={[3.6, 3.6, 1, 1]} />
    <shaderMaterial uniforms={uniforms} vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }" fragmentShader={fragmentShader} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}

export default function PhotoCat({ mood, onReady }: { mood: CatMood; onReady?: () => void }) {
  const reduced = !!useReducedMotion();
  return <Canvas orthographic camera={{ position: [0, 0, 5], zoom: 90 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} aria-label={`Kitten feeling ${mood}`}>
    <Suspense fallback={null}><PhotoPuppet mood={mood} reduced={reduced} onReady={onReady} /></Suspense>
  </Canvas>;
}

