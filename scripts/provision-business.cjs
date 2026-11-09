const {request}=require('./firebase-admin-session.cjs');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const project='petmeta-e8470';
async function wait(base,op){for(let i=0;i<60;i++){if(op.done){if(op.error)throw new Error(op.error.message);return op.response;}await new Promise(r=>setTimeout(r,1500));op=await request(base+op.name);}throw new Error('Cloud provisioning is still running. Retry to inspect it.');}
(async()=>{
 const report={project,billingChanged:false};
 await wait('https://serviceusage.googleapis.com/v1/',await request(`https://serviceusage.googleapis.com/v1/projects/${project}/services:batchEnable`,{method:'POST',body:JSON.stringify({serviceIds:['firestore.googleapis.com']})}));console.log('Firestore API enabled. Billing remains unchanged.');
 let databases=await request(`https://firestore.googleapis.com/v1/projects/${project}/databases`);
 if(!databases.databases?.some(d=>d.name.endsWith('/databases/(default)'))){await wait('https://firestore.googleapis.com/v1/',await request(`https://firestore.googleapis.com/v1/projects/${project}/databases?databaseId=%28default%29`,{method:'POST',body:JSON.stringify({type:'FIRESTORE_NATIVE',locationId:'asia-south1',databaseEdition:'STANDARD'})}));console.log('Created the default Firestore database in asia-south1.');}
 databases=await request(`https://firestore.googleapis.com/v1/projects/${project}/databases`);report.databases=databases.databases?.map(d=>({name:d.name,location:d.locationId}));
 let apps=await request(`https://firebase.googleapis.com/v1beta1/projects/${project}/androidApps`);let app=apps.apps?.find(a=>a.packageName==='com.petmeta.business');
 if(!app){await wait('https://firebase.googleapis.com/v1beta1/',await request(`https://firebase.googleapis.com/v1beta1/projects/${project}/androidApps`,{method:'POST',body:JSON.stringify({packageName:'com.petmeta.business',displayName:'PetMeta Business Android'})}));apps=await request(`https://firebase.googleapis.com/v1beta1/projects/${project}/androidApps`);app=apps.apps.find(a=>a.packageName==='com.petmeta.business');}
 if(!app)throw new Error('Android application registration is still pending.');
 const cert=execFileSync('C:/Program Files/Android/Android Studio/jbr/bin/keytool.exe',['-exportcert','-alias','androiddebugkey','-keystore',path.join(process.env.USERPROFILE,'.android/debug.keystore'),'-storepass','android'],{stdio:['ignore','pipe','pipe']});
 const existing=await request(`https://firebase.googleapis.com/v1beta1/${app.name}/sha`);
 for(const [algo,certType]of [['sha1','SHA_1'],['sha256','SHA_256']]){const shaHash=crypto.createHash(algo).update(cert).digest('hex').toUpperCase();if(!existing.certificates?.some(c=>c.shaHash.replace(/:/g,'').toUpperCase()===shaHash))await request(`https://firebase.googleapis.com/v1beta1/${app.name}/sha`,{method:'POST',body:JSON.stringify({shaHash,certType})});}
 const result=await request(`https://firebase.googleapis.com/v1beta1/${app.name}/config`);const config=JSON.parse(Buffer.from(result.configFileContents,'base64').toString('utf8'));const client=config.client.find(c=>c.client_info.android_client_info.package_name==='com.petmeta.business');
 const target='business-android/app/src/main/assets/firebase-android.json';fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({projectId:project,appId:app.appId,apiKey:client.api_key[0].current_key},null,2));report.android={packageName:app.packageName,appId:app.appId,signingFingerprintsRegistered:true};
 fs.mkdirSync('.local-data',{recursive:true});fs.writeFileSync('.local-data/business-provisioning.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
