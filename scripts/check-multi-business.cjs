const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict');
const {request}=require('./firebase-admin-session.cjs');
const base='https://firestore.googleapis.com/v1/projects/petmeta-e8470/databases/(default)/documents';
const endpoint='https://petmeta-business-services.neeleshdodda56.chatgpt.site/businessApi';
const key=JSON.parse(fs.readFileSync('petmeta_mobile/android/app/google-services.json','utf8')).client[0].api_key[0].current_key;
(async()=>{
 const users=[],businesses=[];
 async function account(label){const email=`multi-${label}-${crypto.randomBytes(8).toString('hex')}@example.test`,password=crypto.randomBytes(24).toString('hex');const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const value=await r.json();assert.ok(r.ok,'Disposable user creation failed');const user={...value,email,password};users.push(user);return user;}
 async function api(user,action,payload={},businessId='',expected=200){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.idToken}`},body:JSON.stringify({action,payload,businessId})});const value=await r.json();assert.equal(r.status,expected,value.error||action);return value;}
 async function signIn(user){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password,returnSecureToken:true})});const value=await r.json();assert.ok(r.ok,'Returning-account sign-in failed');assert.equal(value.localId,user.localId);return {...user,...value};}
 try{
  const ownerA=await account('owner-a'),ownerB=await account('owner-b'),buyerA=await account('new-buyer'),buyerB=await account('returning-buyer');
  for(const [owner,label] of [[ownerA,'a'],[ownerB,'b']]){
   const workspace=await api(owner,'workspace.open');assert.equal(workspace.businessId,owner.localId);businesses.push(workspace.businessId);
   await api(owner,'business.testStorefront',{name:`Integration test store ${label}`,enabled:true,acceptOrders:true,services:['Grooming','Hospital']},workspace.businessId);
  }
  const [idA,idB]=businesses;const directory=await api(buyerA,'customer.testDirectory');assert.ok(directory.businesses.some(b=>b.id===idA)&&directory.businesses.some(b=>b.id===idB));
  for(const buyer of [buyerA,buyerB])for(const [id,label] of [[idA,'a'],[idB,'b']]){
   const payload={requestId:`multi_${buyer.localId}_${label}`,businessId:id,address:'Integration test only',payment:'UPI · Google Pay',items:[{name:`Integration food ${label}`,price:250,quantity:1}]};
   const first=await api(buyer,'customer.testCheckout',payload,id);assert.equal(first.businessId,id);assert.equal((await api(buyer,'customer.testCheckout',payload,id)).id,first.id);
   await api(buyer,'customer.testBooking',{requestId:`appointment_${buyer.localId}_${label}`,businessId:id,kind:label==='a'?'Grooming':'Hospital',pet:'Integration Buddy',provider:'Integration test provider',service:'Integration test only',date:'2030-01-01',time:'10:00'},id);
  }
  for(const buyer of [buyerA,buyerB]){const history=await api(buyer,'customer.appActivity',{customerUid:'someone-else',businessId:idA});assert.equal(history.orders.length,2);assert.equal(history.appointments.length,2);assert.ok(history.orders.every(r=>r.customerUid===buyer.localId));assert.deepEqual(history.orders.map(r=>r.businessId).sort(),[idA,idB].sort());}
  const returnedBuyer=await signIn(buyerB);assert.equal((await api(returnedBuyer,'customer.appActivity')).orders.length,2);
  const returnedOwner=await signIn(ownerA);assert.equal((await api(returnedOwner,'workspace.open')).businessId,idA);
  const workspaceA=await api(returnedOwner,'workspace.snapshot',{},idA),workspaceB=await api(ownerB,'workspace.snapshot',{},idB);
  assert.equal(workspaceA.collections.orders.length,2);assert.equal(workspaceB.collections.orders.length,2);assert.ok(workspaceA.collections.orders.every(o=>o.items[0].name==='Integration food a'));assert.ok(workspaceB.collections.orders.every(o=>o.items[0].name==='Integration food b'));
  await api(ownerA,'workspace.snapshot',{},idB,403);await api(buyerA,'workspace.snapshot',{},idA,403);
  const order=workspaceA.collections.orders.find(o=>o.customerUid===buyerA.localId);
  for(const status of ['Packing','Dispatched','Completed']){await api(ownerA,'order.transition',{id:order.id,status},idA);assert.equal((await api(buyerA,'customer.appActivity')).orders.find(o=>o.businessId===idA).status,status);}
  const appointment=workspaceA.collections.appointments.find(a=>a.customerUid===buyerA.localId);await api(ownerA,'appointment.transition',{id:appointment.id,status:'Confirmed'},idA);assert.equal((await api(buyerA,'customer.appActivity')).appointments.find(a=>a.businessId===idA).status,'Confirmed');
  const cancel=workspaceB.collections.orders.find(o=>o.customerUid===buyerA.localId);await api(ownerB,'order.transition',{id:cancel.id,status:'Cancelled',reason:'Integration test only'},idB);assert.equal((await api(buyerA,'customer.appActivity')).orders.find(o=>o.businessId===idB).status,'Cancelled');
  await api(buyerA,'customer.pay',{id:order.id},idA,409);
  await api(ownerB,'business.testStorefront',{name:'Integration test store b',enabled:false,services:['Hospital']},idB);assert.equal((await api(buyerA,'customer.appActivity')).orders.length,2);
  console.log('PASS: new and returning customers, two independent Business accounts, seller-scoped orders/bookings, duplicate protection, live packing/dispatched/completed/cancelled status, confirmed appointments and cross-account isolation. No real payments charged.');
 }finally{
  for(const id of businesses){for(const kind of ['orders','appointments','notifications','members','audit']){const result=await request(`${base}/businesses/${id}/${kind}?pageSize=100`);for(const doc of result.documents||[])await request(doc.name.replace('projects/petmeta-e8470/databases/(default)/documents',base),{method:'DELETE'});}
   await request(`${base}/testBusinesses/${id}`,{method:'DELETE'});await request(`${base}/businesses/${id}`,{method:'DELETE'});await request(`${base}/businessAccounts/${id}`,{method:'DELETE'});
  }
  for(const user of users){for(const id of businesses)await request(`${base}/customerBusinesses/${user.localId}/businesses/${id}`,{method:'DELETE'});const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:user.idToken})});assert.ok(r.ok,'Disposable auth cleanup failed');}
  console.log('Disposable test stores, accounts and records removed. Existing customer orders were untouched.');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
