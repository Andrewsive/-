/** Original, resolution-independent lantern drawings. All sizes are scene pixels. */
const C = { edge:'#9b511e', dark:'#75411e', gold:'#dda13f', light:'#ffdd80', cream:'#fff0b0', red:'#bb492d', ink:'#976c39' };
export const lanternLabels = Object.freeze({plum:'梅枝灯',koi:'锦鲤灯',palace:'宫灯',lotus:'莲影灯',landscape:'山水灯',blossom:'春梅灯',bamboo:'竹影灯',ruyi:'如意灯',moon:'月白灯'});

function path(c,d,fill,stroke=C.edge,width=1){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
function line(c,d,color=C.edge,width=1){return path(c,d,null,color,width)}
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,v])=>g.addColorStop(p,v));return g}
function paper(c,x=-30,y=-32,w=60,h=64){return gradient(c,x,y,x+w,y+h,[[0,'#d99631'],[.2,'#ffe09a'],[.48,'#fff3bb'],[.77,'#ffda76'],[1,'#e8a13a']])}
function oval(c,x,y,rx,ry,fill,stroke=null,width=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function plinth(c,y=33,w=24){oval(c,0,y+3,w+2,3,'#8d4e21');path(c,`M ${-w} ${y-1} Q 0 ${y-4} ${w} ${y-1} L ${w} ${y+3} Q 0 ${y+5} ${-w} ${y+3} Z`,C.gold,C.edge,.8);line(c,`M ${-w+2} ${y-1} Q 0 ${y+1} ${w-2} ${y-1}`,'#fff0a0',1)}
function cap(c,y,w){path(c,`M ${-w} ${y} Q 0 ${y-5} ${w} ${y} L ${w-1} ${y+4} Q 0 ${y+1} ${-w+1} ${y+4} Z`,C.gold,C.edge,.9);line(c,`M ${-w+2} ${y+.5} Q 0 ${y-3} ${w-2} ${y+.5}`,'#ffea91',.9)}
function flower(c,x,y,r=3,turn=0,col=C.red){c.save();c.translate(x,y);c.rotate(turn);for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);oval(c,0,-r*.6,r*.47,r*.64,col)}oval(c,0,0,r*.23,r*.23,'#ffd370');c.restore()}
function plumBranch(c,t=0){line(c,'M -15 27 Q -7 13 0 3 Q 10 -8 13 -25 M -3 9 Q -15 4 -21 -8 M 4 -3 Q 19 -4 24 -17 M 10 -16 L -2 -25',C.red,1.5);line(c,'M -10 20 L 4 17 M -14 3 L -12 -8 M 17 -7 L 22 0 M 5 -20 L 3 -29',C.red,.7);[[-16,-6,2.5],[-7,5,2.8],[0,-23,3.4],[13,-22,3.4],[20,-13,2.7],[21,1,2.5],[-1,11,3.7],[2,20,2.4]].forEach(([x,y,r],i)=>flower(c,x,y,r,Math.sin(t*.8+i)*.06));}
function fish(c,x,y,s=1,a=0){c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);path(c,'M -11 0 Q -2 -10 10 -1 Q 3 9 -6 4 L -15 9 L -12 1 L -15 -7 Z',C.red,null);path(c,'M -5 -2 Q 3 -6 8 -1 Q 0 -2 -5 -2','#ffe3a2',null);line(c,'M -4 3 Q -3 8 1 6 M 0 -4 Q 1 -8 5 -6','#cc6b36',.8);oval(c,6,-1,1,1,C.dark);c.restore()}
function bamboo(c,t=0){c.save();c.rotate(Math.sin(t*.7)*.025);line(c,'M -6 30 Q -5 8 5 -30 M 12 28 Q 4 8 15 -25',C.ink,1.8);[-19,-6,10,24].forEach(y=>line(c,`M ${y<0?0:-6} ${y} L ${y<0?6:0} ${y-1}`,C.dark,.8));const leaves=[[-1,-19,-21,-28],[-1,-18,-16,-10],[4,-25,20,-34],[1,-6,21,-15],[-4,8,-21,-2],[-4,10,-24,15],[9,-8,28,-3],[8,8,25,19],[7,8,17,-4],[10,23,25,31]];leaves.forEach(([x,y,ex,ey])=>path(c,`M ${x} ${y} Q ${(x+ex)/2-3} ${(y+ey)/2-4} ${ex} ${ey} Q ${(x+ex)/2+3} ${(y+ey)/2+3} ${x} ${y}`,C.ink,null));c.restore()}
function landscape(c,t){const shift=Math.sin(t*.35)*1.2;path(c,`M -29 14 L -18 3 L -11 9 L 1 -5 L 12 9 L 20 3 L 30 15 L 30 28 L -29 28 Z`,'#cb9e57',null);path(c,`M -29 23 L -22 15 L -15 19 L -8 12 L 3 24 L 16 13 L 27 20 L 31 27 L -29 27 Z`,'#ac7840',null);line(c,`M -27 ${28+shift} Q -12 24 0 29 Q 12 25 28 27`,'#ffe9a2',1.2);line(c,'M -27 31 L 27 31 M -17 33 L 16 33','#b97c31',.6);oval(c,17,-15,6,6,'#ffedb5');line(c,'M -23 22 L -23 10 M -27 14 L -18 13 M -26 11 L -23 8 L -20 10',C.edge,.75)}
function woven(c,r=27){c.save();c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();for(let i=-52;i<54;i+=8){line(c,`M ${i} -35 Q ${i+14} 0 ${i+42} 35`,'#c58a32',.85);line(c,`M ${i} -35 Q ${i-14} 0 ${i-42} 35`,'#dc9f3a',.85)}c.restore()}

/** Layered Song-style landscape lantern. Structure never deforms; light, pattern and tassel animate independently. */
export function drawLandscapeLantern(c,x,y,scale=1,rotation=0,frame={},time=0){
  const f={lightCore:.44,paperLight:.34,patternReveal:1,externalGlow:.38,tasselAngle:Math.sin(time*.45)*.008,...frame};
  c.save();c.translate(x,y);c.rotate(rotation);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';
  if(f.externalGlow>0){const halo=c.createRadialGradient(0,-2,4,0,-2,58);halo.addColorStop(0,`rgba(255,212,123,${.14*f.externalGlow})`);halo.addColorStop(.52,`rgba(231,156,62,${.06*f.externalGlow})`);halo.addColorStop(1,'rgba(226,143,46,0)');oval(c,0,-2,58,55,halo)}
  // Top loop and carved cap.
  oval(c,0,-40,9,7,null,'#7a4627',1.35);oval(c,0,-40,6,4.5,null,'rgba(239,184,91,.72)',.7);
  line(c,'M -7 -36 L -13 -31 M 7 -36 L 13 -31','#764226',1.15);
  path(c,'M -31 -29 Q -19 -34 0 -35 Q 19 -34 31 -29 L 27 -24 Q 0 -27 -27 -24 Z',gradient(c,0,-35,0,-23,[[0,'#f0bd67'],[.34,'#a8612f'],[.72,'#7a4325'],[1,'#d28f43']]),'#6f3d23',1.1);
  line(c,'M -23 -28 Q 0 -31 23 -28','rgba(255,222,151,.65)',.7);
  const body=new Path2D('M -27 -24 L -21 -28 L 21 -28 L 27 -24 L 25 20 L 19 25 L -19 25 L -25 20 Z');
  // Internal source: bright at the core, darker at silk edges.
  c.save();c.clip(body);c.fillStyle='#c8833f';c.fillRect(-28,-29,56,56);
  const core=c.createRadialGradient(-3,3,2,-3,3,36);core.addColorStop(0,`rgba(255,244,190,${.72*f.lightCore})`);core.addColorStop(.34,`rgba(255,218,128,${.52*f.lightCore})`);core.addColorStop(1,'rgba(170,91,38,.15)');c.fillStyle=core;c.fillRect(-30,-30,60,60);
  const silk=gradient(c,-24,-26,25,24,[[0,`rgba(248,220,163,${.44+.18*f.paperLight})`],[.48,`rgba(255,242,204,${.32+.18*f.paperLight})`],[1,`rgba(214,154,91,${.38+.14*f.paperLight})`]]);c.fillStyle=silk;c.fillRect(-28,-29,56,58);
  // Fine silk fibres remain restrained at scene scale.
  c.globalAlpha=.13;for(let i=-25;i<30;i+=4)line(c,`M ${i} -29 L ${i+12} 27`,'#fff5d6',.35);for(let i=-24;i<27;i+=7)line(c,`M -28 ${i} L 28 ${i+2}`,'#8f5d39',.28);c.globalAlpha=1;
  // Ink landscape, bridge and water are separate from the paper light.
  c.save();c.globalAlpha=.3+.7*f.patternReveal;
  path(c,'M -24 10 Q -19 1 -12 5 Q -7 -6 0 1 Q 5 -9 12 -3 Q 18 2 24 10 L 24 18 L -24 18 Z','rgba(112,86,60,.25)',null);
  path(c,'M -24 14 Q -17 8 -11 12 Q -4 3 2 10 Q 10 2 15 10 Q 20 7 25 14 L 25 21 L -25 21 Z','rgba(116,74,48,.2)',null);
  line(c,'M -24 17 Q -13 13 -3 17 Q 8 20 24 16','rgba(112,69,43,.72)',.7);
  line(c,'M -23 20 Q -11 17 1 20 Q 12 22 24 19','rgba(166,102,51,.52)',.5);
  line(c,'M -12 15 Q 0 3 13 15 M -9 15 Q 0 8 10 15 M -13 15 L 14 15','rgba(92,61,43,.8)',.75);
  line(c,'M -19 14 L -19 7 M -23 9 L -15 9 M -22 7 L -19 4 L -16 7','rgba(117,66,40,.75)',.65);
  oval(c,17,-15,4.3,4.3,'rgba(184,72,45,.32)',null);oval(c,17,-15,3.2,3.2,'rgba(255,221,152,.44)',null);
  c.restore();c.restore();
  // Silk outline and six structural rails.
  c.strokeStyle='#754025';c.lineWidth=1.25;c.stroke(body);
  line(c,'M -21 -27 L -19 24 M 21 -27 L 19 24 M -27 -24 L -25 20 M 27 -24 L 25 20','#784126',1.25);
  line(c,'M -18 -24 L -16 21 M 18 -24 L 16 21','rgba(242,185,91,.65)',.55);
  path(c,'M -27 21 Q 0 25 27 21 L 24 27 Q 0 31 -24 27 Z',gradient(c,0,20,0,30,[[0,'#b76d33'],[.5,'#754025'],[1,'#cd8840']]),'#69381f',1);
  line(c,'M -20 25 Q 0 28 20 25','rgba(248,195,101,.55)',.6);
  // Cinnabar knot and delayed tassel swing.
  c.save();c.translate(0,28);c.rotate(f.tasselAngle||0);
  path(c,'M -3 0 Q 0 -3 3 0 L 2 6 Q 0 8 -2 6 Z','#ad4d35','#7b382b',.65);
  line(c,'M -1 6 Q -3 18 -5 34 M 1 6 Q 3 18 5 34 M 0 7 L 0 36','#a14a34',.7);
  line(c,'M -5 34 L -7 38 M 0 36 L 0 40 M 5 34 L 7 38','rgba(210,105,69,.8)',.65);c.restore();
  c.restore();
}

function rectangle(c,type,t){const w=type==='landscape'?29:22,h=type==='landscape'?25:31;const p=path(c,`M ${-w} ${-h} L ${w} ${-h} L ${w} ${h} L ${-w} ${h} Z`,paper(c,-w,-h,w*2,h*2),C.edge,1.4);c.save();c.clip(p);if(type==='plum'){c.scale(.88,.91);plumBranch(c,t)}else if(type==='landscape'){landscape(c,t)}else {c.save();c.scale(.8,.8);line(c,'M 0 30 Q -13 19 -4 7 Q 8 -5 4 -14 Q -1 -24 -12 -21 Q -23 -19 -18 -10 Q -13 -3 -5 -10 M 4 -14 Q 14 -26 23 -17 Q 30 -7 18 -4 Q 11 -4 9 -10',C.red,1.7);line(c,'M -15 25 Q -25 19 -17 13 Q -10 9 -8 16 M 13 21 Q 22 11 28 20',C.red,1.1);flower(c,2,-12,4,0,'#c37132');line(c,'M -18 -28 L -18 28 M 20 -28 L 20 28','#d4a042',.5);c.restore()}c.restore();line(c,`M ${-w+3} ${-h+3} L ${-w+3} ${h-3} M ${w-3} ${-h+3} L ${w-3} ${h-3}`,'#ffe6a0',1);cap(c,-h-3,w+2);plinth(c,h+1,w+1);if(type!=='landscape')line(c,`M -4 ${-h-3} Q -6 ${-h-10} 0 ${-h-10} Q 6 ${-h-10} 4 ${-h-3}`,C.edge,1.1)}
function roundLantern(c,type,t){const rx=type==='bamboo'?24:type==='moon'?28:35,ry=type==='bamboo'?34:type==='moon'?28:29;oval(c,0,0,rx,ry,paper(c,-rx,-ry,rx*2,ry*2),C.edge,1.1);const clip=new Path2D();clip.ellipse(0,0,rx-1,ry-1,0,0,Math.PI*2);c.save();c.clip(clip);if(type==='bamboo'){bamboo(c,t);for(let x=-16;x<=16;x+=16)line(c,`M ${x*.35} ${-ry} Q ${x*1.8} 0 ${x*.35} ${ry}`,'#d5a64d',.6)}else if(type==='koi'){c.save();c.rotate(Math.sin(t*.7)*.055);fish(c,9,-9,.85,.45+Math.sin(t*.3)*.05);fish(c,-7,8,.62,-2.5);c.restore();line(c,'M -25 11 Q -16 4 -8 13 Q 2 18 11 11 M -23 17 Q -12 11 -3 17 M 8 20 Q 16 15 25 18','#d6a644',.7);for(let i=0;i<3;i++){const x=-17+i*11;path(c,`M ${x} 28 Q ${x-7} 18 ${x-8} 15 Q ${x+2} 15 ${x+2} 24 Q ${x+7} 17 ${x+11} 16 Q ${x+12} 25 ${x} 28`,'#d57b36','#a85e28',.65)}}else{woven(c,rx-1);oval(c,-7,-6,14,14,'rgba(255,246,194,.36)');c.save();c.globalAlpha=.25;path(c,'M -14 9 Q -3 0 4 7 Q 10 13 18 6 M -16 13 Q 0 5 14 15',null,C.light,1);c.restore()}c.restore();cap(c,-ry-1,rx*.38);plinth(c,ry+1,rx*.52);if(type==='koi')line(c,'M -5 -30 Q -5 -37 0 -37 Q 5 -37 5 -30',C.edge,1)}
function palace(c,t){const sway=Math.sin(t*.6)*1.4;path(c,'M -28 -20 L 0 -26 L 28 -20 L 28 28 L 0 34 L -28 28 Z',paper(c,-30,-27,60,62),C.edge,1.2);path(c,'M 0 -26 L 28 -20 L 28 28 L 0 34 Z','rgba(206,126,37,.15)',null);[-27,-17,0,17,27].forEach(x=>line(c,`M ${x} ${-23+Math.abs(x)*.16} L ${x} ${32-Math.abs(x)*.15}`,x===0?'#b47625':'#ce9535',x===0?2:1.3));for(const [x,s] of [[-9,.8],[9,.7]]){c.save();c.translate(x,3);c.scale(s*.75,.65);path(c,'M 0 -22 Q -9 -18 -3 -11 Q -12 -3 -4 4 Q -11 13 0 20 Q 11 13 4 4 Q 12 -3 3 -11 Q 9 -18 0 -22',null,C.red,.9);flower(c,0,-3,3.2,0,'#bf7830');c.restore()}path(c,`M -35 -20 Q -17 -24 -3 -34 L 0 -40 L 3 -34 Q 18 -24 35 -20 L 30 -16 Q 0 -19 -30 -16 Z`,gradient(c,0,-40,0,-16,[[0,'#eac46a'],[.5,'#bc792c'],[1,'#fbd47a']]),C.edge,1);line(c,'M 0 -37 L 0 -23 M -22 -23 L -3 -32 M 22 -23 L 3 -32','#ffdb8a',.85);oval(c,0,-40,2,2,C.gold,C.edge,.5);plinth(c,34,28);c.save();c.translate(sway,0);line(c,'M 0 37 L 0 45',C.red,1.7);path(c,'M -2 42 L -4 49 L 4 49 L 2 42 Z',C.red,null);c.restore()}
function lotus(c,t){const open=1+Math.sin(t*.7)*.024;c.save();c.scale(open,1);const g=gradient(c,0,-27,0,28,[[0,'#fff2be'],[.35,'#ffe7a1'],[1,'#e9a234']]);for(const sign of [-1,1]){c.save();c.scale(sign,1);path(c,'M 0 25 Q -32 25 -39 -2 Q -15 0 0 25',g,C.edge,.8);path(c,'M 0 25 Q -30 8 -25 -15 Q -4 -7 0 25',g,C.edge,.8);path(c,'M 0 25 Q -19 0 -12 -24 Q 4 -10 0 25',g,C.edge,.8);c.restore()}path(c,'M 0 27 Q -18 -2 0 -30 Q 18 -2 0 27',g,C.edge,.85);line(c,'M 0 22 Q -2 3 0 -22','#edc26b',.65);for(const sign of [-1,1]){c.save();c.scale(sign,1);path(c,'M 0 27 Q -31 29 -32 9 Q -8 5 0 27',paper(c,-30,0,30,30),C.edge,.8);line(c,'M -25 13 Q -15 17 -3 25','#fff5c3',.85);c.restore()}oval(c,0,28,21,3,'#ffdd7f',C.edge,.8);plinth(c,31,22);c.restore()}
function blossom(c,t){c.save();c.rotate(Math.sin(t*.5)*.025);const g=paper(c,-34,-34,68,68);for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);path(c,'M 0 3 C -22 2 -25 -15 -16 -24 Q -1 -40 14 -27 C 27 -14 20 0 0 3',g,C.edge,.8);c.restore()}oval(c,0,0,10,10,'#ffd781',null);for(let i=0;i<15;i++){const a=i*Math.PI*2/15;line(c,`M ${Math.cos(a)*3} ${Math.sin(a)*3} L ${Math.cos(a)*14} ${Math.sin(a)*14}`,C.red,.8);oval(c,Math.cos(a)*14,Math.sin(a)*14,1.15,1.15,C.red)}oval(c,0,0,3,3,'#b66a27');c.restore();line(c,'M 0 29 L 0 35',C.edge,2);plinth(c,35,17)}

/**
 * Draw a lantern with its visual centre at x/y. Most silhouettes fit ±40×42;
 * palace has a tassel to +49. `time` is seconds, `rotation` is radians.
 * The soft halo reaches ~65 scene pixels; caller owns clipping and opacity.
 */
export function drawLantern(ctx,type,x,y,scale=1,rotation=0,brightness=1,time=0){
  if(type==='landscape'){drawLandscapeLantern(ctx,x,y,scale,rotation,{lightCore:.38+.26*brightness,paperLight:.32+.12*brightness,patternReveal:1,externalGlow:.2+.18*brightness},time);return}
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);
  ctx.lineJoin='round';ctx.lineCap='round';
  const b=Math.max(0,Math.min(2.5,brightness));
  const halo=ctx.createRadialGradient(0,0,3,0,0,64);
  halo.addColorStop(0,`rgba(255,203,102,${.12*b})`);halo.addColorStop(.48,`rgba(255,179,56,${.055*b})`);halo.addColorStop(1,'rgba(255,161,32,0)');
  oval(ctx,0,0,64,64,halo);
  ctx.globalAlpha*=Math.min(1,.78+b*.22);
  if(['plum','ruyi'].includes(type))rectangle(ctx,type,time);
  else if(['koi','bamboo','moon'].includes(type))roundLantern(ctx,type,time);
  else if(type==='palace')palace(ctx,time);
  else if(type==='lotus')lotus(ctx,time);
  else if(type==='blossom')blossom(ctx,time);
  else roundLantern(ctx,'moon',time);
  if(b>1){ctx.globalCompositeOperation='screen';const light=ctx.createRadialGradient(0,-3,0,0,-3,38);light.addColorStop(0,`rgba(255,235,160,${(b-1)*.16})`);light.addColorStop(1,'rgba(255,211,110,0)');oval(ctx,0,-3,38,38,light)}
  ctx.restore();
}
