'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowRight, CalendarDays, X} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import CategoryIcon from './CategoryIcon';
import catalogue from '@/lib/home-discovery.json';
import TrainingDetails, {TrainingRequests} from './TrainingDetails';

const species = ['Dog','Cat','Rabbit','Tortoise','Fish','Bird'];
const services = ['Hospitals','Food','Accessories','Grooming','Adoption','Training','Acquire','More'];
type Program = typeof catalogue.training[number];
export default function HomeDiscovery({onSelect,onListings}:{onSelect:(category:string)=>void;onListings:(kind:string)=>void}) {
  const router=useRouter();
  const [more,setMore] = useState(false);
  const [training,setTraining] = useState(false);
  const [trainingAnimal,setTrainingAnimal] = useState('Dog');
  const [program,setProgram] = useState<Program|null>(null);
  const [requests,setRequests] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(()=>{const select=(event:Event)=>{const name=(event as CustomEvent<string>).detail;if(species.includes(name))router.push(`/pets/${name.toLowerCase()}`);};window.addEventListener('pm-browse-animal',select);return()=>window.removeEventListener('pm-browse-animal',select);},[router]);
  useEffect(()=>{const open=(event:Event)=>{const selected=catalogue.training.find(item=>item.id===(event as CustomEvent<string>).detail);if(selected){setRequests(false);setProgram(selected);setTraining(true);}};window.addEventListener('pm-open-training',open);return()=>window.removeEventListener('pm-open-training',open);},[]);
  useEffect(() => {
    const node = dialog.current;
    if ((training) && !node?.open) node?.showModal();
    else if (!training && node?.open) node.close();
    if (node?.open) {node.scrollTop=0; node.querySelector<HTMLButtonElement>('button')?.focus();}
  },[training,program,requests]);

  function close() {setTraining(false); setProgram(null); setRequests(false);}
  function service(index:number) {
    if (index === 5) {setProgram(null); setRequests(false); setTraining(true); return;}
    if (index === 7) {setMore(value=>!value); return;}
    if (index === 4 || index === 6) {onListings(index===4?'Adoption':'Sale'); return;}
    onSelect(['vet','food','accessories','grooming'][index]);
  }

  return <div className="home-discovery">
    <section className="discovery-section" id="pet-zone" aria-labelledby="pet-zone-title">
      <div className="discovery-heading"><div><span>EVERY LITTLE NEED, IN ONE PLACE</span><h2 id="pet-zone-title">Pet Zone</h2></div><button type="button" onClick={()=>setMore(value=>!value)} aria-label={more?'Show fewer Pet Zone services':'See all Pet Zone services'} aria-expanded={more} aria-controls="pet-zone-more">{more?'Show less':'See all'} <ArrowRight size={19}/></button></div>
      <div className="discovery-grid" aria-label="Pet Zone services">{services.map((name,index)=><button className="discovery-category" type="button" key={name} onClick={()=>service(index)} aria-expanded={index===7?more:undefined} aria-controls={index===7?'pet-zone-more':undefined}><CategoryIcon index={index}/><span>{name}</span></button>)}</div>
      {more&&<div className="discovery-more" id="pet-zone-more"><p>A little more for your pet.</p><button onClick={()=>onSelect('health')}>Health & wellness <ArrowRight size={17}/></button><button onClick={()=>window.dispatchEvent(new Event('pm-open-appointments'))}>My appointments <ArrowRight size={17}/></button><button onClick={()=>onSelect('offers')}>Offers & essentials <ArrowRight size={17}/></button><a href="/about">About PetMeta <ArrowRight size={17}/></a></div>}
    </section>
    <section className="discovery-section" id="pets-discovery" aria-labelledby="pets-discovery-title">
      <div className="discovery-heading"><div><span>FIND YOUR KIND OF COMPANY</span><h2 id="pets-discovery-title">Pets</h2></div><Link href="/pets" aria-label="See all pet categories">See all <ArrowRight size={19}/></Link></div>
      <div className="discovery-grid" aria-label="Pet categories">{species.map((name,index)=><Link className="discovery-category" href={`/pets/${name.toLowerCase()}`} key={name}><CategoryIcon index={index} animal/><span>{name}</span></Link>)}</div>
    </section>

    <dialog className={`discovery-dialog${training?' discovery-training-screen':''}`} ref={dialog} onClose={close} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}}} aria-label="Pet Training">
      <button type="button" className="discovery-dialog-close" aria-label="Close details" onClick={close}><X size={22}/></button>

      {training&&!program&&!requests&&<div className="discovery-training"><span className="discovery-eyebrow">HAPPIER PETS. BETTER BONDS.</span><div className="training-list-heading"><h2>Pet Training</h2><button onClick={()=>setRequests(true)}><CalendarDays size={17}/> My training requests</button></div><p>Explore positive training and enrichment routines for every pet.</p><div className="discovery-training-tabs" aria-label="Choose training animal">{species.map((name,index)=><button type="button" key={name} aria-pressed={trainingAnimal===name} onClick={()=>setTrainingAnimal(name)}><CategoryIcon index={index} animal/>{name}</button>)}</div><h3>Training programs for {trainingAnimal}</h3><p className="discovery-sample">Sample programs · Trainer availability is not connected</p><div className="discovery-program-grid">{catalogue.training.filter(item=>item.species===trainingAnimal).map(item=><article key={item.id}><button className="training-program-photo" aria-label={`View ${item.name} details`} onClick={()=>setProgram(item)}><img src={item.image} alt={`${item.species}: ${item.name}`} loading="lazy" width="400" height="300"/></button><div><h4>{item.name}</h4><p>{item.weeks} weeks · Sample program</p><b>₹{item.price.toLocaleString('en-IN')}</b><button className="discovery-primary" onClick={()=>setProgram(item)}>View details <ArrowRight size={16}/></button></div></article>)}</div></div>}
      {training&&program&&<TrainingDetails key={program.id} program={program} onBack={()=>setProgram(null)} onViewCart={()=>{close();requestAnimationFrame(()=>window.dispatchEvent(new Event('pm-open-cart')));}}/>}
      {training&&requests&&!program&&<TrainingRequests onBack={()=>setRequests(false)} onProgram={id=>{setRequests(false);setProgram(catalogue.training.find(item=>item.id===id)||null);}}/>}
    </dialog>
  </div>;
}
