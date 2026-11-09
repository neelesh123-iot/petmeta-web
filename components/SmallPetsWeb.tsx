'use client';

import {useState} from 'react';
import {smallPetExamples} from '@/lib/small-pet-examples';

export default function SmallPetsWeb() {
  const [selected,setSelected]=useState<'Rabbit'|'Tortoise'>('Rabbit');
  const pets=smallPetExamples.filter(pet=>pet.species===selected);
  return <section className="small-pets" aria-labelledby="small-pets-title">
    <div className="shop-section-title"><div><span>MORE LITTLE COMPANIONS</span><h2 id="small-pets-title">Meet rabbits and tortoises</h2></div><small>Photo examples · No live availability</small></div>
    <p className="small-pets-intro">Explore the photos you shared. Example prices range from ₹3,000 to ₹6,000; a real caregiver must confirm any animal’s details and availability.</p>
    <div className="small-pets-tabs" role="group" aria-label="Choose a pet category">
      {(['Rabbit','Tortoise'] as const).map(name=><button key={name} type="button" className={selected===name?'selected':''} aria-pressed={selected===name} onClick={()=>setSelected(name)}>{name}s</button>)}
    </div>
    <div className="small-pets-gallery">
      {pets.map(pet=><article key={pet.id} className="small-pets-gallery-card">
        <button type="button" aria-label={`View ${pet.name} details`} onClick={()=>window.dispatchEvent(new CustomEvent('pm-open-product',{detail:pet}))}><img src={pet.image} alt={pet.name} loading="lazy"/></button>
        <div><h3>{pet.name}</h3><b>₹{pet.price.toLocaleString('en-IN')} <small>example price</small></b></div>
      </article>)}
    </div>
    <a className="small-pets-browse" href="#marketplace">Browse all pet profiles ↓</a>
  </section>;
}
