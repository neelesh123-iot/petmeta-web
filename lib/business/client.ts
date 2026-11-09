import {auth,db} from '../firebase';
import {collection,doc,onSnapshot,query,where,type Unsubscribe} from 'firebase/firestore';
import {getStorage,ref,uploadBytesResumable,getDownloadURL,getBlob} from 'firebase/storage';
import {collectionNames,emptyBusiness,type Business,type CollectionName,type Media,type RecordItem,type Role} from './model';

export const BUSINESS_API=process.env.NEXT_PUBLIC_BUSINESS_API_URL||'https://petmeta-business-services.neeleshdodda56.chatgpt.site/businessApi';
export const BUSINESS_PORTAL='https://petmeta-business-e8470.web.app/portal.html';
export async function callBusiness<T=Record<string,unknown>>(action:string,payload:Record<string,unknown>={},businessId=''):Promise<T>{
  const user=auth.currentUser;if(!user)throw new Error('Sign in to continue.');
  const endpoint=['payment.link','payment.refund','customer.pay','finance.reconcile'].includes(action)?BUSINESS_API.replace(/businessApi$/,'businessPayments'):BUSINESS_API;
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await user.getIdToken()}`},body:JSON.stringify({action,businessId,payload}),signal:AbortSignal.timeout(45000)}).catch(()=>{throw new Error('The business service could not be reached. Check your connection and retry.');});
  const value=await response.json().catch(()=>({error:'The business service returned an invalid response.'}));
  if(!response.ok)throw new Error(value.error||'This action could not be completed.');return value as T;
}
const roleCollections:Record<Role,CollectionName[]>={Owner:collectionNames,'Branch Manager':['branches','pets','products','batches','doctors','orders','appointments','conversations','messages','notifications'],'Catalog Staff':['branches','pets','products','batches','notifications'],'Order Staff':['branches','orders','conversations','messages','notifications'],Receptionist:['branches','doctors','appointments','notifications'],Doctor:['branches','doctors','appointments','clinicalNotes','notifications']};
export function watchWorkspace(businessId:string,member:{role:Role;branchIds:string[]},onBusiness:(b:Business)=>void,onItems:(name:CollectionName,items:RecordItem[])=>void,onError:(error:Error)=>void):Unsubscribe{
  const stops:Unsubscribe[]=[];
  stops.push(onSnapshot(doc(db,'businesses',businessId),s=>{if(!s.metadata.fromCache&&s.exists())onBusiness({...emptyBusiness(),...s.data(),id:s.id} as Business);},onError));
  for(const name of roleCollections[member.role]){
    // Rules are not filters: non-owners query only assigned branches, doctors only their records.
    const base=collection(db,'businesses',businessId,name);
    const target=member.role==='Owner'?base:member.role==='Doctor'&&['appointments','clinicalNotes','doctors'].includes(name)?query(base,where(name==='doctors'?'userUid':'doctorUid','==',auth.currentUser!.uid)):member.branchIds.length?query(base,where('branchId','in',member.branchIds.slice(0,30))):query(base,where('branchId','==','__unassigned__'));
    stops.push(onSnapshot(target,s=>{if(!s.metadata.fromCache)onItems(name,s.docs.map(d=>({...d.data(),id:d.id} as RecordItem)));},onError));
  }
  return()=>stops.forEach(stop=>stop());
}
export async function uploadMedia(businessId:string,branchId:string,file:File,purpose:string,onProgress:(n:number)=>void):Promise<Media>{
  if(!auth.currentUser)throw new Error('Sign in to upload files.');
  if(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw new Error('Choose a PDF, JPG, PNG or WebP under 10 MB.');
  if(!BUSINESS_API.includes('cloudfunctions.net')){
    const token=await auth.currentUser.getIdToken(),body=new FormData();body.append('businessId',businessId);body.append('branchId',branchId||'registration');body.append('purpose',purpose);body.append('file',file);
    return new Promise<Media>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',BUSINESS_API.replace(/\/businessApi$/,'/upload'));xhr.timeout=120000;xhr.setRequestHeader('Authorization',`Bearer ${token}`);xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100));};xhr.onload=()=>{try{const value=JSON.parse(xhr.responseText);if(xhr.status<200||xhr.status>=300)reject(new Error(value.error||'File upload failed.'));else{onProgress(100);resolve(value);}}catch{reject(new Error('The file service returned an invalid response.'));}};xhr.onerror=()=>reject(new Error('File upload failed. Check your connection and retry.'));xhr.ontimeout=()=>reject(new Error('File upload timed out. Please retry.'));xhr.send(body);});
  }
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`business/${businessId}/${branchId||'registration'}/${auth.currentUser.uid}/${crypto.randomUUID()}-${safeName}`;
  const target=ref(getStorage(auth.app,'gs://petmeta-e8470.firebasestorage.app'),path);
  const task=uploadBytesResumable(target,file,{contentType:file.type,customMetadata:{purpose,ownerUid:auth.currentUser.uid,businessId,branchId}});
  await new Promise<void>((resolve,reject)=>task.on('state_changed',s=>onProgress(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,resolve));
  // Private documents never receive bearer-token download URLs.
  return {name:file.name,path,type:file.type,size:file.size,purpose,...(purpose==='Public photos'?{url:await getDownloadURL(target)}:{})};
}
export async function openPrivateMedia(media:Media){const blob=await getBlob(ref(getStorage(auth.app,'gs://petmeta-e8470.firebasestorage.app'),media.path));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}

