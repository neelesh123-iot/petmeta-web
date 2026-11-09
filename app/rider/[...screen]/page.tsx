import {notFound} from 'next/navigation';
import RiderWorkspace from '@/components/rider/RiderWorkspace';
import {screens,Screen} from '@/components/rider/data';
export default function Page({params}:{params:{screen:string[]}}){const frame=params.screen[0]==='frame';const gallery=params.screen[0]==='screens';const id=frame?params.screen[1]:params.screen[0];if(!gallery&&!screens.some(s=>s[0]===id))notFound();return <RiderWorkspace initial={gallery?'home':id as Screen} frame={frame} gallery={gallery}/>}
