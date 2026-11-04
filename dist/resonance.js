import {LANTERNS} from './engine.js';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
const modeFor=(a,b)=>{
  const effects=new Set([a.effect,b.effect]);
  if(effects.has('petals'))return'blossom';
  if(effects.has('fish')||effects.has('lotus'))return'water';
  if(effects.has('moon'))return'moon';
  if(effects.has('wind'))return'wind';
  return'scroll';
};

/** Tracks short-lived effects shared by physically adjacent lanterns. */
export class LanternResonance{
  constructor({lanterns=LANTERNS}={}){
    this.lanterns=[...lanterns].sort((a,b)=>a.x-b.x);
    this.runs=new Map();
    this.seen=new Set();
  }

  sample(state){
    const now=Number(state?.elapsed)||0;
    const active=new Map((state?.active||[]).map(item=>[item.id,item]));
    const pairs=[];
    for(let i=0;i<this.lanterns.length-1;i++){
      const leftConfig=this.lanterns[i],rightConfig=this.lanterns[i+1];
      const left=active.get(leftConfig.id),right=active.get(rightConfig.id);
      const bothRising=left?.frame?.phase==='ascending'&&right?.frame?.phase==='ascending';
      const key=left&&right?`${left.id}:${left.sequence}|${right.id}:${right.sequence}`:null;
      const pairId=`${leftConfig.id}-${rightConfig.id}`;
      if(bothRising&&key&&!this.seen.has(key)){
        this.seen.add(key);
        this.runs.set(pairId,{key,start:now,endedAt:null,mode:modeFor(leftConfig,rightConfig),seed:(i+1)*1.731,
          left:{id:left.id,x:left.frame.x,y:left.frame.y,scale:left.frame.scale},
          right:{id:right.id,x:right.frame.x,y:right.frame.y,scale:right.frame.scale}});
      }
      const run=this.runs.get(pairId);
      if(!run)continue;
      if(bothRising&&key===run.key){
        run.left={id:left.id,x:left.frame.x,y:left.frame.y,scale:left.frame.scale};
        run.right={id:right.id,x:right.frame.x,y:right.frame.y,scale:right.frame.scale};
      }else if(run.endedAt==null){run.endedAt=now;}
      const age=now-run.start;
      const fadeIn=smooth((age+.08)/.45);
      const naturalOut=1-smooth((age-3)/.8);
      const separationOut=run.endedAt==null?1:1-smooth((now-run.endedAt)/.72);
      const strength=clamp(fadeIn*Math.min(naturalOut,separationOut));
      if(strength>.001)pairs.push({id:pairId,age,strength,mode:run.mode,seed:run.seed,left:{...run.left},right:{...run.right}});
      if(age>3.85||(run.endedAt!=null&&now-run.endedAt>.75))this.runs.delete(pairId);
    }
    const crowdScale=1/Math.sqrt(1+Math.max(0,pairs.length-3)*.12);
    return pairs.map(pair=>({...pair,strength:pair.strength*crowdScale,activeCount:pairs.length}));
  }

  reset(){this.runs.clear();this.seen.clear();}
}
