const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const values=new Map();global.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
global.document={documentElement:{lang:'en',dir:'ltr'}};
function load(file,extra={}){
 const result={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 new Function('require','exports','module',source)(name=>extra[name]||require(name),result.exports,result);
 return result.exports;
}
const data=require('../lib/app-languages.json');
const language=load('lib/business/language.ts',{'../app-languages.json':data});
const runtime=load('lib/business/localized-jsx/jsx-runtime.tsx',{'../language':language});
const {renderToStaticMarkup}=require('react-dom/server');
for(const code of Object.keys(data)){
 language.setLanguage(code);
 const rendered=renderToStaticMarkup(runtime.jsx('button',{children:'Orders'}));
 assert.ok(rendered.includes(code==='en'?'Orders':data[code].words.Orders));
 assert.equal(language.translate('Neelesh Dodda'),'Neelesh Dodda');
}
language.setLanguage('te');
const option=runtime.jsx('option',{children:'New'});
assert.equal(option.props.value,'New','Translated status options must submit the original identifier');
assert.equal(option.props.children,data.te.words.New);
language.setLanguage('ur');assert.equal(document.documentElement.dir,'rtl');
language.setLanguage('en');assert.equal(document.documentElement.dir,'ltr');
console.log('PASS: eleven language choices translate rendered Business labels; status IDs and names preserved; Urdu RTL works.');
