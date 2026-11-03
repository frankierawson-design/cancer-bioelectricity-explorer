'use strict';
/* Exploratory lumped two-compartment electrochemical homeostasis model.
   Concentrations mM, volumes pL, conductances nS, V mV, time ms, currents pA.
   Pumps and exchange rates are hypothetical unless independently calibrated.
   Outward conventional membrane currents positive; electron export has inward sign.
*/
(function(root){
const F=96485.33212, R=8.314462618, T=310.15, thermal=1000*R*T/F;
const defaults=Object.freeze({
 C:20,volumeIn:2,volumeOut:200,temperature:310.15,
 Nai:12,Nao:145,Ki:140,Ko:5,Cli:30,Clo:110,pHi:7.2,pHo:7.4,
 gNa:0.06,gK:0.42,gCl:0.09,gH:0.0001,gLeak:0.05,ELeak:-60,
 pumpMax:1.2,pumpFraction:1,atpFactor:1,
 vatpMax:0.10,vatpFraction:1,nheMax:0.18,nheFraction:1,nheSetpoint:7.25,
 betaIn:25,betaOut:35,acidLoad:0,
 electronFlux:0.002,eta:0.5,electronDirection:1,
 stimulus:0,stimStart:1000,stimEnd:4000,
 bathTau:0
});
const keys=['C','volumeIn','volumeOut','temperature','Nai','Nao','Ki','Ko','Cli','Clo','pHi','pHo','gNa','gK','gCl','gH','gLeak','ELeak','pumpMax','pumpFraction','atpFactor','vatpMax','vatpFraction','nheMax','nheFraction','nheSetpoint','betaIn','betaOut','acidLoad','electronFlux','eta','electronDirection','stimulus','stimStart','stimEnd','bathTau'];
function validate(p){
 for(const k of keys)if(!Number.isFinite(p[k]))throw Error('Non-finite parameter: '+k);
 for(const k of ['C','volumeIn','volumeOut','temperature','Nai','Nao','Ki','Ko','Cli','Clo','betaIn','betaOut'])if(p[k]<=0)throw Error(k+' must be positive');
 for(const k of ['gNa','gK','gCl','gH','gLeak','pumpMax','vatpMax','nheMax','acidLoad','electronFlux','bathTau'])if(p[k]<0)throw Error(k+' must not be negative');
 for(const k of ['pumpFraction','vatpFraction','nheFraction','atpFactor','eta'])if(p[k]<0||p[k]>1)throw Error(k+' must lie between 0 and 1');
 if(Math.abs(p.electronDirection)!==1)throw Error('Electron direction must be +1 or -1');
 if(p.stimStart<0||p.stimEnd<p.stimStart)throw Error('Invalid current-pulse interval');
 return true;
}
const stateKeys=['V','Nai','Nao','Ki','Ko','Cli','Clo','pHi','pHo','qIntegral'];
function reversal(inside,outside,z,temperature){return 1000*R*temperature/(z*F)*Math.log(outside/inside)}
function initial(p){
 validate(p);
 const ENa=reversal(p.Nai,p.Nao,1,p.temperature),EK=reversal(p.Ki,p.Ko,1,p.temperature),ECl=reversal(p.Cli,p.Clo,-1,p.temperature);
 const protonE=1000*R*p.temperature/F*Math.log(10)*(p.pHi-p.pHo);
 const g=p.gNa+p.gK+p.gCl+p.gH+p.gLeak;
 return {V:g>0?(p.gNa*ENa+p.gK*EK+p.gCl*ECl+p.gH*protonE+p.gLeak*p.ELeak)/g:p.ELeak,Nai:p.Nai,Nao:p.Nao,Ki:p.Ki,Ko:p.Ko,Cli:p.Cli,Clo:p.Clo,pHi:p.pHi,pHo:p.pHo,qIntegral:0};
}
function rhs(s,p,t){
 for(const k of ['Nai','Nao','Ki','Ko','Cli','Clo'])if(s[k]<=0||!Number.isFinite(s[k]))throw Error('Non-physical concentration '+k);
 const ENa=reversal(s.Nai,s.Nao,1,p.temperature),EK=reversal(s.Ki,s.Ko,1,p.temperature),ECl=reversal(s.Cli,s.Clo,-1,p.temperature);
 const EH=1000*R*p.temperature/F*Math.LN10*(s.pHi-s.pHo);
 const INa=p.gNa*(s.V-ENa),IK=p.gK*(s.V-EK),ICl=p.gCl*(s.V-ECl),IH=p.gH*(s.V-EH),ILeak=p.gLeak*(s.V-p.ELeak);
 const pump=p.pumpMax*p.pumpFraction*p.atpFactor*s.Nai/(s.Nai+10)*s.Ko/(s.Ko+1.5);
 const vatp=p.vatpMax*p.vatpFraction*p.atpFactor;
 const nhe=p.nheMax*p.nheFraction*Math.min(1,Math.max(0,(p.nheSetpoint-s.pHi)/0.3));
 const eCurrent=96.48533212*p.electronFlux*p.eta*p.electronDirection;
 const applied=t>=p.stimStart&&t<p.stimEnd?p.stimulus:0;
 // Na/K ATPase: 3 Na outward, 2 K inward, 1 net charge outward/cycle.
 // NHE exchanges one Na inward for one proton outward (electroneutral).
 const naEq=INa+3*pump-nhe,kEq=IK-2*pump,clEq=ICl,hEq=IH+vatp+nhe;
 const outwardCurrent=INa+IK+ICl+IH+ILeak+pump+vatp-eCurrent-applied;
 // pA to mM/ms: I * 1e-12 / (F * volume[pL]*1e-12) = I/(F*volume[pL]).
 const ion=(i,z,v)=>i/(z*F*v);
 const dy={
 V:-outwardCurrent/p.C,
 Nai:-ion(naEq,1,p.volumeIn),Nao:ion(naEq,1,p.volumeOut),
 Ki:-ion(kEq,1,p.volumeIn),Ko:ion(kEq,1,p.volumeOut),
 Cli:-ion(clEq,-1,p.volumeIn),Clo:ion(clEq,-1,p.volumeOut),
 // Proton equivalents are buffered, not free H+ concentration.
 pHi:(ion(hEq-p.acidLoad,1,p.volumeIn))/p.betaIn,
 pHo:-ion(hEq,1,p.volumeOut)/p.betaOut,
 qIntegral:outwardCurrent
 };
 if(p.bathTau>0){
   for(const [k,target] of [['Nao','Nao'],['Ko','Ko'],['Clo','Clo']])dy[k]+=(p[target]-s[k])/p.bathTau;
   dy.pHo+=(p.pHo-s.pHo)/p.bathTau;
 }
 return {dy,observables:{ENa,EK,ECl,EH,INa,IK,ICl,IH,ILeak,pump,vatp,nhe,eCurrent,applied,outwardCurrent}};
}
function add(s,delta,h){
 const out={};for(const k of stateKeys)out[k]=s[k]+h*delta[k];return out;
}
function step(s,p,t,h){
 const a=rhs(s,p,t).dy,b=rhs(add(s,a,h/2),p,t+h/2).dy,c=rhs(add(s,b,h/2),p,t+h/2).dy,d=rhs(add(s,c,h),p,t+h).dy;
 const out={};for(const k of stateKeys)out[k]=s[k]+h*(a[k]+2*b[k]+2*c[k]+d[k])/6;
 return out;
}
function simulate(params={},settings={}){
 const p={...defaults,...params};validate(p);
 const duration=settings.duration??10000,dt=settings.dt??0.5;
 if(!Number.isFinite(dt)||dt<=0||dt>10||!Number.isFinite(duration)||duration<=0||duration>120000||duration/dt>250000)throw Error('Invalid duration or timestep');
 let s=initial(p);const start={...s},points=[],N=Math.ceil(duration/dt),sample=Math.max(1,Math.ceil(N/600));
 for(let i=0;i<=N;i++){
  const t=Math.min(i*dt,duration);
  if(i%sample===0||i===N)points.push({t,V:s.V,Nai:s.Nai,Ki:s.Ki,Ko:s.Ko,pHi:s.pHi,pHo:s.pHo,ENa:rhs(s,p,t).observables.ENa,EK:rhs(s,p,t).observables.EK});
  if(i===N)break;
  s=step(s,p,t,Math.min(dt,duration-t));
  if(!Number.isFinite(s.V)||Math.abs(s.V)>1e5)throw Error('Unstable trajectory');
 }
 const totals={};
 for(const k of ['Na','K','Cl']){
  totals[k]=(s[k+'i']*p.volumeIn+s[k+'o']*p.volumeOut)-(start[k+'i']*p.volumeIn+start[k+'o']*p.volumeOut);
 }
 const chargeResidual=p.C*(s.V-start.V)+s.qIntegral; // pF*mV = pA*ms = fC
 const protonBufferResidual=((-p.betaIn*s.pHi*p.volumeIn-p.betaOut*s.pHo*p.volumeOut)-(-p.betaIn*start.pHi*p.volumeIn-p.betaOut*start.pHo*p.volumeOut));
 return {model:'electrochemical-homeostasis-v2.0-exploratory',parameters:p,settings:{duration,dt},start,final:s,points,conservation:{ions_mM_pL:totals,chargeResidual_fC:chargeResidual,protonBufferDifference_mM_pL:protonBufferResidual},observables:rhs(s,p,duration).observables,assumptions:['Well-mixed finite intracellular/extracellular compartments','Ohmic fixed Na/K/Cl/H conductances with dynamic Nernst potentials','Lumped leak current is a phenomenological charge reservoir without a tracked ionic species','Na/K ATPase saturation phenomenology; no ATP dynamic state','V-ATPase and NHE rates are phenomenological','Proton equivalents buffered with constant buffer capacity (not free H+ concentrations)','TPMET electrons couple electrically; extracellular redox species not explicitly tracked','No field-to-cell coupling or cancer-specific calibration']};
}
const api={defaults,reversal,validate,initial,rhs,step,simulate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ElectrochemicalHomeostasis=api;
})(typeof globalThis!=='undefined'?globalThis:this);
