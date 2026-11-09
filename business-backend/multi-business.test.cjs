const {test}=require('node:test'),assert=require('node:assert/strict');
const checkout=require('./app-test-checkout.cjs'),storefront=require('./test-storefront.cjs'),snapshot=require('./workspace-snapshot.cjs');
function setup(){
 const data=new Map([['appConfiguration/testCheckout',{enabled:true}],['businesses/a',{status:'Draft'}],['businesses/b',{status:'Draft'}]]);
 const snap=path=>({id:path.split('/').pop(),exists:data.has(path),data:()=>data.get(path)});
 const doc=path=>({path,id:path.split('/').pop(),get:async()=>snap(path)});
 const collection=(path,filters=[],max=Infinity)=>({where:(field,op,value)=>collection(path,[...filters,[field,op,value]],max),limit:n=>collection(path,filters,n),get:async()=>({docs:[...data.keys()].filter(key=>key.startsWith(path+'/')&&key.split('/').length===path.split('/').length+1&&filters.every(([field,op,value])=>op==='in'?value.includes(data.get(key)[field]):data.get(key)[field]===value)).slice(0,max).map(snap)})});
 const writes={set:(ref,value,options)=>data.set(ref.path,options?.merge?{...data.get(ref.path),...value}:value),update:(ref,value)=>data.set(ref.path,{...data.get(ref.path),...value}),create:(ref,value)=>{assert.ok(!data.has(ref.path));data.set(ref.path,value);},get:ref=>ref.get(),commit:async()=>{}};
 const db={doc,collection,runTransaction:async fn=>fn(writes),batch:()=>writes};
 const record=(name,branchId,fields,extra)=>({name,branchId,fields,...extra});
 return {data,api:checkout({db,ref:(id,kind,key)=>doc(`businesses/${id}/${kind}/${key}`),record,now:()=>new Date().toISOString()}),enable:storefront({db,now:()=>new Date().toISOString()}),view:snapshot({db})};
}
test('new and existing customers track their own orders across multiple isolated Business accounts',async()=>{
 const {data,api,enable,view}=setup(),member={role:'Owner',status:'Active',branchIds:[]};
 for(const id of ['a','b'])await enable({uid:'owner-'+id},id,{status:'Draft'},member,{enabled:true,name:'Store '+id,services:['Grooming','Hospital']});
 assert.equal((await api({uid:'new'},'customer.testDirectory',{})).businesses.length,2);
 await assert.rejects(()=>api({uid:'new'},'customer.testCheckout',{requestId:'missing_seller_001'}),/Choose a test store/);
 for(const uid of ['new','existing'])for(const id of ['a','b']){
  const payload={businessId:id,requestId:'same_id_for_each_store_'+uid,items:[{name:'Food '+id,price:200,quantity:1}],address:'Test address',payment:'UPI'};
  const result=await api({uid},'customer.testCheckout',payload);assert.equal(result.businessId,id);
  assert.equal((await api({uid},'customer.testCheckout',payload)).id,result.id);
  await api({uid},'customer.testBooking',{businessId:id,requestId:'booking_'+uid+'_'+id,kind:'Hospital',pet:'Buddy',service:'Test consultation',provider:'Ignored spoofed provider',date:'2030-01-01',time:'10:00'});
 }
 for(const uid of ['new','existing']){
  const own=await api({uid},'customer.appActivity',{customerUid:'someone-else',businessId:'b'});
  assert.equal(own.orders.length,2);assert.equal(own.appointments.length,2);assert.ok(own.orders.every(order=>order.customerUid===uid));assert.deepEqual(own.orders.map(o=>o.businessId).sort(),['a','b']);
 }
 assert.equal((await api({uid:'stranger'},'customer.appActivity',{})).orders.length,0);
 for(const id of ['a','b']){
  const own=await view({uid:'owner-'+id},id,{},member,true);assert.equal(own.collections.orders.length,2);assert.ok(own.collections.orders.every(order=>order.items[0].name==='Food '+id));assert.equal(own.collections.appointments.length,2);assert.ok(own.collections.appointments.every(appointment=>appointment.fields.Provider==='Store '+id));
 }
 const own=(await api({uid:'new'},'customer.appActivity',{})).orders.find(o=>o.businessId==='a');data.get(`businesses/a/orders/${own.id}`).status='Packing';
 assert.equal((await api({uid:'new'},'customer.appActivity',{})).orders.find(o=>o.businessId==='a').status,'Packing');
 data.get('testBusinesses/b').enabled=false;
 await assert.rejects(()=>api({uid:'new'},'customer.testCheckout',{businessId:'b',requestId:'disabled_store_001'}),/not accepting/);
 assert.equal((await api({uid:'new'},'customer.appActivity',{})).orders.length,2,'Disabled stores must not erase customer history');
});
test('staff cannot publish a test storefront or target another business branch',async()=>{
 const {enable}=setup();await assert.rejects(()=>enable({uid:'staff'},'a',{}, {role:'Receptionist',status:'Active'},{enabled:true,name:'Test',services:[]}),/owner/);
 await assert.rejects(()=>enable({uid:'owner'},'a',{}, {role:'Owner',status:'Active'},{enabled:true,name:'Test',services:[],branchId:'foreign'}),/own business/);
});
