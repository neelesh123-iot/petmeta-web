'use client';
import {useEffect, useState} from 'react';
import {currentDeals,dealPrice,type DealCampaign} from './deal-campaign';
export {createDeals,DEAL_DURATION,DEAL_COUNT,dealPrice} from './deal-campaign';
export type {DealCampaign} from './deal-campaign';

export const DEAL_KEY = 'pm-bomb-deals-v1';
let volatileCampaign:DealCampaign|null=null;
export function readDeals():DealCampaign|null {
  try {
    const value = JSON.parse(localStorage.getItem(DEAL_KEY) || 'null');
    if (!value || !Number.isFinite(value.endsAt) || value.endsAt<=0 || !Array.isArray(value.ids) || !value.ids.every((id:unknown)=>typeof id==='string') || !Array.isArray(value.revealed) || !value.revealed.every((id:unknown)=>typeof id==='string')) return volatileCampaign;
    return volatileCampaign&&volatileCampaign.endsAt>=value.endsAt?volatileCampaign:value;
  } catch { return volatileCampaign; }
}
export function saveDeals(campaign:DealCampaign) {
  let saved=true;
  try{localStorage.setItem(DEAL_KEY,JSON.stringify(campaign));volatileCampaign=null;}
  catch{volatileCampaign=campaign;saved=false;}
  window.dispatchEvent(new Event('pm-store-change'));
  return saved;
}
export function ensureDeals(now=Date.now()) {
  const previous=readDeals(),campaign=currentDeals(previous,now);
  if(campaign!==previous)saveDeals(campaign);
  return campaign;
}
export function useDeals(){
  const [campaign,setCampaign]=useState<DealCampaign|null>(null);
  const [now,setNow]=useState(0);
  useEffect(()=>{
    const sync=()=>{const time=Date.now();setCampaign(ensureDeals(time));setNow(time);};
    window.addEventListener('pm-store-change',sync);window.addEventListener('storage',sync);
    window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
    sync();const timer=setInterval(sync,1000);
    return()=>{clearInterval(timer);window.removeEventListener('pm-store-change',sync);window.removeEventListener('storage',sync);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync);};
  },[]);
  return {campaign,now,price:(id:string,original:number)=>dealPrice(id,original,campaign,now)};
}
