'use strict';
/* Experimental scenario engine. No preset is a measured tumour-cell parameter set.
   mV, pF, nS, ms, pA and Hz. Positive currents are inward conventional currents. */
(function(root){
const schema='cancer-scenario-0.1-exploratory';
const presets=[
{id:'reference',name:'Reference membrane (illustrative)',cancer:'Reference',C:20,gK:1,EK:-90,gNa:0.05,ENa:60,gCl:0.2,ECl:-40,gL:0.1,EL:-60,J:0.1,eta:0.5,channelFraction:0.5,tauGate:15,voltageHalf:-35,slope:12,status:'illustrative, not measured',source:''},
{id:'gbm',name:'Glioblastoma · hypothetical scenario',cancer:'Glioblastoma',C:28,gK:0.75,EK:-90,gNa:0.08,ENa:60,gCl:0.25,ECl:-40,gL:0.13,EL:-60,J:0.13,eta:0.5,channelFraction:0.5,tauGate:15,voltageHalf:-35,slope:12,status:'hypothetical scenario; NOT a GBM measurement',source:''},
{id:'breast',name:'Breast cancer · hypothetical scenario',cancer:'Breast cancer',C:24,gK:0.85,EK:-90,gNa:0.07,ENa:60,gCl:0.23,ECl:-40,gL:0.13,EL:-60,J:0.11,eta:0.5,channelFraction:0.5,tauGate:15,voltageHalf:-35,slope:12,status:'hypothetical scenario; NOT a breast cancer measurement',source:''},
{id:'colorectal',name:'Colorectal cancer · hypothetical scenario',cancer:'Colorectal cancer',C:22,gK:0.95,EK:-90,gNa:0.06,ENa:60,gCl:0.24,ECl:-40,gL:0.12,EL:-60,J:0.12,eta:0.5,channelFraction:0.5,tauGate:15,voltageHalf:-35,slope:12,status:'hypothetical scenario; NOT a colorectal cancer measurement',source:''}
];
const must=['C','gK','gNa','gCl','gL','J','eta','channelFraction','tauGate','voltageHalf','slope','EK','ENa','ECl','EL'];
function validate(p){
 for(const k of must)if(!Number.isFinite(p[k]))throw Error('Non-finite '+k);
 if(p.C<=0||p.tauGate<=0||p.slope<=0)throw Error('Capacitance and time constants must be positive');
 for(const k of ['gK','gNa','gCl','gL','J'])if(p[k]<0)throw Error(k+' cannot be negative');
 if(p.eta<0||p.eta>1||p.channelFraction<0||p.channelFraction>1)throw Error('Fractions must be within [0,1]');
 if(p.gK+p.gNa+p.gCl+p.gL<=0)throw Error('Total conductance must be positive');
 return true;
}
function gateInf(v,p){return 1/(1+Math.exp(-(v-p.voltageHalf)/p.slope))}
function transport(p){return 96.48533212*p.J*p.eta}
function derivative(v,n,p,i=0){
 const gK=p.gK*((1-p.channelFraction)+p.channelFraction*n);
 const ionic=gK*(v-p.EK)+p.gNa*(v-p.ENa)+p.gCl*(v-p.ECl)+p.gL*(v-p.EL);
 return {dv:(-ionic+transport(p)+i)/p.C,dn:(gateInf(v,p)-n)/p.tauGate,ionic,gK};
}
function simulate(p,opts={}){
 validate(p);
 const dt=opts.dt??0.05, duration=opts.duration??500,stim=opts.stim??0,stimStart=opts.stimStart??100,stimEnd=opts.stimEnd??300;
 if(!Number.isFinite(dt)||dt<=0||dt>10||!Number.isFinite(duration)||duration<=0||duration>20000||Math.ceil(duration/dt)>200000)throw Error('Invalid simulation resolution');
 const g=p.gK+p.gNa+p.gCl+p.gL;
 let v=(p.gK*p.EK+p.gNa*p.ENa+p.gCl*p.ECl+p.gL*p.EL+transport(p))/g;
 let n=gateInf(v,p);
 const out=[];
 const rhs=(vv,nn,t)=>derivative(vv,nn,p,t>=stimStart&&t<stimEnd?stim:0);
 for(let j=0;j<=Math.ceil(duration/dt);j++){
  const t=Math.min(j*dt,duration);
  if(j%Math.max(1,Math.ceil(1/dt))===0||j===Math.ceil(duration/dt))out.push({t,v,n});
  if(j===Math.ceil(duration/dt))break;
  const h=Math.min(dt,duration-t);
  const a=rhs(v,n,t),b=rhs(v+a.dv*h/2,n+a.dn*h/2,t+h/2),c=rhs(v+b.dv*h/2,n+b.dn*h/2,t+h/2),d=rhs(v+c.dv*h,n+c.dn*h,t+h);
  v+=h*(a.dv+2*b.dv+2*c.dv+d.dv)/6;n+=h*(a.dn+2*b.dn+2*c.dn+d.dn)/6;
  if(!Number.isFinite(v)||!Number.isFinite(n))throw Error('Unstable or nonfinite trajectory');
 }
 return {model:schema,points:out,final:out.at(-1),current:transport(p)};
}
const api={schema,presets,validate,gateInf,transport,derivative,simulate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CancerScenario=api;
})(typeof globalThis!=='undefined'?globalThis:this);
