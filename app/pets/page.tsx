import {Suspense} from 'react';
import PetCollectionPage from '@/components/PetCollectionPage';
export const metadata={title:'Explore pets & breeds | PetMeta'};
export default function Page(){return <Suspense fallback={<div className="pet-directory-loading">Loading the pet collection…</div>}><PetCollectionPage/></Suspense>;}
