const {request}=require('./firebase-admin-session.cjs');
(async()=>{
 const base='https://firestore.googleapis.com/v1/projects/petmeta-e8470/databases/(default)/documents';
 const list=async path=>{let rows=[],page='';do{const result=await request(`${base}/${path}?pageSize=100${page?'&pageToken='+encodeURIComponent(page):''}`);rows.push(...(result.documents||[]));page=result.nextPageToken||'';}while(page);return rows;};
 const config=await request(`${base}/appConfiguration/testCheckout`),legacy=config.fields.businessId?.stringValue;
 if(legacy){const business=await request(`${base}/businesses/${legacy}`);let existing;try{existing=await request(`${base}/testBusinesses/${legacy}`);}catch(e){if(!e.message.startsWith('404'))throw e;}
 if(!existing){const fields={businessId:{stringValue:legacy},name:{stringValue:business.fields.name?.stringValue||'PetMeta Test Store'},enabled:{booleanValue:true},acceptOrders:{booleanValue:true},branchId:{stringValue:''},services:{arrayValue:{values:[{stringValue:'Grooming'},{stringValue:'Hospital'}]}},testMode:{booleanValue:true},updatedAt:{stringValue:new Date().toISOString()}};
 await request(`${base}/testBusinesses/${legacy}`,{method:'PATCH',body:JSON.stringify({fields})});await request(`${base}/businesses/${legacy}?updateMask.fieldPaths=testStorefront`,{method:'PATCH',body:JSON.stringify({fields:{testStorefront:{mapValue:{fields}}}})});
 }}
 let links=0;for(const business of await list('businesses')){const id=business.name.split('/').pop();const unique=new Set();for(const kind of ['orders','appointments'])for(const doc of await list(`businesses/${id}/${kind}`)){const uid=doc.fields.customerUid?.stringValue;if(uid)unique.add(uid);}
 for(const uid of unique){await request(`${base}/customerBusinesses/${uid}/businesses/${id}`,{method:'PATCH',body:JSON.stringify({fields:{businessId:{stringValue:id},updatedAt:{stringValue:new Date().toISOString()}}})});links++;}}
 console.log(`Preserved existing order/appointment history with ${links} customer-business links. Existing test storefront retained; no other businesses were enabled or published.`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
