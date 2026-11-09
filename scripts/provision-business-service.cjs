// Used as an in-memory credential bridge. Its stdout must be captured, never displayed.
const {request}=require('./firebase-admin-session.cjs');
async function provision(){
 const project='petmeta-e8470',email=`petmeta-business-api@${project}.iam.gserviceaccount.com`;
 await request(`https://serviceusage.googleapis.com/v1/projects/${project}/services/iam.googleapis.com:enable`,{method:'POST',body:'{}'});
 let account;try{account=await request(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts/${email}`);}catch(e){if(!e.message.startsWith('404:'))throw e;account=await request(`https://iam.googleapis.com/v1/projects/${project}/serviceAccounts`,{method:'POST',body:JSON.stringify({accountId:'petmeta-business-api',serviceAccount:{displayName:'PetMeta Business authenticated backend'}})});}
 const policy=await request(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`,{method:'POST',body:'{}'});policy.bindings ||= [];
 for(const role of ['roles/datastore.user','roles/firebaseauth.viewer']){let binding=policy.bindings.find(b=>b.role===role&&!b.condition);if(!binding){binding={role,members:[]};policy.bindings.push(binding);}if(!binding.members.includes(`serviceAccount:${email}`))binding.members.push(`serviceAccount:${email}`);}
 await request(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:setIamPolicy`,{method:'POST',body:JSON.stringify({policy})});
 const key=await request(`https://iam.googleapis.com/v1/${account.name}/keys`,{method:'POST',body:JSON.stringify({privateKeyType:'TYPE_GOOGLE_CREDENTIALS_FILE',keyAlgorithm:'KEY_ALG_RSA_2048'})});
 return {account:JSON.parse(Buffer.from(key.privateKeyData,'base64')),keyResource:key.name};
}
module.exports={provision};
if(require.main===module)provision().then(result=>process.stdout.write(JSON.stringify(result))).catch(e=>{console.error(e.message);process.exit(1)});
