'use strict';
(()=>{
const M=globalThis.ElectrochemicalHomeostasis, $=id=>document.getElementById(id);
const groups=[
['Compartment geometry / chemistry',[['C','Capacitance (pF)',0.01,500],['volumeIn','Intracellular volume (pL)',0.01,1000],['volumeOut','Extracellular volume (pL)',0.01,100000],['Nai','Intracellular Na (mM)',0.01,300],['Nao','Extracellular Na (mM)',0.01,300],['Ki','Intracellular K (mM)',0.01,300],['Ko','Extracellular K (mM)',0.01,300],['Cli','Intracellular Cl (mM)',0.01,300],['Clo','Extracellular Cl (mM)',0.01,300],['pHi','Intracellular pH',4,10],['pHo','Extracellular pH',4,10]]],
['Ion conductance (nS)',[['gNa','Na conductance',0,100],['gK','K conductance',0,100],['gCl','Cl conductance',0,100],['gH','H conductance',0,100],['gLeak','Leak conductance',0,100]]],
['Pumps / transporters / redox',[['pumpMax','Na/K pump capacity (pA)',0,100],['pumpFraction','Na/K pump activity (0–1)',0,1],['atpFactor','ATP availability (0–1)',0,1],['vatpMax','Proton pump capacity (pA)',0,100],['vatpFraction','Proton pump activity (0–1)',0,1],['nheMax','NHE exchanger capacity (pA-equivalent)',0,100],['nheFraction','NHE activity (0–1)',0,1],['betaIn','Intracellular buffer capacity (mM/pH)',0.01,1000],['betaOut','Extracellular buffer capacity (mM/pH)',0.01,1000],['electronFlux','Electron flux (fmol/s/cell)',0,1000],['eta','Uncompensated charge fraction',0,1],['acidLoad','Intracellular acid-load rate (pA-equivalent)',0,100]]],
['Stimulation / exchange',[['stimulus','Injected current (pA)',-100,100],['stimStart','Pulse start (ms)',0,10000],['stimEnd','Pulse end (ms)',0,10000],['bathTau','Bath exchange time (ms; 0 = closed)',0,1000000]]]
];
for(const [heading,items] of groups){const fs=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=heading;fs.append(legend);const grid=document.createElement('div');grid.className='fields';for(const [k,label,min,max] of items){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='number';input.id='p_'+k;input.step='any';input.min=min;input.max=max;l.append(input);grid.append(l)}fs.append(grid);$('controls').append(fs)}
const descriptors={voltage:[['V','V (mV)','#167b96']],ions:[['Nai','Na inside (mM)','#167b96'],['Ki','K inside (mM)','#aa723d'],['Ko','K outside (mM)','#7c60aa']],ph:[['pHi','pH inside','#167b96'],['pHo','pH outside','#aa723d']],nernst:[['ENa','E_Na (mV)','#167b96'],['EK','E_K (mV)','#aa723d']]};
let active='voltage',latest=null;
function loadDefaults(){for(const items of groups.map(g=>g[1]))for(const [k] of items)$('p_'+k).value=M.defaults[k];$('notes').value='';execute()}
function read(){const p={...M.defaults};for(const items of groups.map(g=>g[1]))for(const [k] of items){const inp=$('p_'+k);if(!inp.checkValidity()||inp.value.trim()==='')throw Error('Invalid '+k);p[k]=Number(inp.value)}M.validate(p);return p}
const fmt=v=>Math.abs(v)>10000||Math.abs(v)<0.001&&v!==0?v.toExponential(3):v.toFixed(4);
function draw(){
 if(!latest)return;const data=latest.points,series=descriptors[active],values=data.flatMap(p=>series.map(([k])=>p[k]));
 const min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*0.12,active==='ph'?0.005:0.01),lo=min-pad,hi=max+pad,maxT=data.at(-1).t;
 const x=t=>60+590*t/maxT,y=v=>269-225*(v-lo)/(hi-lo);let parts=['<path d="M60 28V269H652" fill="none" stroke="currentColor" stroke-width="1.3"/>'];
 for(let i=0;i<=4;i++){const val=lo+(hi-lo)*i/4,yy=y(val);parts.push('<path d="M60 '+yy+'H652" stroke="#b4cbd4" stroke-opacity=".5"/><text x="54" y="'+(yy+4)+'" font-size="12" text-anchor="end" fill="currentColor">'+fmt(val)+'</text>')}
 for(const [k,name,color] of series){const d=data.map((p,i)=>(i?'L':'M')+x(p.t).toFixed(2)+','+y(p[k]).toFixed(2)).join(' ');parts.push('<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.6"/>')}
 parts.push('<text x="60" y="294" fill="currentColor" font-size="12">0</text><text x="652" y="294" fill="currentColor" font-size="12" text-anchor="end">'+fmt(maxT/1000)+'</text><text x="355" y="321" fill="currentColor" font-size="13" text-anchor="middle">Time (seconds)</text>');
 $('plot').innerHTML=parts.join('');$('legend').textContent=series.map(x=>x[1]).join(' · ')+'; values are illustrative simulations, not observations.';
 for(const k of Object.keys(descriptors))$(k).style.fontWeight=k===active?'700':'400';
}
function render(){
 const r=latest,checks=r.conservation,metrics=[['Final voltage',r.final.V,'mV'],['Final K outside',r.final.Ko,'mM'],['Final Na inside',r.final.Nai,'mM'],['Final intracellular pH',r.final.pHi,''],['Final extracellular pH',r.final.pHo,''],['Electrogenic pump',r.observables.pump,'pA']];
 $('metrics').replaceChildren();for(const [label,v,unit] of metrics){const div=document.createElement('div');div.className='metric';const l=document.createElement('span');l.textContent=label;const strong=document.createElement('strong');strong.textContent=fmt(v)+' '+unit;div.append(l,strong);$('metrics').append(div)}
 $('conservation').replaceChildren();
 const data=[...Object.entries(checks.ions_mM_pL).map(([k,v])=>['Net '+k+' inventory change (mM·pL)',fmt(v)]),['Capacitor charge residual (fC)',fmt(checks.chargeResidual_fC)],['Closed bath?',r.parameters.bathTau===0?'Yes':'No — exchange enabled']];
 for(const [key,value] of data){const row=document.createElement('tr'),a=document.createElement('td'),b=document.createElement('td');a.textContent=key;b.textContent=value;row.append(a,b);$('conservation').append(row)}draw();
}
function execute(){try{$('error').textContent='';const p=read();latest=M.simulate(p,{duration:10000,dt:0.5});render();$('export').disabled=false;}catch(e){latest=null;$('error').textContent=e.message;$('export').disabled=true;$('plot').replaceChildren();}}
$('run').onclick=execute;$('reset').onclick=loadDefaults;
for(const k of Object.keys(descriptors))$(k).onclick=()=>{active=k;draw()};
$('export').onclick=()=>{if(!latest)return;const out={...latest,experimentNotes:$('notes').value,exportedAt:new Date().toISOString(),scientificStatus:'Illustrative and uncalibrated. Not a cancer-specific or clinical prediction.'},url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='electrochemical-homeostasis-v2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
loadDefaults();
})();
