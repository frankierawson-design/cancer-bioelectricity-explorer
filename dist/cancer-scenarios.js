'use strict';
(function(){
const M=globalThis.CancerScenario, $=id=>document.getElementById(id);
const fields=[
['C','Membrane capacitance (pF)',0.001,10000],
['gK','K conductance maximum (nS)',0,1000],['EK','K reversal potential (mV)',-300,300],
['gNa','Na conductance (nS)',0,1000],['ENa','Na reversal potential (mV)',-300,300],
['gCl','Cl conductance (nS)',0,1000],['ECl','Cl reversal potential (mV)',-300,300],
['gL','Leak conductance (nS)',0,1000],['EL','Leak reversal potential (mV)',-300,300],
['J','Direct electron flux (fmol/s/cell)',0,1000],['eta','Uncompensated charge fraction',0,1],
['channelFraction','Voltage-gated K fraction',0,1],['tauGate','K gate relaxation (ms)',0.0001,100000],
['voltageHalf','Half-activation (mV)',-300,300],['slope','Gate slope (mV)',0.0001,300]
];
let current=null,params=null,record=null;
for(const preset of M.presets){const o=document.createElement('option');o.value=preset.id;o.textContent=preset.name;$('preset').append(o)}
for(const [key,title,min,max] of fields){const l=document.createElement('label');l.textContent=title;const i=document.createElement('input');i.id='p_'+key;i.type='number';i.step='any';i.min=min;i.max=max;l.append(i);$('inputs').append(l)}
const ref=M.presets[0], setting={duration:500,dt:0.05,stim:10,stimStart:100,stimEnd:300};
function copyPreset(){const p=M.presets.find(x=>x.id===$('preset').value)||ref;for(const [key] of fields)$('p_'+key).value=p[key];$('scenarioStatus').textContent=p.status+'. No calibration or measured parameter provenance supplied.';$('provenance').value='';$('hypothesis').value='';calculate()}
function read(){const p={};for(const [key] of fields){const i=$('p_'+key);if(!i.checkValidity()||i.value.trim()==='')throw Error('Enter a valid value for '+key);p[key]=Number(i.value)}M.validate(p);return p}
function f(n){return Math.abs(n)>9999||Math.abs(n)<0.001&&n!==0?n.toExponential(2):n.toFixed(3)}
function line(points,min,max,vMin,vMax){return points.map((point,i)=> (i?'L':'M')+(58+585*point.t/max).toFixed(2)+' '+(265-225*(point.v-vMin)/(vMax-vMin)).toFixed(2)).join(' ')}
function plot(a,b){const all=a.points.concat(b.points),lo=Math.min(...all.map(x=>x.v)),hi=Math.max(...all.map(x=>x.v)),padding=Math.max(1,(hi-lo)*.15),vMin=lo-padding,vMax=hi+padding,max=500;
let out='<path d="M58 29V265H646" fill="none" stroke="#7899a9" stroke-width="2"/>';
for(let k=0;k<=4;k++){const y=265-225*k/4;out+='<path d="M58 '+y+'H646" stroke="#e0eaf0"/><text x="51" y="'+(y+4)+'" font-size="12" fill="currentColor" text-anchor="end">'+f(vMin+(vMax-vMin)*k/4)+'</text>'}
out+='<path d="'+line(b.points,0,max,vMin,vMax)+'" stroke="#8797a6" stroke-width="2.5" fill="none"/>';
out+='<path d="'+line(a.points,0,max,vMin,vMax)+'" stroke="#057a94" stroke-width="3" fill="none"/>';
out+='<text x="18" y="17" fill="currentColor" font-size="13">V (mV)</text><text x="58" y="288" fill="currentColor" font-size="12">0</text><text x="646" y="288" fill="currentColor" text-anchor="end" font-size="12">500</text><text x="350" y="313" fill="currentColor" text-anchor="middle" font-size="13">Time (ms)</text>';
$('plot').innerHTML=out;$('legend').textContent='Teal: '+$('preset').selectedOptions[0].textContent+' | Grey: illustrative reference (same 10 pA current pulse).';
}
function calculate(){try{$('error').textContent='';params=read();const sim=M.simulate(params,setting),reference=M.simulate(ref,setting);current=sim;plot(sim,reference);const last=sim.final,first=sim.points[0],baseline=reference.final;
$('metrics').replaceChildren();for(const [name,value,unit] of [['Starting voltage',first.v,'mV'],['Final voltage',last.v,'mV'],['Final gate occupancy',last.n,''],['TPMET current',sim.current,'pA'],['Difference vs reference',last.v-baseline.v,'mV'],['Reference final voltage',baseline.v,'mV']]){const d=document.createElement('div');d.className='metric';const label=document.createElement('span');label.textContent=name;const strong=document.createElement('strong');strong.textContent=f(value)+' '+unit;d.append(label,strong);$('metrics').append(d)}
$('comparison').replaceChildren();for(const [k,label] of fields){const tr=document.createElement('tr');for(const value of [label,f(params[k]),f(ref[k])]){const td=document.createElement('td');td.textContent=value;tr.append(td)}$('comparison').append(tr)}
record={model:M.schema,scenario:$('preset').value,scenarioStatus:'illustrative, not independently calibrated',parameters:params,reference:ref,numericalSettings:setting,summary:{initialVoltage:first.v,finalVoltage:last.v,referenceFinalVoltage:baseline.v,netTPMETCurrent:sim.current,finalGate:sim.final.n},trajectory:sim.points,referenceTrajectory:reference.points,assumptions:'Generic voltage-gated K conductance, fixed Na/Cl/leak conductances, prescribed direct electron flux and charge-compensation fraction; not fitted to any cancer; injected current rather than external field.'};
$('export').disabled=false;
}catch(e){record=null;$('export').disabled=true;$('error').textContent=e.message;}}
$('preset').addEventListener('change',copyPreset);$('run').addEventListener('click',calculate);$('reset').addEventListener('click',copyPreset);
$('export').addEventListener('click',()=>{calculate();if(!record)return;const data={...record,exportedAt:new Date().toISOString(),provenance:$('provenance').value.trim(),userHypothesis:$('hypothesis').value.trim()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='exploratory-cancer-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
copyPreset();
})();
