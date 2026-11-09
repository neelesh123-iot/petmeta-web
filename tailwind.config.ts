import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{primary:{DEFAULT:'#FFD60A',dark:'#FFC300'},accent:'#FF9F1C',bglight:'#FFFDF5',bgdark:'#1A1A1A',success:'#06D6A0',error:'#EF476F'},fontFamily:{display:['Poppins','sans-serif'],body:['Inter','sans-serif']}}},plugins:[]} satisfies Config;
