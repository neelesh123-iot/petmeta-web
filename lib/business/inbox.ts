import type {RecordItem,Role} from './model';
// Owners receive the whole business inbox. Staff retain their assigned-branch
// scope from Firestore and the active branch view.
export function businessInbox(records:RecordItem[],role:Role,activeId:string){
 return records.filter(r=>role==='Owner'||!activeId||r.branchId===activeId);
}
export function appointmentMatchesDate(record:RecordItem,date:string,allDates:boolean){
 return allDates||record.fields.Date===date;
}
