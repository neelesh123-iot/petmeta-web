'use strict';
const P=require('./policy.cjs');
const collections=['branches','pets','products','batches','doctors','orders','appointments','conversations','messages','documents','support','members','invitations','notifications','transactions','audit','clinicalNotes'];
const roles={Owner:collections,'Branch Manager':['branches','pets','products','batches','doctors','orders','appointments','conversations','messages','notifications'],'Catalog Staff':['branches','pets','products','batches','notifications'],'Order Staff':['branches','orders','conversations','messages','notifications'],Receptionist:['branches','doctors','appointments','notifications'],Doctor:['branches','doctors','appointments','clinicalNotes','notifications']};
module.exports=({db})=>async function workspaceSnapshot(user,id,business,member,activityOnly=false){
 P.assert(member.status==='Active'&&roles[member.role],'Your business access is inactive.',403);
 const permitted=roles[member.role].filter(name=>!activityOnly||['orders','appointments','notifications'].includes(name));
 const result={};
 await Promise.all(permitted.map(async name=>{
  let query=db.collection(`businesses/${id}/${name}`);
  if(member.role!=='Owner'){
   if(member.role==='Doctor'&&['doctors','appointments','clinicalNotes'].includes(name))query=query.where(name==='doctors'?'userUid':'doctorUid','==',user.uid);
   else if(member.branchIds?.length)query=query.where('branchId','in',member.branchIds.slice(0,30));
   else query=query.where('branchId','==','__unassigned__');
  }
  const rows=await query.get();result[name]=rows.docs.map(doc=>({id:doc.id,...doc.data()}));
 }));
 const visibleBusiness=member.role==='Owner'?business:{...business,identity:{},facility:{},facilityAttachments:[]};
 return {business:visibleBusiness,collections:result,syncedAt:new Date().toISOString()};
};
