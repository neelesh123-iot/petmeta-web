const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {request}=require('./firebase-admin-session.cjs');
(async()=>{
 const key=JSON.parse(fs.readFileSync('petmeta_mobile/android/app/google-services.json','utf8')).client[0].api_key[0].current_key;
 const base='https://firestore.googleapis.com/v1/projects/petmeta-e8470/databases/(default)/documents',businessId='wVUEMVCQWLbUSXqzC2pcEntuIvt2',made=[];
 const signup=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`checkout-${crypto.randomBytes(8).toString('hex')}@example.test`,password:crypto.randomBytes(24).toString('hex'),returnSecureToken:true})});
 const buyer=await signup.json();assert.ok(signup.ok,'Disposable account creation failed');
 const api=async(action,payload,expected=200)=>{const r=await fetch('https://petmeta-business-services.neeleshdodda56.chatgpt.site/businessApi',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${buyer.idToken}`},body:JSON.stringify({action,businessId,payload})});const v=await r.json();assert.equal(r.status,expected,v.error||action);return v;};
 try{
 const payload={requestId:'live_test_checkout_'+crypto.randomBytes(6).toString('hex'),items:[{name:'Integration test food',quantity:2,price:500}],address:'Integration test only',payment:'UPI · Google Pay',couponCode:'PETMETA20'};
 const order=await api('customer.testCheckout',payload);made.push(`orders/${order.id}`,`notifications/test-${order.id}`);assert.equal(order.businessId,businessId);assert.equal((await api('customer.testCheckout',payload)).id,order.id);
 const doc=await request(`${base}/businesses/${businessId}/orders/${order.id}`);assert.equal(doc.fields.testMode.booleanValue,true);assert.equal(Number(doc.fields.amount.integerValue||doc.fields.amount.doubleValue),800);assert.equal(doc.fields.fields.mapValue.fields['Payment status'].stringValue,'Test payment successful');
 await api('customer.pay',{id:order.id},409);
 for(const kind of ['Grooming','Hospital']){const booking=await api('customer.testBooking',{requestId:'live_test_'+kind+'_'+crypto.randomBytes(6).toString('hex'),kind,pet:'Integration Buddy',service:'Integration test only',provider:'PetMeta test provider',date:'2030-01-01',time:'11:00'});made.push(`appointments/${booking.id}`,`notifications/test-${booking.id}`);const doc=await request(`${base}/businesses/${businessId}/appointments/${booking.id}`);assert.equal(doc.fields.fields.mapValue.fields['Service type'].stringValue,kind);}
 const activity=await api('customer.appActivity',{});assert.equal(activity.orders.length,1);assert.equal(activity.appointments.length,2);
 console.log('PASS: original-cart test order and grooming/hospital test bookings reached the selected real Business workspace; customer history, server totals and duplicate protection verified. No real payment charged.');
 }finally{
 for(const path of made)await request(`${base}/businesses/${businessId}/${path}`,{method:'DELETE'});
 await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:buyer.idToken})});
 console.log('Disposable test records and customer removed; business routing remains configured.');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
