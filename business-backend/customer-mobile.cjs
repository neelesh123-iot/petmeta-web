'use strict';
const P=require('./policy.cjs');
module.exports=({db,ref,record,now})=>async function customerMobile(user,action,id,payload){
 const rows=s=>s.docs.map(d=>({id:d.id,...d.data()}));
 if(action==='customer.directory')return {businesses:rows(await db.collection('publicBusinesses').limit(100).get()).filter(b=>!b.closed)};
 P.assert(/^[a-zA-Z0-9_-]{1,128}$/.test(id),'Choose a published business.');
 if(action==='customer.activity'){
  const [orders,appointments]=await Promise.all(['orders','appointments'].map(kind=>db.collection(`businesses/${id}/${kind}`).where('customerUid','==',user.uid).limit(100).get()));
  return {orders:rows(orders),appointments:rows(appointments)};
 }
 const business=await db.doc(`publicBusinesses/${id}`).get();P.assert(business.exists&&!business.data().closed,'This business is not accepting requests.',409);
 if(action==='customer.catalog'){
  const [branches,products,doctors]=await Promise.all(['publicBranches','publicProducts','publicDoctors'].map(kind=>db.collection(`publicBusinesses/${id}/${kind}`).limit(150).get()));
  return {business:{id,...business.data()},branches:rows(branches),products:rows(products),doctors:rows(doctors)};
 }
 P.assert(action==='customer.requestBooking','Unknown customer action.');
 const branchId=P.text(payload.branchId||'',120),kind=P.text(payload.kind||'',30),requestId=P.text(payload.requestId||'',100);
 P.assert(/^[a-zA-Z0-9_-]{8,100}$/.test(requestId),'A booking request identifier is required.');
 P.assert(['Grooming','Hospital'].includes(kind),'Choose grooming or hospital care.');
 const categories=business.data().categories||[],activities=business.data().activities||[];
 P.assert(kind==='Hospital'?categories.some(c=>c.includes('Veterinary')):categories.some(c=>c.includes('Grooming'))||activities.some(a=>a.toLowerCase().includes('groom')),'This business does not offer this service.',409);
 const branch=await db.doc(`publicBusinesses/${id}/publicBranches/${branchId}`).get();P.assert(branch.exists&&branch.data().status==='Published','Choose a published branch.',409);
 const date=P.text(payload.date||'',10),time=P.text(payload.time||'',5),pet=P.text(payload.petName||'',120),service=P.text(payload.service||'',120),notes=P.text(payload.notes||'',1000);
 P.slots(date,time,30);const start=new Date(`${date}T${time}:00+05:30`);P.assert(Number.isFinite(+start)&&new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)===date&&+start>Date.now(),'Choose a future appointment in India time.');P.assert(pet&&service,'Enter your pet name and service.');
 const parent=P.text(payload.name||user.name||'Customer',120),contact=P.text(payload.contact||user.email||'',240);
 const fields={'Pet name':pet,'Pet parent':parent,'Customer contact':contact,Service:service,'Service type':kind,Date:date,Time:time,Duration:'30',Notes:notes,'Payment status':'Unpaid',Doctor:''};
 const fingerprint=P.hash(JSON.stringify({branchId,fields})),target=ref(id,'appointments',P.hash(`${user.uid}:${requestId}`));
 await db.runTransaction(async t=>{const previous=await t.get(target);if(previous.exists){P.assert(previous.data().customerUid===user.uid&&previous.data().requestFingerprint===fingerprint,'This request identifier was already used for another booking.',409);return;}
  t.set(db.doc(`customerBusinesses/${user.uid}/businesses/${id}`),{businessId:id,updatedAt:now()},{merge:true});
  t.create(target,record(pet,branchId,fields,{status:'Requested',customerUid:user.uid,doctorUid:'',source:'PetMeta app',requestFingerprint:fingerprint}));
  t.create(ref(id,'notifications',`booking-${target.id}`),record(`New ${kind.toLowerCase()} request`,branchId,{Description:`${pet} · ${date} ${time}`,Target:'32',Read:'no'},{status:'Unread'}));
 });return {id:target.id,status:'Requested'};
};
