import './globals.css';
import './animations.css';
import './home.css';
import './dog-chat.css';
import './pet-hero.css';
import './discovery.css';
import './pet-directory.css';
import './training.css';
import './product-details.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
export const metadata: Metadata = {title:'PetMeta — A little care. A lot of love.',description:'Your pet’s happy place. Explore pet essentials, book care, and keep every little detail together.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet"/></head><body><Providers>{children}</Providers></body></html>}


