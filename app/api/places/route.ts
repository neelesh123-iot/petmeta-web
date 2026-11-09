export async function POST(req:Request){

 try{
 const {lat,lng,kind}=await req.json();
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return Response.json({error:'Invalid location'},{status:400});
 if(!process.env.GOOGLE_MAPS_API_KEY)return osmNearby(lat,lng,kind);
 const result=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':process.env.GOOGLE_MAPS_API_KEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.googleMapsUri,places.nationalPhoneNumber'},body:JSON.stringify({textQuery:kind==='vet'?'veterinary clinic':kind==='shops'?'pet store':'pet grooming salon',pageSize:12,locationBias:{circle:{center:{latitude:lat,longitude:lng},radius:10000}}}),signal:AbortSignal.timeout(12000)});
 if(!result.ok)return Response.json({error:'Google nearby search is unavailable. Check the Maps API configuration.'},{status:502});
 const data=await result.json();const rad=(n:number)=>n*Math.PI/180;
 const places=(data.places||[]).filter((p:any)=>p.location).map((p:any)=>{const a=Math.sin(rad(p.location.latitude-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(p.location.latitude))*Math.sin(rad(p.location.longitude-lng)/2)**2;return {...p,phone:p.nationalPhoneNumber,distance:6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}}).sort((a:any,b:any)=>a.distance-b.distance);
 return Response.json({places});
 }catch{return Response.json({error:'Nearby search could not load. Please try again.'},{status:502})}
}

const cache=new Map<string,{time:number;data:any}>();let lastQuery=0;
async function osmNearby(lat:number,lng:number,kind:string){
 const key=[lat.toFixed(2),lng.toFixed(2),kind].join(':');const hit=cache.get(key);if(hit&&Date.now()-hit.time<600000)return Response.json(hit.data);
 if(Date.now()-lastQuery<3000)return Response.json({error:'Please wait a few seconds before searching again.'},{status:429});lastQuery=Date.now();
 const tags=kind==='vet'?['["amenity"="veterinary"]']:kind==='shops'?['["shop"="pet"]']:['["shop"="pet_grooming"]','["pet"="grooming"]'];
 const query='[out:json][timeout:20];('+tags.map(t=>'nwr(around:10000,'+lat+','+lng+')'+t+';').join('')+');out center tags;';
 try{const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PetMetaLocalPreview/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error();const data=await r.json();const rad=(n:number)=>n*Math.PI/180;const places=(data.elements||[]).filter((e:any)=>e.tags?.name).map((e:any)=>{const t=e.tags,a=e.lat??e.center?.lat,b=e.lon??e.center?.lon;const h=Math.sin(rad(a-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(a))*Math.sin(rad(b-lng)/2)**2;return {id:e.type+'-'+e.id,displayName:{text:t.name},formattedAddress:[t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(', ')||'Address not listed',location:{latitude:a,longitude:b},distance:6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)),phone:t.phone||t['contact:phone'],googleMapsUri:'https://www.openstreetmap.org/'+e.type+'/'+e.id,source:'OpenStreetMap'};}).filter((p:any)=>Number.isFinite(p.distance)).sort((a:any,b:any)=>a.distance-b.distance).slice(0,20);const result={places,source:'OpenStreetMap',notice:'Community directory · Coverage may be incomplete. Contact providers to confirm services.'};if(cache.size>100)cache.clear();cache.set(key,{time:Date.now(),data:result});return Response.json(result);}catch{return Response.json({error:'Nearby directory is temporarily unavailable. Use the map search link or retry later.'},{status:502})}
}
