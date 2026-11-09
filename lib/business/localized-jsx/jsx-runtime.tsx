import React,{useSyncExternalStore} from 'react';
import {jsx as originalJsx,jsxs as originalJsxs,Fragment} from 'react/jsx-runtime';
import {translate,subscribeLanguage,languageSnapshot} from '../language';
export {Fragment};
export type {JSX} from 'react/jsx-runtime';
function Translated({value}:{value:string}){useSyncExternalStore(subscribeLanguage,languageSnapshot,()=> 'en');return translate(value);}
function children(value:React.ReactNode):React.ReactNode {
 if(typeof value==='string')return originalJsx(Translated,{value});
 if(Array.isArray(value))return value.map((child,index)=>typeof child==='string'?originalJsx(Translated,{value:child},index):child);
 return value;
}
function propsFor(type:unknown,props:any){
 if(!props||typeof type!=='string'||['script','style','textarea'].includes(type))return props;
 const next={...props,children:children(props.children)};
 for(const name of ['placeholder','title','aria-label'])if(typeof next[name]==='string')next[name]=translate(next[name]);
 // Native option text must stay a string, and its underlying value must remain stable.
 if(type==='option'&&typeof props.children==='string'){next.value=props.value??props.children;next.children=translate(props.children);}
 return next;
}
export function jsx(type:any,props:any,key?:React.Key){return originalJsx(type,propsFor(type,props),key);}
export function jsxs(type:any,props:any,key?:React.Key){return originalJsxs(type,propsFor(type,props),key);}
