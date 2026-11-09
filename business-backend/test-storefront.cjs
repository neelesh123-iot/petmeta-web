'use strict';
const P=require('./policy.cjs');
module.exports=({db,now})=>async function testStorefront(user,id,business,member,payload){
 P.assert(member.status==='Active'&&member.role==='Owner','Only the business owner can manage its test storefront.',403);
 const enabled=payload.enabled===true,name=P.text(payload.name||'',100),branchId=P.text(payload.branchId||'',120);
 P.assert(!branchId||/^[a-zA-Z0-9_-]{1,120}$/.test(branchId),'Choose a valid branch from your own business.');
 const services=payload.services||[];
 P.assert(!enabled||name.length>=2,'Enter a public test-store name.');
 P.assert(Array.isArray(services)&&services.every(s=>['Grooming','Hospital','Training'].includes(s)),'Choose valid test services.');
 if(branchId){const branch=await db.doc(`businesses/${id}/branches/${branchId}`).get();P.assert(branch.exists,'Choose a branch from your own business.',403);}
 const value={businessId:id,name,branchId,services:[...new Set(services)],acceptOrders:payload.acceptOrders!==false,enabled,testMode:true,updatedAt:now()};
 const batch=db.batch();batch.set(db.doc(`testBusinesses/${id}`),value);batch.update(db.doc(`businesses/${id}`),{testStorefront:value,updatedAt:now()});await batch.commit();
 return {saved:true,testStorefront:value};
};
