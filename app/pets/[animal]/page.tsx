import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import PetCollectionPage from '@/components/PetCollectionPage';
import {petCategories,petCategory} from '@/lib/pet-catalog';
export function generateStaticParams(){return petCategories.map(category=>({animal:category.slug}));}
export function generateMetadata({params}:{params:{animal:string}}){const category=petCategory(params.animal);return {title:category?`${category.plural} & breeds | PetMeta`:'Pet category | PetMeta'};}
export default function Page({params}:{params:{animal:string}}){const category=petCategory(params.animal);if(!category)notFound();return <Suspense fallback={<div className="pet-directory-loading">Loading the pet collection…</div>}><PetCollectionPage key={category.slug} animal={category.slug}/></Suspense>;}
