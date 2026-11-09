import {storeProducts} from './store-catalog';

export const DEAL_DURATION = 8 * 60 * 60 * 1000;
export type DealCampaign = {endsAt:number; ids:string[]; revealed:string[]};
const eligibleIds = [...new Set(storeProducts.map(product=>product.id))];
export const DEAL_COUNT = Math.min(10,eligibleIds.length);

export function createDeals(now=Date.now(),previous?:DealCampaign|null):DealCampaign {
  const ids = [...eligibleIds];
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const selected = ids.slice(0,DEAL_COUNT);
  // A new window must change the selection, even if the shuffle repeats a set.
  if(previous&&selected.every(id=>previous.ids.includes(id))){
    const replacement=ids.find(id=>!previous.ids.includes(id));
    if(replacement)selected[selected.length-1]=replacement;
  }
  // Keep the original eight-hour cadence when returning after a closed tab.
  const endsAt=previous&&previous.endsAt<=now
    ? previous.endsAt+(Math.floor((now-previous.endsAt)/DEAL_DURATION)+1)*DEAL_DURATION
    : now+DEAL_DURATION;
  return {endsAt,ids:selected,revealed:[]};
}

export function currentDeals(campaign:DealCampaign|null,now=Date.now()):DealCampaign {
  const valid=campaign&&campaign.ids.length===DEAL_COUNT&&new Set(campaign.ids).size===DEAL_COUNT&&campaign.ids.every(id=>eligibleIds.includes(id));
  return valid&&now<campaign.endsAt?campaign:createDeals(now,campaign);
}

export function dealPrice(id:string,original:number,campaign:DealCampaign|null,now=Date.now()) {
  if(!campaign||now>=campaign.endsAt||!campaign.revealed.includes(id))return original;
  const index=campaign.ids.indexOf(id);
  return index<0?original:Math.max(1,Math.round(original*(1-(20+index%5*5)/100)));
}
