'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {ArrowLeft,ArrowRight,Check,ChevronDown,Heart,PawPrint,Search,SlidersHorizontal,X} from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import Marketplace from './Marketplace';
import ProductDetails,{type ProductDetailItem} from './ProductDetails';
import {petCategories,petCategory,petProfiles,type PetProfile} from '@/lib/pet-catalog';

const price=(value:number)=>`₹${value.toLocaleString('en-IN')}`;
export default function PetCollectionPage({animal}:{animal?:string}) {
  const router=useRouter(),pathname=usePathname(),params=useSearchParams();
  const category=animal?petCategory(animal):undefined;
  const breed=params.get('breed')||'All';
  const [query,setQuery]=useState(''),[sort,setSort]=useState('featured'),[visible,setVisible]=useState(12),[savedOnly,setSavedOnly]=useState(false);
  const [saved,setSaved]=useState<string[]>([]),[selected,setSelected]=useState<PetProfile|null>(null),[error,setError]=useState('');
  const resultsRef=useRef<HTMLElement>(null);
  useEffect(()=>{const sync=()=>{try{const value=JSON.parse(localStorage.getItem('pm-market-saved')||'[]');setSaved(Array.isArray(value)?value:[]);}catch{setError('Saved favourites could not load on this browser.');}};sync();window.addEventListener('pm-store-change',sync);return()=>window.removeEventListener('pm-store-change',sync);},[]);
  useEffect(()=>{setVisible(12);setSelected(null);},[breed,query,sort,savedOnly]);
  const collection=petProfiles.filter(p=>!category||p.species===category.name);
  const breeds=Array.from(new Set(collection.map(p=>p.breed)));
  const matches=collection.filter(p=>(breed==='All'||p.breed===breed)&&(!savedOnly||saved.includes(p.id))&&`${p.name} ${p.species}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name):0);
  const type=category?.name==='Tortoise'?'profile':category?.name==='Fish'||category?.name==='Bird'?'type':'breed';
  function chooseBreed(value:string){const next=new URLSearchParams(params.toString());if(value==='All')next.delete('breed');else next.set('breed',value);router.push(`${pathname}${next.size?'?'+next.toString():''}`,{scroll:false});}
  function favourite(id:string){const next=saved.includes(id)?saved.filter(item=>item!==id):[...saved,id];try{localStorage.setItem('pm-market-saved',JSON.stringify(next));setSaved(next);setError('');window.dispatchEvent(new Event('pm-store-change'));}catch{setError('Could not save favourites. Check browser storage and try again.');}}
  function addProfile(amount:number){if(!selectedProduct||selectedProduct.species==='Tortoise')return false;try{const cart=JSON.parse(localStorage.getItem('pm-store-cart')||'{}');const next={...cart,[selectedProduct.id]:(Number(cart[selectedProduct.id])||0)+amount};localStorage.setItem('pm-store-cart',JSON.stringify(next));window.dispatchEvent(new Event('pm-store-change'));setError('');return true;}catch{setError('Could not save your cart. Check browser storage and try again.');return false;}}
  function viewCart(checkout=false){setSelected(null);requestAnimationFrame(()=>window.dispatchEvent(new Event(checkout?'pm-open-checkout':'pm-open-cart')));}
  function clear(){setQuery('');setSavedOnly(false);setSort('featured');chooseBreed('All');}
  const selectedProduct:ProductDetailItem|null=selected?{...selected,category:'pets',kind:'Example',description:`Illustrative ${selected.species.toLowerCase()} portrait from the PetMeta collection. Example price only; no live animal, caregiver or availability is connected.`,age:'Illustrative profile',city:'No live listing'}:null;
  return <div className="pet-directory">
    <header className="pet-directory-header"><Link href="/home" className="pet-directory-logo"><img src="/logo.jpg" alt="PetMeta home" width="120" height="60"/></Link><nav aria-label="Page navigation"><Link href="/home"><ArrowLeft size={16}/> Back to home</Link><button aria-pressed={savedOnly} onClick={()=>setSavedOnly(value=>!value)}><Heart size={18} fill={savedOnly?'#ffda27':'none'}/><span>Saved pets</span><b>{petProfiles.filter(p=>saved.includes(p.id)).length}</b></button></nav></header>
    <main className="pet-directory-main">
      <nav className="pet-directory-breadcrumb" aria-label="Breadcrumb"><Link href="/home">Home</Link><span>/</span>{category?<><Link href="/pets">Pets</Link><span>/</span><span aria-current="page">{category.plural}</span></>:<span aria-current="page">Pets</span>}</nav>
      <section className="pet-directory-intro"><div><span className="pet-directory-eyebrow">FIND YOUR KIND OF COMPANY</span><h1>{category?<>A little more <em>{category.name.toLowerCase()==='fish'?'wonder':category.name.toLowerCase()+' love'}.</em></>:<>Your next <em>favourite friend.</em></>}</h1><p>{category?`Explore ${category.plural.toLowerCase()}, choose a ${type} and meet the collection.`:'Start with a pet category. Then choose a breed and explore their portraits.'}</p></div>{category?<div className="pet-directory-intro-icon"><CategoryIcon index={petCategories.findIndex(item=>item.slug===category.slug)} animal/></div>:<PawPrint className="pet-directory-intro-paw" size={90} strokeWidth={1}/>}
      </section>
      <nav className="pet-directory-categories" aria-label="Pet categories">{petCategories.map((item,index)=><Link key={item.slug} href={`/pets/${item.slug}`} aria-current={category?.slug===item.slug?'page':undefined}><CategoryIcon index={index} animal/><span>{item.name}</span>{category?.slug===item.slug&&<Check size={15}/>}</Link>)}</nav>
      <section className="pet-directory-results" ref={resultsRef} aria-labelledby="pet-directory-title">
        <div className="pet-directory-results-heading"><div><span className="pet-directory-eyebrow">THE PETMETA COLLECTION</span><h2 id="pet-directory-title">{category?`${category.plural} to discover`:'Explore every little personality'}</h2></div><p>Illustrative portraits · Example prices</p></div>
        <div className="pet-directory-filters"><label className="pet-directory-breed"><SlidersHorizontal size={17}/><span>Choose a {type}</span><select aria-label={`Choose a ${type}`} value={breed} onChange={event=>chooseBreed(event.target.value)}><option value="All">All {type==='profile'?'profiles':type==='type'?'types':'breeds'} ({breeds.length})</option>{breeds.map(name=><option key={name}>{name}</option>)}</select></label><label className="pet-directory-search"><Search size={18}/><input aria-label="Search pets" placeholder={`Search ${category?.plural.toLowerCase()||'pets'}…`} value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button aria-label="Clear pet search" onClick={()=>setQuery('')}><X size={16}/></button>}</label><label className="pet-directory-sort"><span>Sort by</span><select aria-label="Sort pets" value={sort} onChange={event=>setSort(event.target.value)}><option value="featured">Featured</option><option value="name">Name: A–Z</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
        <div className="pet-directory-result-meta"><p role="status">{matches.length} {matches.length===1?'profile':'profiles'}{breed!=='All'?` · ${breed}`:''}{savedOnly?' · Saved pets':''}</p>{(breed!=='All'||query||savedOnly)&&<button onClick={clear}>Clear filters <X size={13}/></button>}{category?.name==='Tortoise'&&<span>Viewing only · Out of stock</span>}</div>
        {error&&<p className="pet-directory-error" role="alert">{error}</p>}
        <div className="pet-directory-grid">{matches.slice(0,visible).map((pet,index)=><article key={pet.id} className="pet-directory-card"><div className="pet-directory-photo"><button aria-label={`View ${pet.name} details`} onClick={()=>setSelected(pet)}><img src={pet.image} alt={pet.name} width="400" height="400" loading={index<4?'eager':'lazy'}/></button><button className="pet-directory-heart" aria-label={`Save ${pet.name}`} aria-pressed={saved.includes(pet.id)} onClick={()=>favourite(pet.id)}><Heart size={19} fill={saved.includes(pet.id)?'#ffda27':'none'}/></button>{pet.species==='Tortoise'&&<span>Out of stock</span>}</div><div className="pet-directory-card-copy"><span>{pet.species} · Photo profile</span><h3><button onClick={()=>setSelected(pet)}>{pet.name}</button></h3><div><b>{price(pet.price)}</b><small>example price</small></div><button className="pet-directory-details" onClick={()=>setSelected(pet)}>Meet this {pet.species.toLowerCase()} <ArrowRight size={17}/></button></div></article>)}</div>
        {!matches.length&&<div className="pet-directory-empty"><PawPrint size={40}/><h3>No little faces match just yet.</h3><p>Try another {type} or clear your search to explore the collection.</p><button onClick={clear}>Show all {category?.plural.toLowerCase()||'pets'} <ArrowRight size={16}/></button></div>}
        {visible<matches.length&&<button className="pet-directory-load" onClick={()=>setVisible(count=>count+12)}>Show more <span>{matches.length-visible} more profiles</span><ChevronDown size={17}/></button>}
        <p className="pet-directory-note">These are illustrative profiles, not live animal listings. Select a portrait to view its details.</p>
      </section>
    </main><footer className="pet-directory-footer"><PawPrint size={18}/><span>A LITTLE CARE. A LOT OF LOVE.</span><Link href="/home">Back to PetMeta <ArrowRight size={15}/></Link></footer>
    <Marketplace category="pets" query="" species="All" cartOnly/>
    {selectedProduct&&<ProductDetails key={selectedProduct.id} product={selectedProduct} price={selectedProduct.price} coupon={false} onCouponChange={()=>{}} saved={saved.includes(selectedProduct.id)} onSave={()=>favourite(selectedProduct.id)} onClose={()=>setSelected(null)} message={error} onAdd={addProfile} onBuy={amount=>{if(!addProfile(amount))return false;viewCart(true);return true;}} onViewCart={()=>viewCart()} petActions={<button className="pd-cart" onClick={()=>setSelected(null)}>Back to {category?.plural.toLowerCase()||'collection'} <ArrowRight size={17}/></button>}/>}
  </div>;
}
