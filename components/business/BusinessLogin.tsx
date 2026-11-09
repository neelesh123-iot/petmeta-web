'use client';
import React,{Component,useState} from 'react';
import {Eye,EyeOff,LockKeyhole,Mail,UserRound,ArrowRight,ShieldCheck} from 'lucide-react';
import PhotoCat,{type CatMood} from '../three/PhotoCat';

class KittenFallback extends Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="bm-kitten-fallback" role="img" aria-label="PetMeta kitten"/>:this.props.children;}
}
type Props={register:boolean;busy:boolean;email:string;password:string;name:string;consent:boolean;onEmail:(v:string)=>void;onPassword:(v:string)=>void;onName:(v:string)=>void;onConsent:(v:boolean)=>void;onRegister:(v:boolean)=>void;onSubmit:(e:React.FormEvent)=>void;onReset:()=>void;onMobile:()=>void;onPolicy:()=>void;onContinue?:()=>void};
export default function BusinessLogin(p:Props){
 const [show,setShow]=useState(false),[focus,setFocus]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim());
 const mood:CatMood=p.busy?'anticipating':focus==='password'?'shy':focus==='name'?'curious':focus==='email'?(validEmail?'happy':'reading'):Object.keys(errors).length?'sad':'idle';
 const text=mood==='shy'?'Your password is private. I’ll look away.':mood==='reading'?'I’m following along.':mood==='happy'?'That looks purr-fect.':mood==='curious'?'What should I call you?':mood==='sad'?'Let’s try that again.':'A little care. A lot of love.';
 const change=(key:string,value:string,fn:(v:string)=>void)=>{setErrors(e=>{const n={...e};delete n[key];return n;});fn(value);};
 function submit(e:React.FormEvent){e.preventDefault();const next:Record<string,string>={};if(p.register&&!p.name.trim())next.name='Enter your name.';if(!validEmail)next.email='Enter a valid email address.';if(!p.password||p.register&&p.password.length<8)next.password=p.register?'Use at least 8 characters.':'Enter your password.';if(!p.consent)next.consent='Accept the terms and privacy acknowledgment to continue.';setErrors(next);if(!Object.keys(next).length)p.onSubmit(e);}
 return <div className="bm-auth-premium">
  <div className="bm-auth-heading"><span>PETMETA BUSINESS</span><h1>{p.register?'Your next chapter.':'Welcome back.'}</h1><p>A little care. A lot of possibility.</p></div>
  <div className="bm-auth-kitten" data-mood={mood}><KittenFallback><PhotoCat mood={mood}/></KittenFallback><span aria-live="polite">{text}</span></div>
  <section className="bm-login-card">
   <div className="bm-login-tabs" role="tablist" aria-label="Account access">{[true,false].map(register=><button key={String(register)} type="button" role="tab" aria-selected={p.register===register} disabled={p.busy} onClick={()=>{p.onRegister(register);setErrors({});setShow(false);}}>{register?'Register':'Sign in'}</button>)}</div>
   <h2>{p.register?'Create business account':'Sign in to your business'}</h2><p>One secure place for everything you care for.</p>
   <form onSubmit={submit} noValidate>
    {p.register&&<label htmlFor="bm-login-name">Your name<div className="bm-login-input"><UserRound size={18}/><input id="bm-login-name" autoComplete="name" value={p.name} disabled={p.busy} onFocus={()=>setFocus('name')} onBlur={()=>setFocus('')} onChange={e=>change('name',e.target.value,p.onName)} aria-invalid={!!errors.name}/></div>{errors.name&&<small role="alert">{errors.name}</small>}</label>}
    <label htmlFor="bm-login-email">Email address<div className="bm-login-input"><Mail size={18}/><input id="bm-login-email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" value={p.email} disabled={p.busy} onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')} onChange={e=>change('email',e.target.value,p.onEmail)} aria-invalid={!!errors.email}/></div>{errors.email&&<small role="alert">{errors.email}</small>}</label>
    <label htmlFor="bm-login-password">Password<div className="bm-login-input"><LockKeyhole size={18}/><input id="bm-login-password" type={show?'text':'password'} autoComplete={p.register?'new-password':'current-password'} placeholder={p.register?'At least 8 characters':'Your password'} value={p.password} disabled={p.busy} onFocus={()=>setFocus('password')} onBlur={()=>setFocus('')} onChange={e=>change('password',e.target.value,p.onPassword)} aria-invalid={!!errors.password}/><button type="button" aria-label={show?'Hide password':'Show password'} aria-pressed={show} disabled={p.busy} onPointerDown={e=>e.preventDefault()} onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>{errors.password&&<small role="alert">{errors.password}</small>}</label>
    {!p.register&&<button className="bm-login-link" type="button" disabled={p.busy} onClick={p.onReset}>Forgot password?</button>}
    <label className="bm-login-consent"><input type="checkbox" checked={p.consent} onChange={e=>p.onConsent(e.target.checked)}/><span>I accept the account terms and privacy acknowledgment.</span></label>{errors.consent&&<small role="alert">{errors.consent}</small>}
    <button className="bm-login-link" type="button" onClick={p.onPolicy}>Read terms & privacy</button>
    <button className="bm-login-submit" type="submit" disabled={p.busy}>{p.busy?'Connecting securely…':p.register?'Create account':'Sign in securely'}<ArrowRight size={19}/></button>
   </form>
   <div className="bm-login-safe"><ShieldCheck size={14}/> Protected with Firebase authentication</div>
   <button className="bm-login-link bm-login-mobile" type="button" onClick={p.onMobile}>Use mobile number</button>
   {p.onContinue&&<button className="bm-login-link" type="button" onClick={p.onContinue}>Continue with signed-in account</button>}
  </section>
 </div>;
}
