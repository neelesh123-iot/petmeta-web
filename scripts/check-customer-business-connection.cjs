// Uses only disposable test users and a uniquely named business; cleans up in finally.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {request:admin}=require('./firebase-admin-session.cjs');
const project='petmeta-e8470',origin='https://petmeta-business-services.neeleshdodda56.chatgpt.site',base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const config=JSON.parse(fs.readFileSync('petmeta_mobile/android/app/google-services.json','utf8')),apiKey=config.client[0].api_key[0].current_key;
const users=[],written=[];let businessId='';
function encode(v){if(v===null)return {nullValue:null};if(Array.isArray(v))return {arrayValue:{values:v.map(encode)}};if(typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,a])=>[k,encode(a)]))}};if(typeof v==='boolean')return {booleanValue:v};if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};return {stringValue:String(v)};}
async function put(path,value){await admin(`${base}/${path}`,{method:'PATCH',body:JSON.stringify({fields:encode(value).mapValue.fields})});written.push(path);}
async function signup(label){const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`connection-${label}-${crypto.randomUUID()}@example.test`,password:crypto.randomBytes(24).toString('base64url')+'A9!',returnSecureToken:true})});const value=await response.json();assert.equal(response.status,200,value.error?.message);users.push(value);return value;}
async function api(user,action,payload={},expected=200){const response=await fetch(`${origin}/businessApi`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.idToken}`},body:JSON.stringify({action,businessId,payload})});const value=await response.json();assert.equal(response.status,expected,`${action}: ${value.error||'Unexpected response'}`);return value;}
async function read(path){return admin(`${base}/${path}`);}
(async()=>{try{
 const owner=await signup('owner'),customer=await signup('customer'),other=await signup('other');businessId='connection-'+crypto.randomBytes(10).toString('hex');
 const now=new Date().toISOString(),fields={'Selling price (₹)':'250','Product name':'Connection test food'};
 await put(`businesses/${businessId}`,{ownerUid:owner.localId,name:'Disposable connection verification',status:'Approved',closed:false,categories:['Grooming Salon','Veterinary Hospital or Clinic']});
 await put(`businesses/${businessId}/members/${owner.localId}`,{status:'Active',role:'Owner',branchIds:['main'],fields:{},branchId:''});
 await put(`publicBusinesses/${businessId}`,{name:'Disposable connection verification',status:'Published',closed:false,categories:['Grooming Salon','Veterinary Hospital or Clinic'],fields:{},photos:[]});
 await put(`publicBusinesses/${businessId}/publicBranches/main`,{name:'Test branch',branchId:'main',status:'Published',fields:{},photos:[]});
 await put(`businesses/${businessId}/products/food`,{name:'Connection test food',branchId:'main',reviewStatus:'Verified',approvedFields:fields,fields,sellable:10,status:'Published',photos:[]});
 await put(`publicBusinesses/${businessId}/publicProducts/food`,{name:'Connection test food',branchId:'main',status:'Published',fields,sellable:10,photos:[]});
 await put(`businesses/${businessId}/batches/batch`,{name:'Test batch',branchId:'main',fields:{Product:'food',Quantity:'10','Expiry date':'2035-12-31',Quarantined:'no'}});
 const catalogue=await api(customer,'customer.catalog');assert.equal(catalogue.products[0].id,'food');
 const orderPayload={branchId:'main',requestId:'connection_order_0001',items:[{productId:'food',quantity:2}],method:'Store pickup',name:'Connection customer',contact:'test@example.test'};
 const first=await api(customer,'customer.order',orderPayload),retry=await api(customer,'customer.order',orderPayload);assert.equal(first.id,retry.id);
 const order=await read(`businesses/${businessId}/orders/${first.id}`);assert.equal(order.fields.customerUid.stringValue,customer.localId);assert.equal(order.fields.branchId.stringValue,'main');assert.equal(Number(order.fields.amount.integerValue||order.fields.amount.doubleValue),500);
 const batch=await read(`businesses/${businessId}/batches/batch`);assert.equal(batch.fields.fields.mapValue.fields.Quantity.stringValue,'8','Retry must not reserve stock twice');
 await api(customer,'customer.order',{...orderPayload,items:[{productId:'food',quantity:3}]},409);
 const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10),bookings=[];
 for(const kind of ['Grooming','Hospital']){const payload={branchId:'main',kind,petName:'Test Buddy',name:'Connection customer',contact:'test@example.test',service:kind==='Hospital'?'Consultation':'Bath & brush',date,time:'11:00',requestId:`connection_booking_${kind}`};const result=await api(customer,'customer.requestBooking',payload);const second=await api(customer,'customer.requestBooking',payload);assert.equal(result.id,second.id);bookings.push(result.id);}
 let activity=await api(customer,'customer.activity');assert.equal(activity.orders.length,1);assert.equal(activity.appointments.length,2);assert.equal((await api(other,'customer.activity')).orders.length,0);assert.equal((await api(other,'customer.activity')).appointments.length,0);
 await api(owner,'appointment.transition',{id:bookings[0],status:'Confirmed'});activity=await api(customer,'customer.activity');assert.equal(activity.appointments.find(a=>a.id===bookings[0]).status,'Confirmed');
 const notifications=await admin(`${base}/businesses/${businessId}/notifications`);assert.equal(notifications.documents.length,3);
 const privateResponse=await fetch(`${base}/businesses/${businessId}/orders/${first.id}`,{headers:{Authorization:`Bearer ${other.idToken}`}});assert.equal(privateResponse.status,403,'Another customer cannot read the private order');
 const snapshot=await api(owner,'workspace.snapshot');assert.equal(snapshot.collections.orders.length,1);assert.equal(snapshot.collections.appointments.length,2);const refreshed=await api(owner,'workspace.activity');assert.equal(refreshed.collections.orders.length,1);assert.equal(refreshed.collections.appointments.length,2);await api(customer,'workspace.snapshot',{},403);
 console.log('PASS: published catalogue, real Firebase-authenticated order, stock-safe retry, grooming and hospital requests, live confirmation status, business notifications/totals, authenticated startup/activity snapshots and customer isolation. No payment charged.');
 }finally{
  if(businessId.startsWith('connection-'))for(const kind of ['orders','appointments','notifications']){const result=await admin(`${base}/businesses/${businessId}/${kind}`).catch(()=>({}));for(const doc of result.documents||[])written.push(doc.name.split('/documents/')[1]);}
  for(const path of [...new Set(written)].reverse())await admin(`${base}/${path}`,{method:'DELETE'}).catch(()=>{});
  for(const user of users)await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:user.idToken})}).catch(()=>{});
  console.log('Disposable connection-test cleanup completed.');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
