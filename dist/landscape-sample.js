const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
const smoother=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)};
const cubic=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};

export const LANDSCAPE_TIMING=Object.freeze({wakeEnd:.95,riseEnd:5.55,fadeEnd:8});

/** Four-stage choreography for the refined landscape lantern only. */
export function sampleLandscapeLantern(config,age=0){
  const duration=config.duration||LANDSCAPE_TIMING.fadeEnd;
  const time=clamp(Number.isFinite(age)?age:0,0,duration);
  const wake=smooth(time/LANDSCAPE_TIMING.wakeEnd);
  const ignition=smooth(time/.55);
  const riseRaw=clamp((time-LANDSCAPE_TIMING.wakeEnd)/(LANDSCAPE_TIMING.riseEnd-LANDSCAPE_TIMING.wakeEnd));
  const rise=smoother(riseRaw);
  const fade=smooth((time-LANDSCAPE_TIMING.riseEnd)/(duration-LANDSCAPE_TIMING.riseEnd));
  const p=config.path;
  const startX=config.x,startY=config.y-7*wake;
  const x=cubic(startX,startX+32,p.endX-30,p.endX,rise)+Math.sin(riseRaw*Math.PI*2.2+config.seed)*4.2*Math.sin(riseRaw*Math.PI);
  const y=cubic(startY,startY-50,p.endY+24,p.endY,rise)-fade*17;
  const wakeSway=Math.sin(time*5.3)*.018*Math.sin(clamp(time/.7)*Math.PI);
  const windSway=Math.sin(time*1.42+config.seed)*.026*Math.sin(riseRaw*Math.PI);
  const rotation=wakeSway+windSway;
  const scale=(1+.018*Math.sin(wake*Math.PI))*(1-.22*rise)*(1-.42*fade);
  const bodyOpacity=1-smooth((time-6.05)/1.62);
  const externalGlow=(.5+.74*wake)*(1-smooth((time-5.55)/.78));
  const returnOpacity=smooth((time-6.55)/1.25);
  const lightCore=(.42+1.02*ignition)*(1-.42*fade);
  const paperLight=(.31+.6*smooth(time/.78))*(1-.25*fade);
  const patternReveal=smooth((time-.12)/.72)*(1-.28*fade);
  const reflectionOpacity=(1-.82*smooth((time-.5)/2.5))*(1-fade);
  const tasselAngle=-rotation*1.9+Math.sin(time*2.35+.7)*(.018+.055*riseRaw)*(1-.45*fade);
  const phase=time>=duration?'idle':time>=LANDSCAPE_TIMING.riseEnd?'dissolving':time>=LANDSCAPE_TIMING.wakeEnd?'ascending':'illuminating';
  return {
    id:config.id,age:time,duration,progress:time/duration,phase,x,y,scale,rotation,
    opacity:bodyOpacity,bodyOpacity,glow:externalGlow,externalGlow,lightCore,paperLight,
    patternReveal,reflectionOpacity,tasselAngle,motionProgress:rise,dissolve:fade,
    returnOpacity,ringProgress:clamp(time/1.35),trailOpacity:smooth((time-.72)/.6)*(1-fade),
    particleOpacity:smooth((time-1.15)/.7)*(1-fade),wakeProgress:wake,riseProgress:riseRaw,
  };
}
