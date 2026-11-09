'use client';
import {useCallback,useEffect,useState} from 'react';
import {onAuthStateChanged,type User} from 'firebase/auth';
import {auth} from '../../lib/firebase';
import {callBusiness,watchWorkspace} from '../../lib/business/client';
import {demoWorkspace} from '../../lib/business/demo';
import {createRecord,emptyWorkspace,type CollectionName,type RecordItem,type Role,type Workspace} from '../../lib/business/model';
type Member={role:Role;branchIds:string[]};
type Snapshot={business:Workspace['business'];collections:Partial<Workspace['collections']>};
const withDeadline=<T,>(task:Promise<T>,ms=20000):Promise<T>=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Business connection timed out. Check your internet and retry.')),ms);task.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
export function useWorkspace(){
 const [syncError,setSyncError]=useState('');
 const [user,setUser]=useState<User|null>(null),[preview,setPreview]=useState(false),[data,setData]=useState<Workspace>(emptyWorkspace),[member,setMember]=useState<Member>({role:'Owner',branchIds:[]}),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[authReady,setAuthReady]=useState(false);
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);}),[]);
 useEffect(()=>{
  if(!user||preview)return;
  const reconnect=()=>{if(document.visibilityState==='visible'&&navigator.onLine)setRetry(v=>v+1);};
  window.addEventListener('online',reconnect);document.addEventListener('visibilitychange',reconnect);
  return()=>{window.removeEventListener('online',reconnect);document.removeEventListener('visibilitychange',reconnect);};
 },[user,preview]);
 useEffect(()=>{if(!preview)return;try{const saved=localStorage.getItem('petmeta-business-preview-v2');setData(saved?JSON.parse(saved):demoWorkspace());}catch{setData(demoWorkspace());}setMember({role:'Owner',branchIds:['jubilee','banjara']});setError('');setLoading(false);},[preview]);
 useEffect(()=>{if(preview&&data.business.id==='preview')try{localStorage.setItem('petmeta-business-preview-v2',JSON.stringify(data));}catch{setError('Preview storage is full. Remove large preview attachments or reset the preview.');}},[preview,data]);
 useEffect(()=>{
  if(preview)return;if(!user){setData(emptyWorkspace());setLoading(false);return;}let active=true,stop:(()=>void)|undefined;setLoading(true);setError('');setData(emptyWorkspace());
  withDeadline((async()=>{
   const opened=await callBusiness<{businessId:string;member:Member}>('workspace.open');
   const snapshot=await callBusiness<Snapshot>('workspace.snapshot',{},opened.businessId);
   return {opened,snapshot};
  })()).then(({opened,snapshot})=>{
   if(!active)return;setMember(opened.member);
   setData({...emptyWorkspace(),business:{...emptyWorkspace().business,...snapshot.business},collections:{...emptyWorkspace().collections,...snapshot.collections}});
   setLoading(false);setSyncError('');
   try{stop=watchWorkspace(opened.businessId,opened.member,b=>{if(active)setData(d=>({...d,business:b}));},(name,items)=>{if(active)setData(d=>({...d,collections:{...d.collections,[name]:items}}));},e=>{if(active)setSyncError(e.message);});}catch(e){setSyncError((e as Error).message);}
  }).catch(e=>{if(active){setError(e.message);setLoading(false);}});
  return()=>{active=false;stop?.();};
 },[user,preview,retry]);
 const refresh=useCallback(async()=>{
  const id=data.business.id;if(!user||preview||!id)return;
  try{const snapshot=await withDeadline(callBusiness<Snapshot>('workspace.activity',{},id),15000);
   setData(current=>current.business.id===id?{...current,collections:{...current.collections,...snapshot.collections}}:current);setSyncError('');
  }catch(e){setSyncError((e as Error).message);}
 },[user,preview,data.business.id]);
 useEffect(()=>{if(!user||preview||!data.business.id)return;const timer=setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)void refresh();},15000);return()=>clearInterval(timer);},[user,preview,data.business.id,refresh]);
 const send=useCallback(async(action:string,payload:Record<string,unknown>={}):Promise<Record<string,unknown>>=>{
  if(!preview)return callBusiness(action,payload,data.business.id);
  let result:Record<string,unknown>={saved:true};
  // Deliberately isolated preview reducer: never sends customer data or simulates authentication.
  setData(current=>{
   const d=structuredClone(current),c=d.collections,p=payload as Record<string,any>,now=new Date().toISOString();
   const update=(kind:CollectionName,id:string,patch:Partial<RecordItem>)=>{const index=c[kind].findIndex(r=>r.id===id);if(index>=0)c[kind][index]={...c[kind][index],...patch,updatedAt:now};};
   if(action==='business.save')Object.assign(d.business,{identity:p.identity,facility:p.facility,categories:p.categories,activities:p.activities,photos:p.photos,facilityPhotos:p.facilityPhotos||[],facilityAttachments:p.facilityAttachments||[],name:p.identity['Public business name'],updatedAt:now});
   else if(action==='business.submit')Object.assign(d.business,{status:'Submitted',submittedAt:now,reviewReason:''});
   else if(action==='business.closure')d.business.closed=!!p.closed;
   else if(action==='record.save'){
    const kind=p.collection as CollectionName;const id=p.id||crypto.randomUUID();const prior=c[kind].find(r=>r.id===id);const name=p.fields['Pet name']||p.fields['Product name']||p.fields['Branch name']||p.fields['Professional name']||p.fields['Document type']||p.fields.Description?.slice(0,60)||p.fields['Batch number']||'New record';
    const value={...createRecord(name,p.branchId),...prior,id,name,fields:p.fields,photos:p.photos||[],attachments:p.attachments||[],status:p.submit?(kind==='support'?'Submitted':'Under review'):'Draft',reviewStatus:p.submit?'Under review':'Draft',updatedAt:now,...(kind==='branches'?{branchId:id}:{}),...(kind==='doctors'&&!prior?{affiliation:'Pending affiliation'}:{})};if(prior)update(kind,id,value);else c[kind].push(value);result={id,status:value.status};
   }
   else if(action==='inventory.adjust'){const batch=c.batches.find(b=>b.id===p.id);if(batch)update('batches',p.id,{fields:{...batch.fields,Quantity:String(p.quantity),Quarantined:p.quarantined?'yes':'no'}});}
   else if(action==='pet.availability'){update('pets',p.id,{status:p.status,reservation:p.status==='Reserved'?{fields:p.fields,createdAt:now}:null});}
   else if(action==='order.transition')update('orders',p.id,{status:p.status});
   else if(action==='payment.cash'){const order=c.orders.find(o=>o.id===p.id);if(order){update('orders',p.id,{fields:{...order.fields,'Payment status':'Received'}});c.transactions.push({...createRecord('Store payment',order.branchId),status:'Payment received',amount:order.amount,fields:{Amount:String(order.amount),Order:order.id}});}}
   else if(action==='payment.link')result={preview:true};
   else if(action==='payment.refund')result={preview:true};
   else if(action==='appointment.transition')update('appointments',p.id,{status:p.status});
   else if(action==='appointment.reschedule'){const a=c.appointments.find(a=>a.id===p.id);if(a)update('appointments',p.id,{fields:{...a.fields,Date:p.date,Time:p.time,Doctor:p.doctorId}});}
   else if(action==='appointment.book'){const id=crypto.randomUUID(),doctor=c.doctors.find(v=>v.id===p.doctorId);c.appointments.push({...createRecord(p.petName,p.branchId),id,status:'Confirmed',doctorUid:'preview',fields:{'Pet name':p.petName,'Pet parent':p.name,Service:p.service,Doctor:p.doctorId,Date:p.date,Time:p.time,Duration:doctor?.fields['Consultation duration']||'30','Payment status':'Unpaid'}});result={id};}
   else if(action==='clinical.save'){const a=c.appointments.find(v=>v.id===p.id);if(a){const value={...createRecord('Consultation summary',a.branchId),id:p.id,fields:{Note:p.note},shared:p.shared,doctorUid:'preview',status:'Saved'};const index=c.clinicalNotes.findIndex(n=>n.id===p.id);if(index>=0)c.clinicalNotes[index]=value;else c.clinicalNotes.push(value);}}
   else if(action==='doctor.availability'){const doctor=c.doctors.find(v=>v.id===p.id);if(doctor)update('doctors',p.id,{fields:{...doctor.fields,...p.fields}});}
   else if(action==='message.send'){const conversation=c.conversations.find(v=>v.id===p.id);if(conversation){c.messages.push({...createRecord(p.text,conversation.branchId),fields:{Text:p.text,Conversation:p.id,Sender:'Business'},conversationId:p.id,senderUid:'preview',status:'Local preview',attachments:p.attachments||[]});update('conversations',p.id,{fields:{...conversation.fields,'Last message':p.text,'Enquiry status':'Responded','Unread count':'0'}});}}
   else if(action==='conversation.status'||action==='conversation.read'){const v=c.conversations.find(v=>v.id===p.id);if(v)update('conversations',p.id,{fields:{...v.fields,...(action.endsWith('status')?{'Enquiry status':p.status}:{'Unread count':'0'})}});}
   else if(action==='notifications.read')c.notifications=c.notifications.map(n=>({...n,fields:{...n.fields,Read:'yes'},status:'Read'}));
   else if(action==='member.remove')update('members',p.id,{status:'Removed'});
   else if(action==='invitation.create'){c.invitations.push({...createRecord(p.email,p.branchIds[0]),fields:{Email:p.email,Role:p.role},status:'Pending',role:p.role,branchIds:p.branchIds});result={preview:true};}
   else if(action==='business.closeAccount')d.business.status='Closed';
   return d;
  });
  // Let React commit the isolated preview reducer before the next navigation.
  await new Promise(resolve=>setTimeout(resolve,0));return result;
 },[preview,data.business.id]);
 return {syncError,refresh,user,authReady,preview,setPreview,data,member,loading,error,setError,send,retry:()=>setRetry(v=>v+1),resetPreview:()=>setData(demoWorkspace())};
}
