import PetMeta from '@/components/PetMeta';
import { notFound } from 'next/navigation';
export default function Page({params}:{params:{path:string[]}}){const route=params.path.join('/');if(!['home','login','register','pets','food','grooming','vet','accessories','about','bookings','chat','profile','transition'].includes(route)&&!/^booking\/[\w-]+$/.test(route))notFound();return <PetMeta route={route}/>}
