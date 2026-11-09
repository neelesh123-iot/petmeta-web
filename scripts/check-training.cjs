const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
const moduleUnderTest={exports:{}};
const code=ts.transpileModule(fs.readFileSync('lib/training.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{crypto,Date,Error})(requireId=>requireId==='./home-discovery.json'?require('../lib/home-discovery.json'):require(requireId),moduleUnderTest,moduleUnderTest.exports);
const {trainingProducts,validateTrainingRequest,saveTrainingRequest,readTrainingRequests,addTrainingToCart}=moduleUnderTest.exports;
const memory=new Map();const storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
const now=new Date('2026-10-21T08:00:00');
const input={pet:' Buddy ',email:'test@example.com',date:'2026-10-22',time:'11:00',mode:'Online guidance',notes:'Confidence at home'};
assert.equal(trainingProducts.length,24);assert.equal(new Set(trainingProducts.map(p=>p.id)).size,24);
assert.equal(validateTrainingRequest(input,now),null);
for(const change of [{pet:''},{email:'bad'},{date:'2026-02-31'},{date:'2026-10-20'},{date:'not a date'},{time:'03:30'},{mode:'Invalid'},{notes:'a'.repeat(601)}])assert.ok(validateTrainingRequest({...input,...change},now));
for(const species of ['Dog','Cat','Rabbit','Tortoise','Fish','Bird']){
 const program=trainingProducts.find(p=>p.species===species);const request=saveTrainingRequest(storage,'requests',program,input,now);assert.equal(request.pet,'Buddy');assert.equal(request.price,program.price);assert.equal(request.status,'Draft — awaiting trainer confirmation');
 assert.throws(()=>saveTrainingRequest(storage,'requests',program,input,now),/already saved/);
}
assert.equal(readTrainingRequests(storage,'requests').length,6);
assert.equal(readTrainingRequests(storage,'other-user').length,0);
assert.equal(addTrainingToCart(storage,'training-0'),1);assert.equal(addTrainingToCart(storage,'training-0'),2);addTrainingToCart(storage,'training-1');
const cart=JSON.parse(storage.getItem('pm-store-cart'));assert.equal(trainingProducts.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0),5497);
assert.throws(()=>addTrainingToCart(storage,'unknown'),/unavailable/);
assert.throws(()=>saveTrainingRequest({...storage,setItem:()=>{throw Error('blocked')}},'blocked',trainingProducts[0],input,now),/blocked/);
assert.throws(()=>addTrainingToCart({...storage,setItem:()=>{throw Error('blocked')}},'training-0'),/blocked/);
memory.set('requests','{}');assert.throws(()=>readTrainingRequests(storage,'requests'),/could not be read/);
console.log('Passed: 24 programs, six species, future date/time and email validation, duplicate prevention, per-user requests, persisted prices/cart totals and storage failure handling.');
