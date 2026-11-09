type NativeReply={id?:string;ok?:boolean;result?:Record<string,unknown>;error?:string};
declare global {interface Window {PetMetaNative?:{postMessage:(message:string)=>void;onmessage?:((event:{data:string})=>void)|null};}}
const pending=new Map<string,{resolve:(result:Record<string,unknown>)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
export function nativeAvailable(){return typeof window!=='undefined'&&!!window.PetMetaNative;}
export function nativeRequest(action:string,payload:Record<string,unknown>={}):Promise<Record<string,unknown>>{
 if(!window.PetMetaNative)return Promise.reject(new Error('Android integration is unavailable.'));
 window.PetMetaNative.onmessage=event=>{let reply:NativeReply;try{reply=JSON.parse(event.data);}catch{return;}if(!reply.id){window.dispatchEvent(new CustomEvent('petmeta-native-auth',{detail:reply}));return;}const request=pending.get(reply.id);if(!request)return;clearTimeout(request.timer);pending.delete(reply.id);if(reply.ok)request.resolve(reply.result||{});else request.reject(new Error(reply.error||'Android action could not complete.'));};
 const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Android request timed out. Retry when you are ready.'));},120000);pending.set(id,{resolve,reject,timer});window.PetMetaNative!.postMessage(JSON.stringify({id,action,payload}));});
}
export async function exportCsv(filename:string,csv:string){if(nativeAvailable()){await nativeRequest('export.csv',{filename,csv});return;}const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
