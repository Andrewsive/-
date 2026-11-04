import {LANTERNS,LanternEngine,sampleLantern} from './engine.js';
import {drawLantern,drawLandscapeLantern} from './lantern-art.js';
import {LanternResonance} from './resonance.js';

const $=s=>document.querySelector(s);
const canvas=$('#scene-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const samplePreview=$('#sample-preview'),samplePreviewCtx=samplePreview.getContext('2d');
const scene=$('#scene'),sensors=$('#sensor-layer');
const W=1448,H=1086,CROP_Y=300,CROP_H=690;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
let ready=false,backgroundClean=false,ambient=true,presentation=false,hovered=null,lastTime=0,toastUntil=0,uiUntil=0;
let sampleEffects=true,samplePath=false;
let ambientTime=0,frameCount=0,fps=60,fpsTime=0;
const image=new Image(),baseLayer=document.createElement('canvas');
baseLayer.width=W;baseLayer.height=H;
const base=baseLayer.getContext('2d');
// Conservative architectural mask. It follows the inside of the tiled eaves.
// The second subpath reserves the original calligraphy, even during dispersal.
const wall=new Path2D('M 4 583 L 975 587 L 975 562 L 1039 565 L 1038 510 L 1110 513 L 1112 450 L 1245 450 L 1243 510 L 1320 513 L 1321 548 L 1368 552 L 1390 841 L 4 841 Z M 766 602 L 1310 602 L 1310 694 L 766 694 Z');
const engine=new LanternEngine({onChange:updateInterface});
const resonance=new LanternResonance();
const sensorButtons=new Map(),cards=new Map(),feedback=[];
const idleSprites=new Map();

for(const [index,l] of LANTERNS.entries()){
  const sprite=document.createElement('canvas');sprite.width=280;sprite.height=280;
  drawLantern(sprite.getContext('2d'),l.type,140,140,2,0,.9,0);idleSprites.set(l.id,sprite);
  const sensor=document.createElement('button');
  sensor.className='sensor';sensor.dataset.id=l.id;sensor.setAttribute('aria-label',`唤醒${l.name}：${l.blessing}`);
  sensor.innerHTML=`<span class="sensor-dot"></span><span class="sensor-label">${l.name} · 轻触唤醒</span>`;
  sensor.addEventListener('click',()=>triggerLantern(l.id));
  sensor.addEventListener('pointerenter',()=>hovered=l.id);
  sensor.addEventListener('pointerleave',()=>hovered=null);
  sensor.addEventListener('focus',()=>hovered=l.id);sensor.addEventListener('blur',()=>hovered=null);
  sensors.append(sensor);sensorButtons.set(l.id,sensor);
  const card=document.createElement('button');card.className='lantern-card';card.dataset.id=l.id;
  card.innerHTML=`<canvas width="150" height="112" aria-hidden="true"></canvas><b>${l.name}</b><small>${l.blessing}</small>`;
  card.setAttribute('aria-label',`${index+1}，唤醒${l.name}，${l.blessing}`);
  const small=card.querySelector('canvas').getContext('2d');
  drawLantern(small,l.type,75,55,.91,0,1,0);
  card.addEventListener('click',()=>triggerLantern(l.id));
  card.addEventListener('pointerenter',()=>hovered=l.id);card.addEventListener('pointerleave',()=>hovered=null);
  $('#lantern-list').append(card);cards.set(l.id,card);
}

/** Public sensor boundary. Mouse, keyboard and future hardware share this call. */
export function triggerLantern(id){
  if(!ready)return{status:'loading',id};
  const result=engine.triggerLantern(id),l=LANTERNS.find(x=>x.id===id);
  if(!l)return result;
  if(result.status==='started'){
    feedback.push({id,at:engine.elapsed,kind:'touch'});
    notify(`${l.name}已唤醒 · ${l.blessing}`);
    $('#live-description').textContent=`${l.name}被轻触唤醒，${l.blessing}。`;
  }else if(result.status==='busy')notify(`${l.name}正在迎春，待微光归来再轻触`);
  return result;
}
window.triggerLantern=triggerLantern;
window.addEventListener('xixi:sensor',event=>{if(typeof event.detail?.id==='string')triggerLantern(event.detail.id);});
window.xixiLanterns={triggerLantern,lanterns:LANTERNS,getState:()=>engine.getState(),reset:()=>reset(),setSpeed:n=>engine.setSpeed(n),setPaused:n=>engine.setPaused(n),getDiagnostics:()=>({ready,backgroundClean,fps:Math.round(fps),canvas:[canvas.width,canvas.height],active:engine.active.size,resonances:Number(canvas.dataset.resonances)||0})};

function notify(text){$('#scene-toast').textContent=text;$('#scene-toast').classList.add('visible');toastUntil=performance.now()+2300;}
function updateInterface(state=engine.getState()){
  const ids=new Set(state.active.map(x=>x.id));
  for(const l of LANTERNS){
    const status=ids.has(l.id)?'active':'idle';
    for(const el of [sensorButtons.get(l.id),cards.get(l.id)]){if(!el)continue;el.dataset.state=status;el.setAttribute('aria-busy',String(status!=='idle'));}
    const label=cards.get(l.id)?.querySelector('small');
    if(label)label.textContent=status==='active'?'微光升起中':l.blessing;
  }
  $('#active-count').textContent=state.active.length;
  $('#scene-status').textContent=state.paused?'时光暂驻 · 动画已暂停':state.active.length?`微光升起 · ${state.active.length} 盏灯已唤醒`:'灯火静候 · 触灯迎春';
  $('#pause-button').textContent=state.paused?'继续动画':'暂停动画';
  if(!state.active.length)$('#live-description').textContent='九盏灯，九种春意。静候你的轻触。';
}

function positionSensors(){
  const rect=scene.getBoundingClientRect(),height=presentation?H:CROP_H,y0=presentation?0:CROP_Y;
  const ratio=Math.min(rect.width/W,rect.height/height),offX=(rect.width-W*ratio)/2,offY=(rect.height-height*ratio)/2;
  for(const l of LANTERNS){const b=sensorButtons.get(l.id);b.style.left=`${offX+l.x*ratio}px`;b.style.top=`${offY+(l.y-y0)*ratio}px`;b.style.width=`${Math.max(22,86*ratio)}px`;b.style.height=`${Math.max(28,95*ratio)}px`;}
}
new ResizeObserver(positionSensors).observe(scene);

function glow(x,y,r,alpha=.4,color='255,192,76'){
  if(alpha<=0||r<=0)return;
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.3,`rgba(${color},${alpha*.35})`);g.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function stroke(d,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(new Path2D(d));}
function petal(x,y,r,a,alpha){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;ctx.fillStyle='#ffe1a0';ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*1.2,-r*.4,r*.8,r*.8,0,r);ctx.bezierCurveTo(-r*.9,r*.5,-r*.6,-r*.5,0,-r);ctx.fill();ctx.restore();}

function drawAmbient(t){
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<20;i++){
    const x=80+i*66+Math.sin(t*.19+i)*8,y=774+(i%4)*15;
    const a=.025+.027*(Math.sin(t*.6+i*1.7)*.5+.5);
    ctx.strokeStyle=`rgba(255,207,118,${a})`;ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(x,y,18+(i%3)*13,1.1,0,0,Math.PI*2);ctx.stroke();
  }
  // The source moon breathes without moving or extending outside the wall.
  glow(1175,525,42,.035+.018*Math.sin(t*.65),'255,227,159');
  ctx.restore();
}
function drawReflection(l,frame,t){
  const reflection=frame?.reflectionOpacity??frame?.opacity??1;
  const strength=(frame?reflection*(.15+frame.glow*.2):.11)*(1+(ambient?Math.sin(t*1.1+l.seed)*.15:0));
  const x=frame?l.x+(frame.x-l.x)*.2:l.x;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<8;i++){
    const y=779+i*7.5,w=(16-i*.9)*(frame?1+frame.motionProgress*.9:1),wave=ambient?Math.sin(t*1.5+i*.9+l.seed)*3:0;
    ctx.strokeStyle=`rgba(255,201,104,${strength*(1-i/9)})`;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(x-w+wave,y);ctx.quadraticCurveTo(x,y+1.5,x+w+wave,y);ctx.stroke();
  }
  ctx.restore();
}

function drawLandscapePath(l){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.setLineDash([4,8]);ctx.strokeStyle='rgba(255,218,145,.3)';ctx.lineWidth=.75;ctx.beginPath();
  for(let i=0;i<=48;i++){const f=sampleLantern(l,.95+i/48*4.6);if(i)ctx.lineTo(f.x,f.y);else ctx.moveTo(f.x,f.y)}ctx.stroke();ctx.setLineDash([]);
  for(const age of [.95,2.45,4,5.55]){const f=sampleLantern(l,age);ctx.fillStyle='rgba(255,232,177,.55)';ctx.beginPath();ctx.arc(f.x,f.y,2.1,0,Math.PI*2);ctx.fill()}
  ctx.restore();
}

function drawLandscapeEffects(l,f,t){
  ctx.save();ctx.globalCompositeOperation='screen';
  if(f.age<1.5){for(let i=0;i<2;i++){const p=clamp((f.age-i*.16)/1.25);if(p>0&&p<1){ctx.strokeStyle=`rgba(255,218,145,${(1-p)*.48})`;ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(l.x,l.y+27,10+p*55,2+p*9,0,0,Math.PI*2);ctx.stroke()}}}
  glow(f.x,f.y,52*f.scale,.08*f.externalGlow);
  if(sampleEffects&&f.trailOpacity>0){
    for(let k=0;k<2;k++){ctx.beginPath();for(let i=0;i<=20;i++){const age=Math.max(.9,f.age-1.75+i/20*1.75),p=sampleLantern(l,age);const x=p.x+(k?3:-3)*Math.sin(age*1.3),y=p.y+11+k*4;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)}ctx.strokeStyle=`rgba(255,205,114,${f.trailOpacity*(k?.1:.18)})`;ctx.lineWidth=k?.55:1;ctx.stroke()}
    for(let i=0;i<5;i++){const age=f.age-i*.18;if(age<1.1)continue;const p=sampleLantern(l,Math.max(.95,age-1));const x=p.x+Math.sin(i*2.4+t*.45)*13,y=p.y+18+i*2;const a=f.particleOpacity*(.22-i*.025);glow(x,y,4,a);ctx.fillStyle=`rgba(255,231,170,${a})`;ctx.beginPath();ctx.arc(x,y,.7+(i%2)*.35,0,Math.PI*2);ctx.fill()}
  }
  ctx.restore();
}

function drawSamplePreview(frame,t){
  const c=samplePreviewCtx,w=samplePreview.width,h=samplePreview.height;
  c.clearRect(0,0,w,h);
  const ground=c.createLinearGradient(0,0,0,h);ground.addColorStop(0,'#302d23');ground.addColorStop(.74,'#201f19');ground.addColorStop(1,'#151612');c.fillStyle=ground;c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(218,181,110,.08)';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.moveTo(0,208+i*9);c.quadraticCurveTo(w*.5,202+i*10,w,208+i*9);c.stroke()}
  c.save();c.globalCompositeOperation='screen';const reflection=c.createRadialGradient(252,224,2,252,224,82);reflection.addColorStop(0,`rgba(255,190,85,${.13*(frame?.reflectionOpacity??1)})`);reflection.addColorStop(1,'rgba(255,164,54,0)');c.fillStyle=reflection;c.fillRect(164,200,176,60);c.restore();
  const pose=frame||{lightCore:.44,paperLight:.34,patternReveal:1,externalGlow:.38,tasselAngle:Math.sin(t*.45)*.008};
  drawLandscapeLantern(c,252,130,2.15,pose.rotation||0,pose,t);
}

function drawSpecial(l,f,t){
  const intensity=Math.sin(clamp(f.age/.75)*Math.PI)*.5+.5;
  ctx.save();ctx.globalCompositeOperation='screen';
  // Two initial rings provide immediate feedback before lift-off.
  if(f.age<1.9){for(let j=0;j<2;j++){const p=clamp((f.age-j*.17)/1.65);if(p<=0||p>=1)continue;ctx.strokeStyle=`rgba(255,213,134,${(1-p)*.65})`;ctx.lineWidth=1.2-p*.6;ctx.beginPath();ctx.ellipse(l.x,l.y+25,12+p*74,3+p*15,0,0,Math.PI*2);ctx.stroke();}}
  // Narrow, fading motion trace samples the same curved path as its lantern.
  if(f.age>.8){for(let k=0;k<2;k++){
    ctx.beginPath();for(let j=0;j<=22;j++){
      const age=Math.max(.65,f.age-2.1+j/22*2.1),p=sampleLantern(l,age);
      const x=p.x+Math.sin(age*2.2+k)*9*(1-j/25),y=p.y+19;
      if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=`rgba(255,200,99,${.16*f.opacity})`;ctx.lineWidth=k? .6:1.35;ctx.stroke();
  }}
  glow(f.x,f.y,57*f.scale,.12*f.glow);
  const count=l.effect==='petals'?7:l.effect==='moon'?5:6;
  for(let i=0;i<count;i++){
    const a=(f.age*.28+i*2.399+l.seed),orbit=21+9*Math.sin(f.age*.8+i),delay=i*.13;
    const presence=clamp((f.age-delay)*2)*f.opacity;
    const x=f.x+Math.cos(a)*orbit,y=f.y+Math.sin(a)*orbit*.64+(i%2?9:-9);
    if(l.effect==='petals')petal(x,y,2.6+(i%2),a+f.age,.55*presence);
    else if(l.effect==='fish'){
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ctx.globalAlpha*=.6*presence;
      ctx.strokeStyle='#ffe3a0';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-7,0);ctx.quadraticCurveTo(0,-6,7,0);ctx.quadraticCurveTo(0,6,-7,0);ctx.lineTo(-11,-4);ctx.moveTo(-7,0);ctx.lineTo(-11,4);ctx.stroke();ctx.restore();
    }else if(l.effect==='wind'){
      ctx.save();ctx.globalAlpha*=presence;stroke(`M ${x-14} ${y} Q ${x} ${y-7} ${x+14} ${y-3}`,'rgba(255,224,159,.38)',.7);ctx.restore();
    }else if(l.effect==='moon'){
      ctx.strokeStyle=`rgba(255,237,187,${presence*.22})`;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(f.x,f.y,26+i*6+Math.sin(f.age)*3,17+i*4,a*.15,Math.PI*.2,Math.PI*1.6);ctx.stroke();
    }else if(l.effect==='lotus'){
      if(f.age<2.5){petal(l.x+Math.cos(a)*27,l.y-8+Math.sin(a)*9,5,a,.25*(1-f.age/2.5));}
    }else if(l.effect==='ruyi'){
      if(i<3){ctx.strokeStyle=`rgba(255,211,111,${presence*.45})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,5,a,a+Math.PI*1.6);ctx.stroke();}
    }else{
      glow(x,y,5,.25*presence);
    }
  }
  // A small, seeded constellation replaces the paper body during dissolution.
  if(f.dissolve>0){for(let i=0;i<12;i++){
    const a=i*2.399+l.seed,r=9+f.dissolve*(15+(i%4)*6),x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r*.75-f.dissolve*12;
    const alpha=Math.sin(f.dissolve*Math.PI)*(.3+(i%3)*.15);glow(x,y,4,alpha);ctx.fillStyle=`rgba(255,232,170,${alpha})`;ctx.beginPath();ctx.arc(x,y,.7+(i%2)*.5,0,Math.PI*2);ctx.fill();
  }}
  ctx.restore();
}

function drawResonance(pair,t){
  const a=pair.left,b=pair.right,s=pair.strength;
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2-18-Math.sin(pair.age*2.1+pair.seed)*8;
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=s;
  // A restrained three-layer ribbon makes the two independent paths feel connected.
  for(let i=0;i<3;i++){
    const offset=(i-1)*5,wave=Math.sin(pair.age*3+i+pair.seed)*4;
    ctx.beginPath();ctx.moveTo(a.x,a.y+offset);
    ctx.quadraticCurveTo(mx,my+wave,b.x,b.y-offset);
    ctx.strokeStyle=i===1?'rgba(255,235,176,.9)':'rgba(255,178,61,.34)';ctx.lineWidth=i===1?1.65:5.2;ctx.stroke();
  }
  for(let i=0;i<7;i++){
    const p=(pair.age*.28+i/7)%1,q=1-p;
    const x=q*q*a.x+2*q*p*mx+p*p*b.x,y=q*q*a.y+2*q*p*my+p*p*b.y;
    const pulse=.65+.35*Math.sin(pair.age*5+i);
    glow(x,y,10+i%2*4,.28*pulse*s);
    ctx.fillStyle=`rgba(255,244,201,${.65*pulse})`;ctx.beginPath();ctx.arc(x,y,1.3+(i%3)*.45,0,Math.PI*2);ctx.fill();
  }
  glow(mx,my,34,.28*s);
  if(pair.mode==='blossom'){
    for(let i=0;i<7;i++)petal(mx+Math.cos(i*2.1+t)*24,my+Math.sin(i*1.7+t)*14,4.2,i+t,.62*s);
  }else if(pair.mode==='water'){
    for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(255,220,142,${(.42-i*.1)*s})`;ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(mx,my+15+i*6,20+i*15,3+i,0,0,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.translate(mx+Math.sin(t*1.7)*12,my-2);ctx.rotate(Math.sin(t)*.2);ctx.strokeStyle='rgba(255,239,186,.68)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-9,0);ctx.quadraticCurveTo(0,-6,9,0);ctx.quadraticCurveTo(0,6,-9,0);ctx.lineTo(-13,-4);ctx.moveTo(-9,0);ctx.lineTo(-13,4);ctx.stroke();ctx.restore();
  }else if(pair.mode==='moon'){
    ctx.strokeStyle='rgba(255,241,199,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mx,my,16,Math.PI*.2,Math.PI*1.72);ctx.stroke();ctx.beginPath();ctx.arc(mx+7,my-4,13,Math.PI*.65,Math.PI*1.5);ctx.stroke();
  }else if(pair.mode==='wind'){
    for(let i=0;i<3;i++){const yy=my-8+i*8;stroke(`M ${mx-25-i*4} ${yy} Q ${mx} ${yy-9+Math.sin(t+i)*3} ${mx+27+i*5} ${yy-2}`,'rgba(255,228,166,.48)',.8);}
  }else{
    ctx.strokeStyle='rgba(255,219,135,.52)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mx-8,my,9,0,Math.PI*1.6);ctx.arc(mx+8,my,9,Math.PI,Math.PI*2.6);ctx.stroke();
  }
  ctx.restore();
}

function draw(t){
  ctx.fillStyle='#0d100e';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.translate(0,presentation?0:-CROP_Y);ctx.drawImage(baseLayer,0,0);
  ctx.save();ctx.clip(wall,'evenodd');
  if(ambient)drawAmbient(t);
  const state=engine.getState(),active=new Map(state.active.map(a=>[a.id,a]));
  const landscapeConfig=LANTERNS.find(l=>l.id==='landscape');
  if(samplePath)drawLandscapePath(landscapeConfig);
  for(const l of LANTERNS){
    const a=active.get(l.id),breath=ambient?Math.sin(t*.95+l.seed):0;
    drawReflection(l,a?.frame,t);
    const groundAlpha=a?(l.id==='landscape'?a.frame.returnOpacity:(a.frame.phase==='illuminating'?1:a.frame.returnOpacity)):1;
    // Background lamps remain source decoration until a clean plate is ready.
    if(backgroundClean&&groundAlpha>0){ctx.save();ctx.globalAlpha=groundAlpha;ctx.drawImage(idleSprites.get(l.id),l.x-70,l.y-70,140,140);ctx.restore();}
    if(!a){ctx.save();ctx.globalCompositeOperation='screen';glow(l.x,l.y,50,.075+breath*.025);ctx.restore();}
    if(hovered===l.id&&!a){ctx.save();ctx.globalCompositeOperation='screen';glow(l.x,l.y,58,.19);ctx.restore();}
  }
  const resonances=resonance.sample(state);
  canvas.dataset.resonances=String(resonances.length);
  const resonanceLabel=$('#resonance-count');if(resonanceLabel)resonanceLabel.textContent=resonances.length?` · ${resonances.length} 组邻灯共鸣`:' · 邻灯共鸣待触发';
  for(const pair of resonances)drawResonance(pair,t);
  for(const a of state.active){
    const l=a.config,f=a.frame;if(l.id==='landscape')drawLandscapeEffects(l,f,t);else drawSpecial(l,f,t);
    ctx.save();ctx.globalAlpha=f.opacity;
    if(l.id==='landscape')drawLandscapeLantern(ctx,f.x,f.y,f.scale,f.rotation,f,t+a.age);else drawLantern(ctx,l.type,f.x,f.y,f.scale,f.rotation,1+f.glow,t+a.age);
    ctx.restore();
  }
  const sampleFrame=active.get('landscape')?.frame;
  const stage=$('#sample-stage');if(stage)stage.textContent=!sampleFrame?'01｜待机':sampleFrame.phase==='illuminating'?'02｜唤醒':sampleFrame.phase==='ascending'?'03｜升起':'04｜消隐';
  canvas.dataset.landscapeAge=sampleFrame?sampleFrame.age.toFixed(2):'idle';canvas.dataset.landscapeStage=sampleFrame?.phase||'idle';
  drawSamplePreview(sampleFrame,t);
  for(let i=feedback.length-1;i>=0;i--){const item=feedback[i],age=engine.elapsed-item.at;if(age>1.2){feedback.splice(i,1);continue;}const l=LANTERNS.find(l=>l.id===item.id);ctx.save();ctx.globalCompositeOperation='screen';glow(l.x,l.y,55+age*15,(1-age/1.2)*.23);ctx.restore();}
  ctx.restore();ctx.restore();
}

function loop(now){
  // Use elapsed time rather than a capped frame step. Embedded preview tabs
  // may throttle frames; choreography must still finish on the real clock.
  const delta=lastTime?Math.max(0,(now-lastTime)/1000):0;lastTime=now;
  engine.update(document.hidden?0:delta);
  if(ambient&&!engine.paused&&!document.hidden)ambientTime+=delta*engine.speed;
  if(ready)draw(ambientTime);
  if(toastUntil&&now>toastUntil){$('#scene-toast').classList.remove('visible');toastUntil=0;}
  if(uiUntil&&now>uiUntil){document.body.classList.remove('ui-awake');uiUntil=0;}
  frameCount++;if(now-fpsTime>1000){fps=frameCount*1000/(now-fpsTime);fpsTime=now;frameCount=0;canvas.dataset.fps=String(Math.round(fps));canvas.dataset.time=engine.elapsed.toFixed(2);canvas.dataset.active=String(engine.active.size);canvas.dataset.clean=String(backgroundClean);}
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{lastTime=0;});

async function loadScene(){
  // Retain the supplied plate as an exact architectural fallback.
  try{await loadImage('./assets/clean-background.png');backgroundClean=true;}
  catch{await loadImage('./assets/xixi-reference.png');backgroundClean=false;}
  base.drawImage(image,0,0,W,H);ready=true;$('#loading').hidden=true;positionSensors();updateInterface();
}
function loadImage(url){return new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});}

$('#settings-button').addEventListener('click',()=>{const open=$('#settings-panel').hidden;$('#sample-panel').hidden=true;$('#sample-button').setAttribute('aria-expanded','false');$('#settings-panel').hidden=!open;$('#settings-button').setAttribute('aria-expanded',String(open));});
$('#close-settings').addEventListener('click',()=>{$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');});
$('#show-sensors').addEventListener('change',e=>scene.classList.toggle('show-sensors',e.target.checked));
$('#ambient-toggle').addEventListener('change',e=>ambient=e.target.checked);
$('#speed').addEventListener('input',e=>{$('#speed-output').textContent=Number(e.target.value).toFixed(2).replace(/0$/,'')+'×';engine.setSpeed(Number(e.target.value));});
$('#pause-button').addEventListener('click',()=>engine.setPaused(!engine.paused));
function reset(){engine.reset();resonance.reset();feedback.length=0;ambientTime=0;notify('灯火归位 · 春意静候');}
$('#reset-button').addEventListener('click',reset);
$('#random-button').addEventListener('click',()=>{const idle=LANTERNS.filter(l=>!engine.active.has(l.id));if(idle.length)triggerLantern(idle[Math.floor(Math.random()*idle.length)].id);});
$('#sample-button').addEventListener('click',()=>{const open=$('#sample-panel').hidden;$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');$('#sample-panel').hidden=!open;$('#sample-button').setAttribute('aria-expanded',String(open));});
$('#close-sample').addEventListener('click',()=>{$('#sample-panel').hidden=true;$('#sample-button').setAttribute('aria-expanded','false');});
$('#sample-replay').addEventListener('click',()=>{engine.restartLantern('landscape');feedback.push({id:'landscape',at:engine.elapsed,kind:'touch'});notify('山水灯样板 · 从唤醒阶段重播');});
function setSampleSpeed(value){engine.setSpeed(value);$('#speed').value=String(value);$('#speed-output').textContent=value.toFixed(1)+'×';$$sampleSpeed(value)}
function $$sampleSpeed(value){document.querySelectorAll('[data-sample-speed]').forEach(button=>button.classList.toggle('chosen',Number(button.dataset.sampleSpeed)===value))}
document.querySelectorAll('[data-sample-speed]').forEach(button=>button.addEventListener('click',()=>setSampleSpeed(Number(button.dataset.sampleSpeed))));
$('#sample-effects').addEventListener('change',e=>sampleEffects=e.target.checked);
$('#sample-path').addEventListener('change',e=>samplePath=e.target.checked);
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());
for(const id of ['close-help','help-start'])$('#'+id).addEventListener('click',()=>$('#help-dialog').close());
$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

function setPresentation(on){presentation=on;document.body.classList.toggle('presentation',on);canvas.height=on?H:CROP_H;positionSensors();wakeUI();}
function wakeUI(){if(presentation){document.body.classList.add('ui-awake');uiUntil=performance.now()+2200;}}
async function enterPresentation(){
  $('#settings-panel').hidden=true;$('#sample-panel').hidden=true;setPresentation(true);
  try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{/* Embedded previews still support the full-window exhibition view. */}
}
async function exitPresentation(){setPresentation(false);if(document.fullscreenElement)try{await document.exitFullscreen();}catch{}}
$('#fullscreen-button').addEventListener('click',enterPresentation);$('#exit-presentation').addEventListener('click',exitPresentation);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&presentation)setPresentation(false);});
document.addEventListener('pointermove',wakeUI,{passive:true});
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||$('#help-dialog').open)return;
  if(/^[1-9]$/.test(e.key))triggerLantern(LANTERNS[Number(e.key)-1].id);
  else if(e.code==='Space'){e.preventDefault();engine.setPaused(!engine.paused);}
  else if(e.key.toLowerCase()==='f'){e.preventDefault();presentation?exitPresentation():enterPresentation();}
  else if(e.key==='Escape'){if(presentation)exitPresentation();else{$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');}}
});
loadScene().catch(()=>{$('#loading').textContent='画卷未能载入，请刷新页面重试。';});
requestAnimationFrame(loop);
