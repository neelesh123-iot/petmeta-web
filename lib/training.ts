import catalogue from './home-discovery.json';

export type TrainingProgram = typeof catalogue.training[number];
export type TrainingMode = 'Home training' | 'Training centre' | 'Online guidance';
export const trainingModes:TrainingMode[] = ['Home training','Training centre','Online guidance'];
export const trainingProducts = catalogue.training.map(program=>({...program,category:'training',icon:'🎓',description:`${program.weeks}-week ${program.species.toLowerCase()} program · Sample service · Scheduling requires trainer confirmation`}));
export type TrainingRequest = {id:string;createdAt:string;programId:string;programName:string;species:string;price:number;pet:string;email:string;date:string;time:string;mode:TrainingMode;notes:string;status:'Draft — awaiting trainer confirmation'};
type RequestInput = Pick<TrainingRequest,'pet'|'email'|'date'|'time'|'mode'|'notes'>;

export function validateTrainingRequest(input:RequestInput,now=new Date()):string|null {
  if(!input.pet.trim()||input.pet.length>60) return 'Enter your pet’s name (up to 60 characters).';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)||input.email.length>160) return 'Enter a valid email address.';
  if(!trainingModes.includes(input.mode)) return 'Choose a training type.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!['09:00','11:00','14:00','16:00','18:00'].includes(input.time)) return 'Choose a preferred date and time.';
  const date=new Date(`${input.date}T${input.time}`);
  if(!Number.isFinite(+date)||date.getFullYear()!==Number(input.date.slice(0,4))||date.getMonth()+1!==Number(input.date.slice(5,7))||date.getDate()!==Number(input.date.slice(8,10))||date<=now) return 'Choose a time in the future.';
  if(input.notes.length>600) return 'Keep your notes under 600 characters.';
  return null;
}

export function readTrainingRequests(storage:Pick<Storage,'getItem'>,key:string):TrainingRequest[] {
  const value=JSON.parse(storage.getItem(key)||'[]');
  if(!Array.isArray(value)) throw new Error('Saved requests could not be read. Please try again.');
  return value;
}

export function saveTrainingRequest(storage:Pick<Storage,'getItem'|'setItem'>,key:string,program:TrainingProgram,input:RequestInput,now=new Date()):TrainingRequest {
  const error=validateTrainingRequest(input,now);
  if(error) throw new Error(error);
  const request:TrainingRequest={...input,pet:input.pet.trim(),email:input.email.trim(),notes:input.notes.trim(),id:crypto.randomUUID(),createdAt:now.toISOString(),programId:program.id,programName:program.name,species:program.species,price:program.price,status:'Draft — awaiting trainer confirmation'};
  const requests=readTrainingRequests(storage,key);
  if(requests.some(item=>item.programId===program.id&&item.pet.toLowerCase()===request.pet.toLowerCase()&&item.date===input.date&&item.time===input.time)) throw new Error('You already saved a request for this pet, program and time.');
  storage.setItem(key,JSON.stringify([request,...requests]));
  return request;
}

export function addTrainingToCart(storage:Pick<Storage,'getItem'|'setItem'>,id:string):number {
  if(!trainingProducts.some(program=>program.id===id)) throw new Error('This program is unavailable.');
  const cart=JSON.parse(storage.getItem('pm-store-cart')||'{}');
  if(!cart||typeof cart!=='object'||Array.isArray(cart)) throw new Error('Your cart could not be read.');
  const count=Number.isInteger(cart[id])&&cart[id]>0?cart[id]:0;
  storage.setItem('pm-store-cart',JSON.stringify({...cart,[id]:count+1}));
  return count+1;
}
