'use client';

import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {ContactShadows,Environment,Lightformer,OrbitControls,Sparkles,Trail,useAnimations,useGLTF} from '@react-three/drei';
import {Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {useReducedMotion} from 'framer-motion';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';

type SceneMode='hero'|'thinking'|'running';
type SceneProps={running?:boolean;kind?:'cat'|'dog';mode?:SceneMode;onReady?:()=>void};
function AnimatedPet({kind,mode,reduced,onReady}:{kind:'cat'|'dog';mode:SceneMode;reduced:boolean;onReady?:()=>void}){
 const path=mode==='running'?'/cat.glb':kind==='dog'?'/dog.glb':'/hero-pet.glb';
 const {scene,animations}=useGLTF(path);const model=useMemo(()=>clone(scene),[scene]);const {actions}=useAnimations(animations,model);
 const container=useRef<THREE.Group>(null);const root=useRef<THREE.Group>(null);const started=useRef<number|null>(null);const tapped=useRef(-100);const [celebrate,setCelebrate]=useState(false);const {viewport,clock}=useThree();const celebrationTimer=useRef<ReturnType<typeof setTimeout>>();
 useEffect(()=>{const action=actions[mode==='running'?'Run':'Idle'];if(!reduced&&action)action.reset().setEffectiveTimeScale(mode==='thinking'?1.8:1).fadeIn(.3).play();onReady?.();return()=>{action?.stop();clearTimeout(celebrationTimer.current)}},[actions,mode,reduced,onReady]);
 useFrame((state,delta)=>{
  if(!container.current||!root.current)return;if(started.current===null)started.current=state.clock.elapsedTime;
  const elapsed=state.clock.elapsedTime-started.current;const hopTime=state.clock.elapsedTime-tapped.current;const hop=!reduced&&hopTime<.8?Math.sin(hopTime/.8*Math.PI)*.4:0;
  if(mode==='running'){
   const extent=viewport.width/2+1.9;container.current.position.x=reduced?0:THREE.MathUtils.lerp(-extent,extent,Math.min(elapsed/5,1));container.current.position.y=reduced?0:Math.abs(Math.sin(elapsed*13))*.14;root.current.rotation.y=Math.PI/2;root.current.rotation.z=reduced?0:Math.sin(elapsed*13)*.018;
  }else{
   container.current.position.y=reduced?0:Math.sin(elapsed*1.9)*.09+hop;
   const spin=mode==='thinking'?Math.sin(elapsed*.65)*.6+(Math.floor(elapsed/5)%2?Math.PI*2:0):0;
   root.current.rotation.y=THREE.MathUtils.damp(root.current.rotation.y,reduced?0:spin,3,delta);root.current.rotation.z=reduced||mode==='hero'?0:Math.sin(elapsed*2.3)*.12;
   for(const side of [-1,1]){const pupil=model.getObjectByName('Pupil'+side);const eye=model.getObjectByName('Eye'+side);if(pupil){pupil.position.x=THREE.MathUtils.damp(pupil.position.x,reduced?0:state.pointer.x*.025,7,delta);pupil.position.y=THREE.MathUtils.damp(pupil.position.y,reduced?0:state.pointer.y*.015,7,delta)}if(eye){const phase=elapsed%5.6;eye.scale.y=!reduced&&phase>5.3?1-Math.sin((phase-5.3)/.3*Math.PI)*.94:1}}
  }
 });
 const pet=<group ref={container}><group ref={root} onClick={event=>{if(mode!=='hero')return;event.stopPropagation();tapped.current=clock.elapsedTime;setCelebrate(true);clearTimeout(celebrationTimer.current);celebrationTimer.current=setTimeout(()=>setCelebrate(false),1200)}}><primitive object={model} dispose={null}/></group>{celebrate&&!reduced&&<Sparkles count={25} scale={[2.3,2.6,1.5]} position={[0,1.2,0]} size={5} speed={1.8} color="#ffcf17"/>}</group>;
 return mode==='running'&&!reduced?<Trail width={1.4} length={5} decay={1.5} color="#fff6b3" attenuation={width=>width*width}>{pet}</Trail>:pet;
}
function Lighting(){return <><ambientLight intensity={.65}/><directionalLight position={[3,5,4]} intensity={2.2} color="#fff1d0"/><directionalLight position={[-4,3,-2]} intensity={1.5} color="#fff7e7"/><Environment resolution={128}><Lightformer intensity={2} position={[-3,4,3]} scale={[4,4,1]}/><Lightformer intensity={1.5} position={[3,2,-2]} rotation={[0,Math.PI/2,0]} scale={[3,4,1]}/></Environment></>}
export default function PetScene({running=false,kind='cat',mode=running?'thinking':'hero',onReady}:SceneProps){const reduced=!!useReducedMotion();return <Canvas dpr={[1,1.5]} camera={{position:mode==='running'?[0,1.7,7.5]:[0,1.4,5.1],fov:mode==='running'?43:34}} gl={{alpha:true,antialias:true}} aria-label={`${mode==='running'?'Running':'Interactive 3D'} ${kind}`}><Lighting/><Suspense fallback={null}><AnimatedPet kind={kind} mode={mode} reduced={reduced} onReady={onReady}/><ContactShadows position={[0,-.06,0]} opacity={.28} scale={mode==='running'?30:7} blur={2.8} far={3} resolution={256}/></Suspense>{mode!=='running'&&<OrbitControls enableZoom={false} enablePan={false} enableRotate={mode==='hero'} minPolarAngle={Math.PI/2.7} maxPolarAngle={Math.PI/1.95} target={[0,1.05,0]} autoRotate={!reduced&&mode==='hero'} autoRotateSpeed={1.8}/>}</Canvas>}
