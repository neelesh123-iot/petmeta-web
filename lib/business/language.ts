import languages from '../app-languages.json';
export type LanguageCode = keyof typeof languages;
export const appLanguages = languages;
const listeners = new Set<()=>void>();
let code:LanguageCode='en';
try { const saved=localStorage.getItem('petmeta.language'); if(saved && saved in languages)code=saved as LanguageCode; } catch {}
if(typeof document!=='undefined'){document.documentElement.lang=code;document.documentElement.dir=code==='ur'?'rtl':'ltr';}
export const languageSnapshot=()=>code;
export const subscribeLanguage=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function setLanguage(next:LanguageCode){localStorage.setItem('petmeta.language',next);code=next;document.documentElement.lang=next;document.documentElement.dir=next==='ur'?'rtl':'ltr';listeners.forEach(fn=>fn());}
export function translate(value:string):string {
 const words=languages[code].words as Record<string,string>;
 const exact=(s:string)=>Object.entries(words).find(([key])=>key.toLowerCase()===s.trim().toLowerCase())?.[1];
 const direct=exact(value);if(direct)return value.replace(value.trim(),direct);
 return value.replace(/[^\n·:₹0-9]+/g,s=>{const found=exact(s);return found?s.replace(s.trim(),found):s;});
}
