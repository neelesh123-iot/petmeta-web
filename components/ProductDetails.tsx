'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import {ArrowLeft, ArrowRight, Bomb, Check, ChevronDown, Heart, Minus, PawPrint, Plus, ShoppingCart, Star, Tag, X} from 'lucide-react';
import {ensureDeals,saveDeals,useDeals} from '@/lib/bomb-deals';

export type ProductDetailItem = {id:string;name:string;category:string;species:string;price:number;mrp?:number;brand?:string;tile?:number;image?:string;icon?:string;description:string;breed?:string;age?:string;city?:string;contact?:string;local?:boolean;kind?:string;published?:boolean;owner?:string};
type Props = {product:ProductDetailItem;price:number;coupon:boolean;onCouponChange:(value:boolean)=>void;saved:boolean;onSave:()=>void;onClose:()=>void;onAdd:(amount:number)=>boolean;onBuy:(amount:number)=>boolean;onViewCart:()=>void;petActions?:ReactNode;message?:string};

export default function ProductDetails({product:p,price,coupon,onCouponChange,saved,onSave,onClose,onAdd,onBuy,onViewCart,petActions,message}:Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount,setAmount] = useState(1);
  const [offers,setOffers] = useState(true);
  const [added,setAdded] = useState(false);
  const [tab,setTab]=useState('overview');
  const [zoom,setZoom] = useState(false);
  const pet = p.category === 'pets';
  const {campaign,now}=useDeals();
  const inDeals=!pet&&!!campaign&&now<campaign.endsAt&&campaign.ids.includes(p.id);
  const dealActive=inDeals&&!!campaign?.revealed.includes(p.id)&&price<p.price;
  const seconds=campaign?Math.max(0,Math.ceil((campaign.endsAt-now)/1000)):0;
  const clock=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
  const outOfStock=pet&&p.species==='Tortoise';
  const purchasable = !pet || (price>0&&p.kind!=='Adoption');
  const mrp = p.mrp || p.price;
  const saving = Math.max(0,mrp-price);
  const subtotal = price*amount;
  const discount = !pet&&coupon ? Math.round(subtotal*.2) : 0;
  const payable = subtotal-discount;
  const currency = (value:number) => `₹${value.toLocaleString('en-IN')}`;

  useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();},[]);

  function close(){dialog.current?.close();}
  function unlock(){const current=ensureDeals();if(current.ids.includes(p.id)&&!current.revealed.includes(p.id))saveDeals({...current,revealed:[...current.revealed,p.id]});}

  function photo(className='') {
    return p.image ? <img className={className} src={p.image} alt={p.name} width="800" height="800"/> : p.tile!=null ? <div className={`pd-atlas ${className}`} role="img" aria-label={p.name} style={{backgroundImage:`url('${pet?'/breed-poses-v2.png':'/product-atlas.png'}')`,backgroundPosition:`${p.tile%4*100/3}% ${Math.floor(p.tile/4)*100/3}%`}}/> : <div className={`pd-placeholder ${className}`} role="img" aria-label={p.name}>{p.icon||<PawPrint size={90}/>}</div>;
  }

  return <dialog className={`product-details-screen${pet?' pd-pet-screen':''}`} ref={dialog} onClose={onClose} onCancel={event=>{if(zoom){event.preventDefault();setZoom(false);}}} aria-label={`${p.name} product details`}>
    <header className="pd-header" hidden={zoom}><button type="button" onClick={close} aria-label="Back to products"><ArrowLeft size={21}/><span>Back</span></button><a href="/home" aria-label="PetMeta home"><img src="/branding/petmeta-logo-v2.png" alt="PetMeta" width="110" height="42"/></a><div><button type="button" onClick={onSave} aria-label={saved?'Remove from wishlist':'Save to wishlist'} aria-pressed={saved}><Heart size={21} fill={saved?'#ffda27':'none'}/></button><button type="button" onClick={onViewCart} aria-label="View cart"><ShoppingCart size={21}/></button><button type="button" onClick={close} aria-label="Close product details"><X size={22}/></button></div></header>
    <main className="pd-layout" hidden={zoom}>
      <section className="pd-gallery" aria-label="Product image and information">
        <button className="pd-main-photo" type="button" onClick={()=>setZoom(true)} aria-label={`Enlarge ${p.name} photo`}>{photo()}{dealActive&&<b className="pd-photo-deal"><Bomb size={15}/> BOMB DEAL · {Math.round((1-price/p.price)*100)}% LESS</b>}<span>Explore the details · View full image <Plus size={15}/></span></button>
        <article className="pd-story"><div className="pd-story-mark"><PawPrint size={27} strokeWidth={1.6}/></div><div><span className="pd-eyebrow">THE PETMETA EDIT</span><h2>{pet?'A little companion. A lot of love.':'Thoughtful picks. Happier little lives.'}</h2><p>{p.species==='All'?'Every pet':p.species} <span>·</span> {pet?'Pet collection':p.category.replace(/^./,s=>s.toUpperCase())}</p></div></article>
        <article className="pd-description"><span className="pd-eyebrow">A CLOSER LOOK</span><h2>About {pet?'this companion':'this product'}</h2><p>{p.description}</p><dl><div><dt>Category</dt><dd>{p.category}</dd></div><div><dt>Pet type</dt><dd>{p.species==='All'?'All pets':p.species}</dd></div>{p.breed&&<div><dt>Breed</dt><dd>{p.breed}</dd></div>}{p.age&&<div><dt>Age</dt><dd>{p.age}</dd></div>}{p.city&&<div><dt>Location</dt><dd>{p.city}</dd></div>}<div><dt>Listing</dt><dd>{p.published?'Seller listing':p.local?'Your saved draft':'Illustrative catalogue'}</dd></div></dl></article>
      </section>
      <section className="pd-summary" aria-label="Product pricing and options">
        <div className="pd-brand">{pet?'PetMeta pet collection':`${p.brand||'PetMeta'} · ${p.category}`}</div>
        <h1>{p.name}</h1><p className="pd-subtitle">{p.species==='All'?'For all your little friends':`For ${p.species.toLowerCase()}${p.species==='Fish'?'':'s'}`} {p.breed&&`· ${p.breed}`}</p>
        <p className="pd-review"><Star size={16}/> No customer reviews yet</p>
        {inDeals&&<div className={`pd-deal-strip${dealActive?' is-unlocked':''}`}><span className="pd-deal-symbol"><Bomb size={23}/></span><div><b>{dealActive?'Your Bomb Deal is unlocked':'A surprise price drop awaits'}</b><small>{dealActive?`Save ${currency(p.price-price)} off the regular ${currency(p.price)} price`:'One of this window’s 10 surprise picks'}</small></div>{dealActive?<div className="pd-deal-clock"><span>ENDS IN</span><b aria-label={`Deal ends in ${clock}`}>{clock}</b></div>:<button type="button" onClick={unlock}>Unlock deal <ArrowRight size={14}/></button>}</div>}
        <div className="pd-price-panel"><span className="pd-eyebrow">{dealActive?'YOUR UNLOCKED PRICE':pet?'PROFILE PRICE':'A LITTLE LESS. A LITTLE MORE LOVE.'}</span><div className="pd-price"><strong>{price?currency(price):p.local||p.published?'Adoption':'Photo profile'}</strong>{saving>0&&<><del>{currency(mrp)}</del><span>{Math.round(saving/mrp*100)}% off</span></>}</div>
        <p className="pd-price-note">{pet?'Example price · Demo checkout only':'Preview catalogue price · Live stock is not connected'}</p>{saving>0&&!pet&&<span className="pd-price-saving">You save {currency(saving)} on the listed MRP</span>}</div>
        {!pet&&<section className="pd-offers" aria-label="Available offers"><button type="button" className="pd-offer-heading" onClick={()=>setOffers(value=>!value)} aria-expanded={offers} aria-controls="pd-coupon-offer"><Tag size={28}/><span><b>{coupon?'Your offer is applied':'A little extra happiness'}</b><small>{coupon?`${currency(payable)} for ${amount} item${amount===1?'':'s'}`:'Save 20% with PETMETA20'}</small></span><ChevronDown size={19} style={{transform:offers?'rotate(180deg)':'none'}}/></button>{offers&&<div id="pd-coupon-offer" className="pd-coupon"><div><span>COUPON · PREVIEW OFFER</span><b>PETMETA20</b><p>20% off your demo cart. {coupon&&`You save ${currency(discount)} on this selection.`}</p></div><button type="button" aria-pressed={coupon} onClick={()=>onCouponChange(!coupon)}>{coupon?<><Check size={15}/> Applied · Remove</>:'Apply'}</button></div>}</section>}
        <div className="pd-specification"><h2>{pet?'Profile information':'Product information'}</h2><p>{p.description}</p>{pet?<span className={p.species==='Tortoise'?'pd-out-of-stock':'pd-availability'}>{p.species==='Tortoise'?'Out of stock · Purchase unavailable':p.published?'Contact the seller for current availability':'Photo collection · No live availability'}</span>:<div className="pd-quantity"><span>Quantity</span><div><button type="button" onClick={()=>setAmount(value=>Math.max(1,value-1))} disabled={amount===1} aria-label="Decrease quantity"><Minus size={17}/></button><b aria-live="polite">{amount}</b><button type="button" onClick={()=>setAmount(value=>Math.min(20,value+1))} disabled={amount===20} aria-label="Increase quantity"><Plus size={17}/></button></div></div>}</div>
        {!pet&&<div className="pd-total"><span>Item total {coupon&&<small>20% coupon applied</small>}</span><strong>{currency(payable)}</strong></div>}
        <p className="pd-preview-note">{pet?'Demo checkout only. This illustrative profile does not reserve a real animal or collect payment. Availability must be confirmed with a real caregiver.':'Demo shopping preview. No money is collected; delivery and live payments are not connected.'}</p>
        {message&&<p className="pd-status" role="status">{message}</p>}
        <div className="pd-actions">{purchasable?<><button type="button" className="pd-cart" disabled={outOfStock} onClick={()=>{if(onAdd(amount))setAdded(true);}}><ShoppingCart size={21}/>{outOfStock?'Out of stock':added?'Add more':'Add to cart'}</button><button type="button" className="pd-buy" disabled={outOfStock} onClick={()=>onBuy(amount)}>Buy now <span>at {currency(payable)}</span></button></>:petActions}</div>
        {pet&&purchasable&&(p.local||p.published)&&petActions}
        {added&&<p className="pd-added" role="status"><Check size={16}/> Added to your cart. <button type="button" onClick={onViewCart}>View cart <ArrowRight size={14}/></button></p>}
      </section>
    </main>
    <section className="pd-explore" hidden={zoom}><div className="pd-explore-tabs" role="tablist" aria-label="Explore product details">{[['overview','Overview'],['facts',pet?'Profile details':'Specifications'],['gallery','Gallery']].map(([id,label])=><button key={id} id={`pd-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`pd-panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={event=>{const ids=['overview','facts','gallery'];if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const next=ids[(ids.indexOf(id)+(event.key==='ArrowRight'?1:2))%3];setTab(next);document.getElementById(`pd-tab-${next}`)?.focus();}}}>{label}</button>)}</div><div className="pd-explore-panel" role="tabpanel" id={`pd-panel-${tab}`} aria-labelledby={`pd-tab-${tab}`} tabIndex={0}>{tab==='overview'?<><span className="pd-eyebrow">A LITTLE MORE TO KNOW</span><h2>{pet?'A little companion. A lot of love.':'Made for their everyday happiness.'}</h2><p>{p.description}</p><div className="pd-reference-facts"><span><PawPrint size={21}/>{p.species==='All'?'All pets':p.species}</span><span><Tag size={21}/>{currency(price)} · example price</span><span><Check size={21}/>{outOfStock?'Out of stock':purchasable?'Demo checkout available':'Profile enquiry only'}</span></div></>:tab==='facts'?<><h2>{pet?'Profile at a glance':'Product at a glance'}</h2><dl><div><dt>Name</dt><dd>{p.name}</dd></div><div><dt>Pet type</dt><dd>{p.species}</dd></div>{p.breed&&<div><dt>Breed / profile</dt><dd>{p.breed}</dd></div>}<div><dt>Availability</dt><dd>{outOfStock?'Out of stock':p.published?'Confirm with caregiver':'Illustrative catalogue'}</dd></div></dl></>:<><h2>A closer look</h2><button className="pd-gallery-preview" aria-label={`Open ${p.name} gallery image`} onClick={()=>setZoom(true)}>{photo()}</button><p>Current catalogue image · Select to enlarge.</p></>}</div></section>
    {zoom&&<div className="pd-zoom" role="region" aria-label="Enlarged product image"><button type="button" autoFocus onClick={()=>setZoom(false)} aria-label="Close enlarged image"><X size={24}/></button>{photo()}</div>}
  </dialog>;
}
