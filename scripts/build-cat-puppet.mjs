import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('components/three/PhotoCat.tsx','utf8');
const shader=source.match(/const fragmentShader = `([\s\S]*?)`;/)[1];
writeFileSync('public/cat-puppet.js',`/* Shared kitten renderer: local pose atlas, real-time facial and tail deformation. */
window.mountCatPuppet = function(canvas) {
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true});
 if(!gl) { canvas.setAttribute('aria-label','Animated kitten requires WebGL'); return ()=>{}; }
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;'+${JSON.stringify(shader)}));
 gl.linkProgram(program);gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const uniforms=Object.fromEntries(['atlas','previousFrame','nextFrame','blend','time','blink','energy','gaze'].map(n=>[n,gl.getUniformLocation(program,n)]));
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const frames={idle:0,curious:1,reading:2,shy:3,sad:4,happy:5,joyful:6,welcome:6,anticipating:7,sleepy:8};
 let previous=0,next=0,changed=0,request,disposed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const image=new Image();image.src=new URL('cat-moods.png',document.currentScript?.src||location.href).href;
 image.onload=()=>{if(disposed)return;gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);canvas.dataset.ready='true';request=requestAnimationFrame(draw);};
 function draw(ms){
  if(disposed)return;
  const mood=canvas.closest('[data-mood]')?.dataset.mood||'idle';const frame=frames[mood]??0;
  if(frame!==next){previous=next;next=frame;changed=ms;}
  const size=Math.round(canvas.clientWidth*Math.min(devicePixelRatio,2));if(canvas.width!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}
  gl.uniform1i(uniforms.atlas,0);gl.uniform1f(uniforms.previousFrame,previous);gl.uniform1f(uniforms.nextFrame,next);gl.uniform1f(uniforms.blend,reduced.matches?1:Math.min(1,(ms-changed)/400));
  const t=ms/1000,phase=t%5.8;gl.uniform1f(uniforms.time,reduced.matches?0:t);gl.uniform1f(uniforms.blink,reduced.matches?0:phase>5.5?Math.sin((phase-5.5)/.3*Math.PI):0);gl.uniform1f(uniforms.energy,['sad','sleepy'].includes(mood)?0:['joyful','happy','welcome'].includes(mood)?1.8:1);
  gl.uniform2f(uniforms.gaze,reduced.matches?0:mood==='reading'?.5:mood==='curious'?-.35:Math.sin(t*.7)*.2,0);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);request=requestAnimationFrame(draw);
 }
 return ()=>{disposed=true;cancelAnimationFrame(request);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
};
document.querySelectorAll('canvas.cat-puppet').forEach(canvas=>window.mountCatPuppet(canvas));
`);
let html=readFileSync('public/animated-login.html','utf8');
html=html.replace(/      <div class="living-photo state-idle"[^\n]+/,`      <div class="cat-character state-idle" id="photo" role="img" aria-label="Animated orange kitten"><canvas class="cat-puppet" aria-label="Orange kitten reacting to the form"></canvas></div>`);
html=html.replace('<script src="animated-login.js"></script>','<script src="animated-login.js"></script><script src="cat-puppet.js"></script>');
writeFileSync('public/animated-login.html',html);
let js=readFileSync('public/animated-login.js','utf8').replace('`living-photo state-${state}`','`cat-character state-${state}`').replace('Cat photo turned away for password privacy','Kitten covering its eyes with its paws').replace('Your real cat companion','Animated orange kitten').replace('Turning around! Your password is 100% private 🙈🔒','I’m covering my eyes! Your password is private 🙈🔒');
writeFileSync('public/animated-login.js',js);
