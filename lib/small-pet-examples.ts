// User-supplied reference photos. These profiles and prices are illustrative;
// they do not describe animals currently available from PetMeta.
export type SmallPetExample = {
  id: string;
  name: string;
  species: 'Rabbit' | 'Tortoise';
  category: 'pets';
  kind: 'Example';
  price: number;
  image: string;
  description: string;
  breed: string;
  age: string;
  city: string;
};

export const smallPetExamples: SmallPetExample[] = [
  {id:'rabbit-white-standing',name:'White rabbit',species:'Rabbit',category:'pets',kind:'Example',price:3000,image:'/pet-breeds/rabbit-white-standing.png',breed:'Rabbit',age:'Photo example',city:'No live listing',description:'White rabbit standing on grass. Photo example; confirm age, care needs and availability with a real caregiver.'},
  {id:'rabbit-tan-flowers',name:'Tan rabbit',species:'Rabbit',category:'pets',kind:'Example',price:4000,image:'/pet-breeds/rabbit-tan-flowers.png',breed:'Rabbit',age:'Photo example',city:'No live listing',description:'Tan rabbit among flowers. Photo example; confirm age, care needs and availability with a real caregiver.'},
  {id:'rabbit-white-outdoors',name:'White rabbit outdoors',species:'Rabbit',category:'pets',kind:'Example',price:5000,image:'/pet-breeds/rabbit-white-outdoors.png',breed:'Rabbit',age:'Photo example',city:'No live listing',description:'White rabbit outdoors. Photo example; confirm age, care needs and availability with a real caregiver.'},
  {id:'rabbit-grey',name:'Grey rabbit',species:'Rabbit',category:'pets',kind:'Example',price:6000,image:'/pet-breeds/rabbit-grey.png',breed:'Rabbit',age:'Photo example',city:'No live listing',description:'Grey rabbit resting outside. Photo example; confirm age, care needs and availability with a real caregiver.'},
  {id:'tortoise-patterned',name:'Patterned tortoise',species:'Tortoise',category:'pets',kind:'Example',price:3000,image:'/pet-breeds/tortoise-patterned.png',breed:'Tortoise',age:'Photo example',city:'No live listing',description:'Patterned-shell tortoise. Species and legal status cannot be confirmed from a photo; verify before any enquiry.'},
  {id:'tortoise-grey',name:'Grey-shell tortoise',species:'Tortoise',category:'pets',kind:'Example',price:4000,image:'/pet-breeds/tortoise-grey.png',breed:'Tortoise',age:'Photo example',city:'No live listing',description:'Grey-shell tortoise. Species and legal status cannot be confirmed from a photo; verify before any enquiry.'},
  {id:'tortoise-small-patterned',name:'Small patterned tortoise',species:'Tortoise',category:'pets',kind:'Example',price:5000,image:'/pet-breeds/tortoise-small-patterned.png',breed:'Tortoise',age:'Photo example',city:'No live listing',description:'Small patterned-shell tortoise. Species and legal status cannot be confirmed from a photo; verify before any enquiry.'},
  {id:'tortoise-brown',name:'Brown-shell tortoise',species:'Tortoise',category:'pets',kind:'Example',price:6000,image:'/pet-breeds/tortoise-brown.png',breed:'Tortoise',age:'Photo example',city:'No live listing',description:'Brown-shell tortoise. Species and legal status cannot be confirmed from a photo; verify before any enquiry.'},
];
