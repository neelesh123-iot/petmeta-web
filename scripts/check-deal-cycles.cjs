const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

const cache=new Map(),storage=new Map(),events=new EventTarget();
let blocked=false,notifications=0;
events.addEventListener('pm-store-change',()=>notifications++);
const localStorage={getItem:key=>{if(blocked)throw Error('Storage blocked');return storage.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('Storage blocked');storage.set(key,value);}};
function load(filename){
  const absolute=path.resolve(__dirname,'..',filename);
  if(cache.has(absolute))return cache.get(absolute).exports;
  const module={exports:{}};cache.set(absolute,module);
  const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const run=vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{localStorage,window:{dispatchEvent:events.dispatchEvent.bind(events)},Event,Date,Math,Set});
  run(id=>id.startsWith('.')?load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(absolute),id+'.ts'))):require(id),module,module.exports);
  return module.exports;
}
const model=load('lib/deal-campaign.ts'),service=load('lib/bomb-deals.ts');
const start=1800000000000,D=model.DEAL_DURATION;
const first=model.createDeals(start);
assert.equal(first.ids.length,10);assert.equal(new Set(first.ids).size,10);
const revealed={...first,revealed:[first.ids[0]]};
assert.equal(model.dealPrice(first.ids[0],1000,revealed,start),800);
assert.strictEqual(model.currentDeals(revealed,first.endsAt-1),revealed);
assert.equal(model.dealPrice(first.ids[0],1000,revealed,first.endsAt),1000);
const next=model.currentDeals(revealed,first.endsAt);
assert.equal(next.endsAt,first.endsAt+D);assert.equal(next.revealed.length,0);
assert.notDeepEqual([...next.ids].sort(),[...first.ids].sort());
const lateNow=first.endsAt+5*D+1000,late=model.currentDeals(revealed,lateNow);
assert.equal(late.endsAt,first.endsAt+6*D);assert.ok(late.endsAt>lateNow&&late.endsAt-lateNow<=D);
let campaign=first;
for(let cycle=0;cycle<30;cycle++){
 const replacement=model.currentDeals(campaign,campaign.endsAt);
 assert.equal(new Set(replacement.ids).size,10);assert.notDeepEqual([...replacement.ids].sort(),[...campaign.ids].sort());campaign=replacement;
}
service.saveDeals(revealed);
assert.deepEqual([...service.ensureDeals(first.endsAt-1).ids],[...first.ids]);
const renewed=service.ensureDeals(first.endsAt);
assert.equal(renewed.endsAt,first.endsAt+D);assert.equal(renewed.revealed.length,0);
assert.equal(JSON.parse(storage.get(service.DEAL_KEY)).endsAt,renewed.endsAt);
assert.ok(notifications>=2);
storage.set(service.DEAL_KEY,'corrupt storage');assert.equal(service.ensureDeals(start).ids.length,10);
storage.set(service.DEAL_KEY,JSON.stringify({...first,ids:['unknown','unknown']}));assert.equal(new Set(service.ensureDeals(start).ids).size,10);
blocked=true;
const fallback=service.ensureDeals(start);
service.saveDeals({...fallback,revealed:[fallback.ids[0]]});
assert.equal(service.ensureDeals(start+1).revealed[0],fallback.ids[0]);
assert.equal(service.ensureDeals(fallback.endsAt).revealed.length,0);
console.log('PASS: 10 unique random picks, 30 successive renewals, exact eight-hour boundary, missed windows, cleared unlocks, expired prices, persistence, corrupt storage recovery and storage-blocked fallback.');
