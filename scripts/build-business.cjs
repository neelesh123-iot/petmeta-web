const fs = require('fs');
const path = require('path');
const runtime = require('next/dist/compiled/webpack/webpack');
runtime.init();
const root = path.resolve(__dirname, '..');
const defines={'process.env.NODE_ENV':JSON.stringify('production')};
for(const key of ['NEXT_PUBLIC_FIREBASE_API_KEY','NEXT_PUBLIC_FIREBASE_PROJECT_ID','NEXT_PUBLIC_FIREBASE_EMULATORS','NEXT_PUBLIC_BUSINESS_API_URL'])defines[`process.env.${key}`]=process.env[key]?JSON.stringify(process.env[key]):'undefined';
const output = path.join(root, 'business-android/app/src/main/assets/web');
fs.mkdirSync(output, {recursive:true});
const assets = ['cat-moods.png','logo.jpg','cat-cutout.png','welcome-reference.mp4','opening-reference.mp4','pet-hero/dog.webp','pet-hero/cat.webp','hero-banners/hospital-care-poster.png','discovery/dog/1.webp','discovery/dog/4.webp','discovery/dog/9.webp','discovery/cat/0.webp'];
for(const asset of assets){const dest=path.join(output,asset);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,'public',asset),dest);}
fs.cpSync(path.join(root,'public/business-assets'),path.join(output,'business-assets'),{recursive:true});
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFF3B0"><title>PetMeta Business</title><style>html,body{margin:0;padding:0;background:#FFF3B0}body{overscroll-behavior-y:none}button,input,textarea,select{font:inherit}</style></head><body><div id="root"></div><script src="/business.js"></script></body></html>`);
for(const page of ['portal','review'])fs.writeFileSync(path.join(output,page+'.html'),fs.readFileSync(path.join(output,'index.html'),'utf8').replace('/business.js',`/${page}.js`));
runtime.webpack({ mode:'production', optimization:{minimize:false}, entry:{business:path.join(root,'scripts/business-entry.tsx'),portal:path.join(root,'scripts/business-portal-entry.tsx'),review:path.join(root,'scripts/business-review-entry.tsx')}, output:{path:output,filename:'[name].js'}, resolve:{extensions:['.tsx','.ts','.js'],alias:{'@':root}}, module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(root,'scripts/business-ts-loader.cjs')},{test:/\.css$/,use:path.join(root,'scripts/business-css-loader.cjs')}]}, plugins:[new runtime.webpack.DefinePlugin(defines)], performance:{hints:false} }, (err,stats)=>{ if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;return;}console.log(stats.toString({all:false,assets:true,timings:true}));console.log('Offline Business app: '+output); });



