export const categories=[{id:'pets',name:'Pets',icon:'🐾',desc:'Find your forever friend',color:'#fce8ce'},{id:'food',name:'Food',icon:'🦴',desc:'Good food, happy tails',color:'#edf0d9'},{id:'grooming',name:'Grooming',icon:'🛁',desc:'A little extra pampering',color:'#e3eaf8'},{id:'vet',name:'Veterinary',icon:'🩺',desc:'Care you can count on',color:'#f9e5e3'},{id:'accessories',name:'Accessories',icon:'🎾',desc:'Their new favorite things',color:'#e6eedf'},{id:'about',name:'About us',icon:'💛',desc:'Made for the love of pets',color:'#fff0bc'}];
export const items=[
{id:'vet-1',category:'vet',name:'Happy Tails Veterinary',detail:'General checkup · Vaccinations',price:600,rating:'4.9',icon:'🩺'},
{id:'vet-2',category:'vet',name:'The Pet Wellness Clinic',detail:'Wellness · Dental care',price:800,rating:'4.8',icon:'🏥'},
{id:'groom-1',category:'grooming',name:'The Fluffy Club',detail:'Bath, brush & a whole lot of love',price:899,rating:'4.9',icon:'🛁'},
{id:'groom-2',category:'grooming',name:'Paws & Polish',detail:'Full groom · Nail trim · Ear cleaning',price:1299,rating:'4.8',icon:'✂️'},
{id:'food-1',category:'food',name:'Wholesome salmon bites',detail:'Adult cats · Grain-free · 1 kg',price:799,rating:'4.8',icon:'🐟'},
{id:'food-2',category:'food',name:'Happy belly chicken recipe',detail:'Adult dogs · Balanced nutrition · 2 kg',price:1199,rating:'4.9',icon:'🦴'},
{id:'accessory-1',category:'accessories',name:'The everyday walk set',detail:'Adjustable harness & matching leash',price:699,rating:'4.9',icon:'🐕'},
{id:'accessory-2',category:'accessories',name:'Play all day bundle',detail:'Three toys for curious little paws',price:449,rating:'4.7',icon:'🎾'},
{id:'pet-1',category:'pets',name:'Meet Mochi',detail:'British Shorthair · 4 months · Female',price:0,rating:'',icon:'🐈'},
{id:'pet-2',category:'pets',name:'Meet Buddy',detail:'Golden Retriever · 8 months · Male',price:0,rating:'',icon:'🐕'}];
export type Booking={id:string;service:string;date:string;time:string;pet:string;status:'Confirmed'|'Cancelled';demo:boolean};
export type Pet={id:string;name:string;species:string;age:string};
