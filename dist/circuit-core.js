(function(root){
const defaults={C:20,gK:1,EK:-90,gNa:0.05,ENa:60,gCl:0.2,ECl:-40,gL:0.1,EL:-60,ECa:120,J:0.1,eta:0.5,direction:1,I:10,f:10};
function solve(p){const G=p.gK+p.gNa+p.gCl+p.gL; if(!(p.C>0&&G>0&&p.f>0))throw Error('Capacitance, total conductance and frequency must be positive.');const electronCurrent=p.direction*96.48533212*p.J*p.eta;const ionicRest=(p.gK*p.EK+p.gNa*p.ENa+p.gCl*p.ECl+p.gL*p.EL)/G;const rest=ionicRest+electronCurrent/G;const tau=p.C/G;return {G,electronCurrent,ionicRest,rest,tau,cutoff:1000/(2*Math.PI*tau),step:rest+p.I/G,amplitude:Math.abs(p.I)/Math.hypot(G,2*Math.PI*p.f*p.C/1000),phase:Math.atan2(2*Math.PI*p.f*p.C/1000,G),calciumDrivingForce:p.ECa-rest};}
function pulse(p,t,duration){const r=solve(p);return r.rest+p.I/r.G*(t<=duration?1-Math.exp(-t/r.tau):(1-Math.exp(-duration/r.tau))*Math.exp(-(t-duration)/r.tau));}
const api={defaults,solve,pulse};if(typeof module!=='undefined')module.exports=api;else root.Circuit=api;
})(globalThis);
