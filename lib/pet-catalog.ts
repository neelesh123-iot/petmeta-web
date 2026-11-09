import profiles from './pet-breed-catalog.json';
export const petCategories=[{name:'Dog',slug:'dog',plural:'Dogs'},{name:'Cat',slug:'cat',plural:'Cats'},{name:'Rabbit',slug:'rabbit',plural:'Rabbits'},{name:'Tortoise',slug:'tortoise',plural:'Tortoises'},{name:'Fish',slug:'fish',plural:'Fish'},{name:'Bird',slug:'bird',plural:'Birds'}] as const;
export type PetCategory=typeof petCategories[number];
export type PetProfile=typeof profiles[number];
export const petProfiles=profiles;
export const petCategory=(slug:string)=>petCategories.find(category=>category.slug===slug);
