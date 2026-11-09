// Use Firebase CLI's official localhost OAuth flow from the desktop runtime.
// Credentials are recorded by firebase-tools, never printed or added to the app.
const fs=require('fs'),path=require('path');
const cache=path.join(process.env.USERPROFILE,'AppData/Local/npm-cache/_npx');
const base=fs.readdirSync(cache).map(p=>path.join(cache,p,'node_modules/firebase-tools/lib')).find(p=>fs.existsSync(path.join(p,'auth.js')));
if(!base)throw new Error('Run npx --yes firebase-tools --version first.');
const auth=require(path.join(base,'auth.js'));
const {configstore}=require(path.join(base,'configstore.js'));
auth.loginGoogle(true,configstore.get('user')?.email).then(result=>{auth.recordCredentials(result);console.log('Firebase browser sign-in completed.');}).catch(error=>{console.error('Firebase sign-in did not complete: '+error.message);process.exitCode=1;});
