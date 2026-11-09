'use strict';
const P=require('./policy.cjs');
module.exports=({db,ref,record,now})=>async function appTestCheckout(user,action,payload){
 const config=await db.doc('appConfiguration/testCheckout').get();
 if(action==='customer.appActivity'){
  // The registry is written only by successful server transactions. Never accept a customer's list of business IDs.
  const links=await db.collection(`customerBusinesses/${user.uid}/businesses`).get();
  const ids=[...new Set([...links.docs.map(d=>d.id),...(config.exists&&config.data().businessId?[config.data().businessId]:[])])].sort();
  const offset=Number(payload.cursor||0);P.assert(Number.isSafeInteger(offset)&&offset>=0,'Invalid activity page.');
  const page=ids.slice(offset,offset+15),orders=[],appointments=[];
  await Promise.all(page.map(async businessId=>{
   const results=await Promise.all(['orders','appointments'].map(kind=>db.collection(`businesses/${businessId}/${kind}`).where('customerUid','==',user.uid).get()));
   for(const [index,result] of results.entries())for(const doc of result.docs)(index===0?orders:appointments).push({id:doc.id,...doc.data(),businessId});
  }));
  return {orders,appointments,nextCursor:offset+page.length<ids.length?String(offset+page.length):null};
 }
 P.assert(config.exists&&config.data().enabled===true,'PetMeta test checkout is not configured.',409);
 if(action==='customer.testDirectory'){
  const stores=await db.collection('testBusinesses').where('enabled','==',true).get();
  return {businesses:stores.docs.map(d=>({id:d.id,...d.data()}))};
 }
 let id=P.text(payload.businessId||'',128);
 if(!id){const stores=await db.collection('testBusinesses').where('enabled','==',true).limit(2).get();P.assert(stores.docs.length===1,'Choose a test store in checkout. Update your app if no store selector is shown.',409);id=stores.docs[0].id;}
 P.assert(/^[a-zA-Z0-9_-]{1,128}$/.test(id),'Choose a test store.');
 const [business,store]=await Promise.all([db.doc(`businesses/${id}`).get(),db.doc(`testBusinesses/${id}`).get()]);
 P.assert(store.exists&&store.data().enabled===true&&business.exists&&business.data().status!=='Closed'&&!business.data().closed,'This test store is not accepting orders or bookings.',409);
 const branchId=store.data().branchId||'';
 const requestId=P.text(payload.requestId||'',100);
 P.assert(/^[a-zA-Z0-9_-]{8,100}$/.test(requestId),'A request identifier is required.');
 let kind,fields,name,extra={};
 if(action==='customer.testCheckout'){
  P.assert(store.data().acceptOrders!==false,'This test business accepts appointments only.',409);
  P.assert(Array.isArray(payload.items)&&payload.items.length>0&&payload.items.length<=100,'Choose between 1 and 100 test items.');
  const items=payload.items.map(item=>{
   const quantity=Number(item.quantity),price=Number(item.price),name=P.text(item.name||'',160);
   P.assert(name&&Number.isInteger(quantity)&&quantity>0&&quantity<=99&&Number.isFinite(price)&&price>=0&&price<=1000000,'Invalid test item.');
   return {name,quantity,price,variant:P.text(item.variant||'',120)};
  });
  const subtotal=items.reduce((n,item)=>n+item.price*item.quantity,0);
  const code=P.text(payload.couponCode||'',30).trim().toUpperCase();
  P.assert(!code||['PETMETA20','PAWS20'].includes(code),'Invalid coupon code.');
  const discount=code?Math.round(subtotal*.2):0,amount=subtotal-discount;
  const address=P.text(payload.address||'',1500),method=P.text(payload.payment||'',100);
  P.assert(address&&method,'Enter address and payment method.');
  kind='orders';name=P.text(user.name||user.email||'Pet parent',160);
  fields={'Item summary':items.map(i=>`${i.name} × ${i.quantity}`).join(' · '),Amount:String(amount),'Payment status':method==='Cash on delivery'?'Test COD · unpaid':'Test payment successful','Fulfilment method':'Test delivery',Address:address,'Customer contact':user.email||user.phone_number||'','Test mode':'yes'};
  extra={items,subtotal,discount,couponCode:code,amount,paymentMethod:method,paymentState:'simulated',status:'New',businessName:store.data().name};
 }else{
  P.assert(action==='customer.testBooking','Unknown test checkout action.');
  const serviceKind=['Hospital','Training'].includes(payload.kind)?payload.kind:'Grooming';
  P.assert((store.data().services||[]).includes(serviceKind),'This test provider does not offer the selected service.',409);
  const pet=P.text(payload.pet||'',120),service=P.text(payload.service||'',160),provider=P.text(store.data().name||payload.provider||'',160),date=P.text(payload.date||'',10),time=P.text(payload.time||'',20);
  P.assert(pet&&service&&provider&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&time,'Complete pet, service, provider, date and time.');
  const day=new Date(`${date}T12:00:00+05:30`);P.assert(Number.isFinite(+day)&&+day>Date.now()-86400000,'Choose a valid future date.');
  kind='appointments';name=pet;
  fields={'Pet name':pet,'Pet parent':P.text(user.name||user.email||'Pet parent',160),'Customer contact':user.email||user.phone_number||'',Service:service,'Service type':serviceKind,Provider:provider,Date:date,Time:time,Duration:'30',Notes:P.text(payload.notes||'',1000),'Payment status':'Test booking · unpaid',Doctor:'','Test mode':'yes'};
  extra={status:'Requested',doctorUid:'',businessName:store.data().name};
 }
 const fingerprint=P.hash(JSON.stringify({fields,extra})),target=ref(id,kind,P.hash(`${user.uid}:${action}:${requestId}`));
 await db.runTransaction(async t=>{
  const previous=await t.get(target);
  if(previous.exists){P.assert(previous.data().customerUid===user.uid&&previous.data().requestFingerprint===fingerprint,'Request identifier already used.',409);return;}
  t.set(db.doc(`customerBusinesses/${user.uid}/businesses/${id}`),{businessId:id,updatedAt:now()},{merge:true});
  t.create(target,record(name,branchId,fields,{...extra,testMode:true,source:'PetMeta app · simulated test',customerUid:user.uid,requestFingerprint:fingerprint}));
  t.create(ref(id,'notifications',`test-${target.id}`),record(kind==='orders'?'New test order':'New test appointment',branchId,{Description:`${name} · Test only, no real payment`,Target:kind==='orders'?'25':'32',Read:'no'},{status:'Unread',testMode:true}));
 });
 return {id:target.id,businessId:id,businessName:store.data().name,testMode:true,status:extra.status,amount:extra.amount};
};
