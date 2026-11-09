/* Shared kitten renderer: local pose atlas, real-time facial and tail deformation. */
window.mountCatPuppet = function(canvas) {
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true});
 if(!gl) { canvas.setAttribute('aria-label','Animated kitten requires WebGL'); return ()=>{}; }
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;'+"\n  uniform sampler2D atlas;\n  uniform float previousFrame, nextFrame, blend, time, blink, energy;\n  uniform vec2 gaze;\n  varying vec2 vUv;\n  vec4 pose(float index, vec2 p) {\n    bool openEyes = index < 3.0 || (index > 4.5 && index < 7.5);\n    float head = 1.0 - smoothstep(0.38, 0.56, p.y);\n    p.x -= gaze.x * 0.008 * head;\n    p.y -= sin(time * 1.8) * 0.003 * energy * (1.0 - smoothstep(0.4, 0.9, p.y));\n    // Independent tail sway in the lower right, and very small ear movement.\n    float tail = smoothstep(0.61, 0.79, p.x) * smoothstep(0.61, 0.80, p.y);\n    p.y += sin(time * (2.2 + energy)) * 0.012 * tail * energy;\n    float ears = (1.0 - smoothstep(0.06, 0.22, p.y));\n    p.x += sin(time * 1.1 + p.x * 8.0) * 0.003 * ears * energy;\n    if (openEyes) {\n      vec2 leftEye = vec2(0.417, 0.305);\n      vec2 rightEye = vec2(0.578, 0.325);\n      if (index > 0.5) { leftEye = vec2(0.42, 0.33); rightEye = vec2(0.58, 0.34); }\n      float l = 1.0 - smoothstep(0.025, 0.065, distance(p, leftEye));\n      float r = 1.0 - smoothstep(0.025, 0.065, distance(p, rightEye));\n      p -= gaze * 0.009 * (l + r);\n      p.y += ((p.y - leftEye.y) * l + (p.y - rightEye.y) * r) * blink * 3.5;\n    }\n    vec2 cell = vec2(mod(index, 3.0), floor(index / 3.0));\n    vec2 uv = vec2((cell.x + clamp(p.x, 0.002, 0.998)) / 3.0, 1.0 - (cell.y + clamp(p.y, 0.002, 0.998)) / 3.0);\n    vec4 color = texture2D(atlas, uv);\n    float green = color.g - max(color.r, color.b);\n    float alpha = 1.0 - smoothstep(0.05, 0.30, green);\n    color.g = min(color.g, max(color.r, color.b) + 0.015);\n    return vec4(color.rgb, alpha);\n  }\n  void main() {\n    vec2 p = vec2(vUv.x, 1.0 - vUv.y);\n    vec4 a = pose(previousFrame, p);\n    vec4 b = pose(nextFrame, p);\n    float opacity = mix(a.a, b.a, blend);\n    vec3 rgb = mix(a.rgb * a.a, b.rgb * b.a, blend) / max(opacity, 0.001);\n    gl_FragColor = vec4(rgb, opacity);\n    if (gl_FragColor.a < 0.015) discard;\n  }\n"));
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
