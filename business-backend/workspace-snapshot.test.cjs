const {test}=require('node:test'),assert=require('node:assert/strict');
const snapshot=require('./workspace-snapshot.cjs');
function setup(){
 const data={orders:[{id:'order',branchId:'second',name:'Dog food'}],appointments:[{id:'mine',branchId:'first',doctorUid:'doctor'},{id:'other',branchId:'second',doctorUid:'another'}],notifications:[],clinicalNotes:[{id:'note',doctorUid:'doctor'},{id:'private',doctorUid:'another'}],members:[{id:'owner'}]};
 const collection=(path,filters=[])=>({where:(field,op,value)=>collection(path,[...filters,[field,op,value]]),get:async()=>({docs:(data[path.split('/').pop()]||[]).filter(row=>filters.every(([field,op,value])=>op==='in'?value.includes(row[field]):row[field]===value)).map(row=>({id:row.id,data:()=>row}))})});
 return snapshot({db:{collection}});
}
test('owner startup snapshot includes orders even without business name or branches',async()=>{
 const result=await setup()({uid:'owner'},'business',{id:'business',name:''},{role:'Owner',status:'Active',branchIds:[]});
 assert.equal(result.collections.orders[0].name,'Dog food');assert.equal(result.collections.appointments.length,2);assert.equal(result.collections.branches.length,0);
});
test('staff snapshot remains scoped to assigned branches and permitted collections',async()=>{
 const result=await setup()({uid:'staff'},'business',{identity:{bank:'private'}},{role:'Receptionist',status:'Active',branchIds:['first']});
 assert.equal(result.collections.orders,undefined);assert.equal(result.collections.members,undefined);assert.equal(result.collections.appointments.length,1);assert.deepEqual(result.business.identity,{});
});
test('doctor snapshot cannot read another doctor clinical notes or appointments',async()=>{
 const result=await setup()({uid:'doctor'},'business',{}, {role:'Doctor',status:'Active',branchIds:['first']});
 assert.deepEqual(result.collections.clinicalNotes.map(r=>r.id),['note']);assert.deepEqual(result.collections.appointments.map(r=>r.id),['mine']);
});
test('activity refresh excludes unrelated collections and removed accounts',async()=>{
 const api=setup();const result=await api({uid:'owner'},'business',{}, {role:'Owner',status:'Active'},true);assert.deepEqual(Object.keys(result.collections).sort(),['appointments','notifications','orders']);await assert.rejects(()=>api({uid:'staff'},'business',{}, {role:'Owner',status:'Removed'}),/inactive/);
});
