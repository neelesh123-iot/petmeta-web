const {test}=require('node:test'),assert=require('node:assert/strict');
const handler=require('./app-test-checkout.cjs');
function setup(){
 const data=new Map([['appConfiguration/testCheckout',{enabled:true,businessId:'owner'}],['businesses/owner',{status:'Draft'}],['testBusinesses/owner',{enabled:true,name:'Owner test store',services:['Grooming','Hospital','Training']}]]);
 const snapshot=(path)=>({id:path.split('/').pop(),exists:data.has(path),data:()=>data.get(path)});
 const doc=path=>({path,id:path.split('/').pop(),get:async()=>snapshot(path)});
 const collection=(path,filters=[])=>({where:(key,operator,value)=>collection(path,[...filters,[key,value]]),limit:()=>collection(path,filters),get:async()=>({docs:[...data.keys()].filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1&&filters.every(([field,value])=>data.get(k)[field]===value)).map(snapshot)})});
 const db={doc,collection,runTransaction:async callback=>callback({get:r=>r.get(),set:(r,value)=>{data.set(r.path,value);},create:(r,value)=>{assert.ok(!data.has(r.path));data.set(r.path,value);}})};

 const api=handler({db,ref:(id,kind,key)=>doc(`businesses/${id}/${kind}/${key}`),record:(name,branchId,fields,extra)=>({name,branchId,fields,...extra}),now:()=>new Date().toISOString()});
 return {data,api};
}
const user={uid:'buyer',email:'buyer@example.test'};
test('existing cart test payment goes to configured owner, is idempotent and never marks real payment received',async()=>{
 const {data,api}=setup();const payload={requestId:'checkout_12345',items:[{name:'Dog food',price:500,quantity:2}],address:'Test address',payment:'UPI · Google Pay',couponCode:'PETMETA20'};
 const first=await api(user,'customer.testCheckout',payload);const second=await api(user,'customer.testCheckout',payload);assert.equal(first.id,second.id);
 const order=data.get(`businesses/owner/orders/${first.id}`);assert.equal(order.amount,800);assert.equal(order.testMode,true);assert.equal(order.fields['Payment status'],'Test payment successful');assert.notEqual(order.fields['Payment status'],'Received');assert.equal([...data.keys()].filter(k=>k.includes('/notifications/')).length,1);
 await assert.rejects(()=>api(user,'customer.testCheckout',{...payload,items:[{name:'Other',quantity:1,price:1}]}),/identifier/);
 assert.equal((await api({uid:'other'},'customer.appActivity',{})).orders.length,0);
 assert.equal((await api(user,'customer.appActivity',{})).orders.length,1);
});
test('grooming and hospital test bookings appear in owner appointments without a published business selector',async()=>{
 const {data,api}=setup();for(const kind of ['Grooming','Hospital']){
 const result=await api(user,'customer.testBooking',{requestId:'booking_'+kind,kind,pet:'Buddy',service:'Test service',provider:'PetMeta test provider',date:'2030-01-01',time:'10:00'});
 const appointment=data.get(`businesses/owner/appointments/${result.id}`);assert.equal(appointment.fields['Service type'],kind);assert.equal(appointment.testMode,true);assert.equal(appointment.customerUid,'buyer');
 }assert.equal((await api(user,'customer.appActivity',{})).appointments.length,2);
});
test('disabled test routing cannot accept an order',async()=>{const {data,api}=setup();data.set('appConfiguration/testCheckout',{enabled:false,businessId:'owner'});await assert.rejects(()=>api(user,'customer.testCheckout',{}),/not configured/);});
