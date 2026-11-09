// Integration tests against demo emulators only. Never run against a production project.
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const project='demo-petmeta-business';
process.env.GCLOUD_PROJECT=project;
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8088';
process.env.FIREBASE_STORAGE_EMULATOR_HOST='127.0.0.1:9199';
const load=require('node:module').createRequire(path.resolve('business-backend/package.json'));
const {initializeApp:adminInitialize}=load('firebase-admin/app');
const {getAuth:adminAuth}=load('firebase-admin/auth');
const {getFirestore}=load('firebase-admin/firestore');
const {initializeApp,deleteApp}=load('firebase/app');
const {getAuth,connectAuthEmulator,signInWithEmailAndPassword}=load('firebase/auth');
const {getStorage,connectStorageEmulator,ref:storageRef,uploadBytes}=load('firebase/storage');
const {initializeTestEnvironment,assertFails,assertSucceeds}=load('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc}=load('firebase/firestore');
adminInitialize({projectId:project,storageBucket:'petmeta-e8470.firebasestorage.app'});const db=getFirestore();
const api='http://127.0.0.1:5009/'+project+'/asia-south1/businessApi';
const password='Integration-only-89!';const apps=[];
async function account(label,claims){const email=`business-${label}-${Date.now()}@example.test`;const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const user=await response.json();assert.equal(response.status,200,JSON.stringify(user));await adminAuth().updateUser(user.localId,{emailVerified:true});if(claims)await adminAuth().setCustomUserClaims(user.localId,claims);const app=initializeApp({apiKey:'demo',projectId:project,authDomain:project+'.firebaseapp.com'},label);apps.push(app);const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});const result=await signInWithEmailAndPassword(auth,email,password);return {uid:user.localId,email,app,token:await result.user.getIdToken(true)};}
async function request(user,action,payload={},businessId='',expected=200){const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${user.token}`},body:JSON.stringify({action,payload,businessId})});const body=await response.json();assert.equal(response.status,expected,`${action}: ${JSON.stringify(body)}`);return body;}
async function upload(user,businessId,branchId,purpose){const name='evidence.pdf',type='application/pdf',bytes=Buffer.from('%PDF-1.4 integration evidence');const storage=getStorage(user.app,'gs://petmeta-e8470.firebasestorage.app');try{connectStorageEmulator(storage,'127.0.0.1',9199);}catch{}const object=`business/${businessId}/${branchId}/${user.uid}/${crypto.randomUUID()}-${name}`;await uploadBytes(storageRef(storage,object),bytes,{contentType:type,customMetadata:{purpose,businessId,ownerUid:user.uid,branchId}});return {path:object,name,type,size:bytes.length,purpose};}
(async()=>{
 const owner=await account('owner'),customer=await account('customer'),other=await account('other'),reviewer=await account('reviewer',{petmetaAdmin:true});
 const workspace=await request(owner,'workspace.open');const id=workspace.businessId;assert.equal(id,owner.uid);
 const identity={'Legal business name':'Integration Pet Care','Public business name':'Integration Pet Care','Business structure':'Sole proprietorship','Authorized representative':'Integration Owner','Mobile number':'9876543210',Email:owner.email,Description:'Integration test business'};
 await request(owner,'business.save',{identity,facility:{},categories:['Pet Store','Pet Food & Accessories','Veterinary Doctor'],activities:['Food retail','Consultations'],photos:[]},id);
 await request(other,'business.save',{identity,facility:{},categories:[],activities:[],photos:[]},id,403);
 const branch=await request(owner,'record.save',{collection:'branches',branchId:'',fields:{'Branch name':'Integration Branch','Complete address':'Road 1','State or union territory':'Telangana',District:'Hyderabad',City:'Hyderabad','PIN code':'500033','Opening time':'09:00','Closing time':'20:00','Customer contact number':'9876543210'},photos:[],attachments:[],submit:true},id);
 await request(owner,'business.submit',{declaration:true},id,400);
 const evidence=await upload(owner,id,branch.id,'Private document');
 for(const name of ['Business identity evidence','Food retail evidence','Professional registration'])await request(owner,'record.save',{collection:'documents',branchId:branch.id,fields:{'Document type':name,'Holder name':'Owner','Issuing authority':'Test authority','Registration number':'TEST-001','Issue date':'2026-01-01','Branch or activity covered':'Integration Branch'},photos:[],attachments:[evidence],submit:true},id);
 await request(owner,'business.submit',{declaration:true},id);assert.equal((await db.doc(`businesses/${id}`).get()).data().status,'Submitted');
 await request(owner,'review.decide',{collection:'business',status:'Approved'},id,403);
 await request(reviewer,'review.decide',{collection:'business',status:'Approved'},id);assert.equal((await db.doc(`publicBusinesses/${id}`).get()).data().status,'Published');
 const product=await request(owner,'record.save',{collection:'products',branchId:branch.id,fields:{'Product name':'Integration dog food',Brand:'Test','Selling price (₹)':'200','Pack size':'1 kg'},photos:[],attachments:[],submit:false},id);
 await db.doc(`businesses/${id}/products/${product.id}`).update({reviewStatus:'Verified',status:'Published',approvedFields:{'Selling price (₹)':'200'}});
 const batch=await request(owner,'record.save',{collection:'batches',branchId:branch.id,fields:{Product:product.id,'Batch number':'T-1',Quantity:'2','Expiry date':'2030-01-01',Quarantined:'no'},photos:[],attachments:[],submit:false},id);
 const placed=await request(customer,'customer.order',{branchId:branch.id,name:'Integration Customer',contact:customer.email,method:'Store pickup',items:[{productId:product.id,quantity:1}]},id);
 assert.equal((await db.doc(`businesses/${id}/batches/${batch.id}`).get()).data().fields.Quantity,'1');
 await request(customer,'customer.order',{branchId:branch.id,name:'Integration Customer',method:'Store pickup',items:[{productId:product.id,quantity:2}]},id,409);
 await request(owner,'order.transition',{id:placed.id,status:'Packing'},id);
 await request(owner,'order.transition',{id:placed.id,status:'Completed'},id,409);
 await request(owner,'payment.cash',{id:placed.id},id);
 await request(owner,'payment.cash',{id:placed.id},id,409);
 await request(owner,'order.transition',{id:placed.id,status:'Ready for pickup'},id);
 await request(owner,'order.transition',{id:placed.id,status:'Completed'},id);
 await request(owner,'inventory.adjust',{id:batch.id,quantity:4,reason:''},id,400);
 await request(owner,'inventory.adjust',{id:batch.id,quantity:4,reason:'Supplier delivery'},id);
 const second=await request(customer,'customer.order',{branchId:branch.id,name:'Customer',method:'Store pickup',items:[{productId:product.id,quantity:2}]},id);
 await request(owner,'order.transition',{id:second.id,status:'Cancelled',reason:'Customer requested cancellation'},id);
 assert.equal((await db.doc(`businesses/${id}/batches/${batch.id}`).get()).data().fields.Quantity,'4');
 const petRef=db.collection(`businesses/${id}/pets`).doc();await petRef.set({name:'Integration pet',branchId:branch.id,status:'Available',reviewStatus:'Verified',fields:{},photos:[],attachments:[]});
 const reservation={id:petRef.id,status:'Reserved',fields:{'Customer name':'Customer','Visit date':'2026-12-20','Visit time':'10:00','Reservation expiry':'2026-12-21T10:00'}};
 const responses=await Promise.all([request(owner,'pet.availability',reservation,id).then(()=>200).catch(e=>409),request(owner,'pet.availability',reservation,id).then(()=>200).catch(e=>409)]);assert.equal(responses.filter(s=>s===200).length,1,'Only one concurrent reservation may succeed');
 const doctorRef=db.collection(`businesses/${id}/doctors`).doc();await doctorRef.set({name:'Integration doctor',branchId:branch.id,status:'Verified',reviewStatus:'Verified',affiliation:'Accepted',userUid:owner.uid,fields:{'Working days':'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday','Start time':'09:00','End time':'18:00','Consultation duration':'30','Break starts':'13:00','Break ends':'14:00'},photos:[],attachments:[]});
 const booking={branchId:branch.id,doctorId:doctorRef.id,date:'2030-01-02',time:'10:30',petName:'Milo',name:'Customer',service:'Wellness'};
 await request(owner,'appointment.book',booking,id);await request(owner,'appointment.book',booking,id,409);await request(owner,'appointment.book',{...booking,time:'13:00'},id,409);
 const enquiry=await request(customer,'customer.enquire',{text:'Hello, can I arrange a visit?'},id);
 await request(other,'customer.message',{id:enquiry.id,text:'Unauthorized'},id,403);
 await request(owner,'message.send',{id:enquiry.id,text:'Yes, we would love to meet you.',attachments:[]},id);
 assert.equal((await db.collection(`businesses/${id}/messages`).where('conversationId','==',enquiry.id).get()).size,2);
 const roleMember=db.doc(`businesses/${id}/members/${other.uid}`);await roleMember.set({status:'Active',role:'Catalog Staff',branchIds:[branch.id],branchId:branch.id,fields:{}});
 const env=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync('business-backend/firestore.rules','utf8')}});
 const staff=env.authenticatedContext(other.uid).firestore(),ownerDb=env.authenticatedContext(owner.uid).firestore(),outsider=env.authenticatedContext(customer.uid).firestore();
 await assertSucceeds(getDoc(doc(staff,`businesses/${id}/products/${product.id}`)));
 await assertFails(getDoc(doc(staff,`businesses/${id}/documents/${evidence.id||'private'}`)));
 await assertFails(getDoc(doc(staff,`businesses/${id}/transactions/cash-${placed.id}`)));
 await assertFails(setDoc(doc(ownerDb,`businesses/${id}/products/${product.id}`),{status:'Published'}));
 await assertSucceeds(getDoc(doc(outsider,`businesses/${id}/orders/${placed.id}`)));
 await assertFails(getDoc(doc(outsider,`businesses/${id}/orders/not-owned`)));
 await roleMember.update({status:'Removed'});await assertFails(getDoc(doc(staff,`businesses/${id}/products/${product.id}`)));
 await env.cleanup();for(const app of apps)await deleteApp(app);
 console.log('PASS: authenticated workspace, tenant isolation, private document upload, application submission, reviewer separation, stock reservation, oversell prevention, order payment/fulfilment, cancellation stock release, concurrent pet reservations, appointment conflict/break checks, real-time messages, Firestore role restrictions and removed-member denial.');
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});


