const assert=require('node:assert/strict');
const M=require('../dist/cancer-scenario-core.js');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
assert.equal(M.presets.length,4);
for(const p of M.presets){
 M.validate(p);
 const r=M.simulate(p);
 assert.equal(r.model,M.schema);
 assert.ok(r.points.length>100);
 assert.ok(r.points.every(x=>Number.isFinite(x.v)&&Number.isFinite(x.n)&&x.n>=-1e-6&&x.n<=1+1e-6));
 assert.ok(r.final.t>=499.99);
}
const p=M.presets[0];
near(M.transport({...p,J:0}),0);
near(M.transport({...p,eta:0}),0);
near(M.transport({...p,J:2*p.J}),2*M.transport(p));
near(M.gateInf(p.voltageHalf,p),0.5);
near(M.gateInf(p.voltageHalf+10*p.slope,p)>0.5?1:0,1);
const A=M.simulate(p,{duration:100,stim:0});
const B=M.simulate({...p,C:2*p.C},{duration:100,stim:0});
assert.ok(Number.isFinite(A.final.v)&&Number.isFinite(B.final.v));
const noPulse=M.simulate(p,{duration:500,stim:0}),pulse=M.simulate(p,{duration:500,stim:10});
assert.ok(Math.abs(pulse.points.find(x=>x.t>=200).v-noPulse.points.find(x=>x.t>=200).v)>0.01);
assert.ok(Math.abs(pulse.final.v-noPulse.final.v)<0.1);
for(const invalid of [{...p,C:0},{...p,eta:1.1},{...p,channelFraction:-0.1},{...p,tauGate:0},{...p,slope:0},{...p,gK:0,gNa:0,gCl:0,gL:0}])
 assert.throws(()=>M.simulate(invalid));
assert.throws(()=>M.simulate(p,{dt:0}));
console.log('PASS: exploratory scenario numerical consistency, invariants, pulse recovery and invalid input checks. Not biological validation.');
