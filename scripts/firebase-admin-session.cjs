// Reuses a local Firebase CLI login; never prints, persists or bundles credentials.
const fs = require('fs');
const path = require('path');
let access;
async function token() {
  if(access)return access;
  const file=path.join(process.env.USERPROFILE||process.env.HOME,'.config/configstore/firebase-tools.json');
  const config=JSON.parse(fs.readFileSync(file,'utf8'));
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:config.tokens.refresh_token,client_id:'563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',client_secret:'j9iVZfS8kkCEFUPaAeJV0sAi'})});
  const value=await response.json();
  if(!response.ok)throw new Error(`Firebase login needs renewal: ${value.error||response.status}`);
  access=value.access_token;return access;
}
async function request(url,options={}){
  const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json',...options.headers}});
  const value=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`${response.status}: ${value.error?.message||value.error||'Request failed'}`);
  return value;
}
module.exports={token,request};
if(require.main===module)(async()=>{
  const project='petmeta-e8470';
  const results=await Promise.allSettled([
    request(`https://firebase.googleapis.com/v1beta1/projects/${project}`),
    request(`https://firestore.googleapis.com/v1/projects/${project}/databases`),
    request(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`),
    request(`https://storage.googleapis.com/storage/v1/b?project=${project}`)
  ]);
  for(let i=0;i<results.length;i++){const r=results[i];if(r.status==='rejected')console.log(['project','database','auth','storage'][i],r.reason.message);else{const x=r.value;console.log(['project','database','auth','storage'][i],JSON.stringify(i===0?{projectId:x.projectId,state:x.state}:i===1?{databases:x.databases?.map(d=>({name:d.name,location:d.locationId}))}:i===2?{emailPassword:x.signIn?.email,phone:x.signIn?.phoneNumber,authorizedDomains:x.authorizedDomains}:{buckets:x.items?.map(b=>b.name)}));}}
})().catch(e=>{console.error(e.message);process.exit(1)});
