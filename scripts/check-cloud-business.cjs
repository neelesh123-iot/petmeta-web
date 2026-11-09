// Disposable authenticated smoke test of the deployed Worker and real Firebase.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {request:admin}=require('./firebase-admin-session.cjs');
const origin='https://petmeta-business-services.deeppine128.chatgpt.site',project='petmeta-e8470';
const apiKey='AIzaSyD1lzGMHdGx9zLnPSN9CLow1-M5K7jZnls';
const cleanup=[];let account;
async function api(action,payload={},expected=200){const response=await fetch(origin+'/businessApi',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+account.idToken},body:JSON.stringify({action,businessId:account.localId,payload})});const data=await response.json();assert.equal(response.status,expected,action+': '+JSON.stringify(data));return data;}
(async()=>{try{
 const created=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'petmeta-cloud-check-'+Date.now()+'@example.test',password:crypto.randomBytes(24).toString('base64url'),returnSecureToken:true})});account=await created.json();assert.equal(created.status,200,'Disposable Firebase account');
 const workspace=await api('workspace.open');assert.equal(workspace.businessId,account.localId);cleanup.push('businesses/'+account.localId,'businessAccounts/'+account.localId,'businesses/'+account.localId+'/members/'+account.localId);
 await api('business.save',{identity:{'Public business name':'Disposable cloud verification'},facility:{},categories:['Pet Store'],activities:[],photos:[]});
 const branch=await api('record.save',{collection:'branches',fields:{'Branch name':'Disposable branch','Complete address':'Disposable Road','State or union territory':'Telangana',District:'Hyderabad',City:'Hyderabad','PIN code':'500033','Opening time':'09:00','Closing time':'18:00','Customer contact number':'9876543210'},photos:[],attachments:[],submit:false});cleanup.push('businesses/'+account.localId+'/branches/'+branch.id);
 const form=new FormData();form.set('businessId',account.localId);form.set('branchId','registration');form.set('purpose','Facility evidence');form.set('file',new Blob(['%PDF-1.4 disposable verification'],{type:'application/pdf'}),'verification.pdf');
 const uploaded=await fetch(origin+'/upload',{method:'POST',headers:{Authorization:'Bearer '+account.idToken},body:form});const media=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(media));assert.ok(!media.url,'Private evidence has no public URL');
 await api('business.save',{identity:{'Public business name':'Disposable cloud verification'},facility:{},categories:['Pet Store'],activities:[],photos:[],facilityAttachments:[media]});
 const link=await api('media.open',{mediaPath:media.path});const document=await fetch(link.url);assert.equal(document.status,200);assert.equal(await document.text(),'%PDF-1.4 disposable verification');
 const unauth=await fetch(origin+'/businessApi',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(unauth.status,401);
 const notPublic=await fetch(origin+'/photo?path='+encodeURIComponent(media.path));assert.equal(notPublic.status,404);
 console.log('PASS: real Firebase sign-in, Worker token verification, Firestore writes/transactions, R2 private upload, saved evidence, authorized signed download, unauthenticated denial and private-photo denial.');
 }finally{if(account?.localId){for(const path of cleanup.reverse())await admin('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents/'+path,{method:'DELETE'}).catch(()=>{});await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:account.idToken})});}}})().catch(e=>{console.error(e.message);process.exitCode=1;});
