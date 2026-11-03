import urllib.request,urllib.parse,json,time,concurrent.futures,pathlib,datetime
OUT=pathlib.Path(__file__).parent
cancer='TITLE_ABS:(cancer OR cancers OR tumor OR tumors OR tumour OR tumours OR neoplas* OR carcinoma* OR glioma* OR glioblastoma OR leukemi* OR leukaemi* OR lymphoma* OR melanoma* OR sarcoma* OR metastas*)'
base='(SRC:MED OR SRC:PPR) AND FIRST_PDATE:[2006-11-02 TO 2026-11-02] AND '+cancer
buckets={
'Bioelectricity and membrane voltage':'bioelectric* OR "membrane potential" OR "membrane voltage" OR "resting potential" OR depolari* OR hyperpolari*',
'Ion channels and electrophysiology':'(("ion channel" OR "ion channels" OR "potassium channel" OR "sodium channel" OR "calcium channel" OR "chloride channel" OR "proton channel") AND (voltage OR current OR conductance OR electrophysiolog* OR electrical)) OR "voltage gated" OR "voltage-gated"',
'Tumour–neuron electrical signalling':'((neuron* OR synap* OR neural) AND (glioma* OR cancer OR tumor OR tumour) AND (electrical OR electrophysiolog* OR depolari* OR "AMPA receptor" OR glutamatergic OR GABAergic))',
'Tumour treating fields':'"tumor treating fields" OR "tumour treating fields" OR TTFields OR "alternating electric fields"',
'Electroporation and electrochemotherapy':'electroporat* OR electrochemotherap* OR electroablat* OR "pulsed electric field" OR "pulsed electric fields" OR "nanosecond pulse" OR "nanosecond pulses"',
'Electrical stimulation and electrotaxis':'"electrical stimulation" OR "electric stimulation" OR "electric field" OR "electric fields" OR electrotaxis OR galvanotaxis OR electroceutical* OR "electrical therapy"',
'Bioelectronic materials and devices':'bioelectronic* OR nanoantenna* OR "nanotube porin" OR "nanotube porins" OR "conductive biomaterial" OR "conductive biomaterials" OR "conductive polymer" OR "conductive polymers" OR "bipolar electrode" OR "bipolar electrodes"',
'Electrical impedance and capacitance':'bioimpedance OR "electrical impedance" OR "membrane capacitance" OR "dielectric spectroscopy" OR "electrical properties" OR "dielectric properties"',
'Mitochondrial electrical potential':'"mitochondrial membrane potential" OR "mitochondrial potential"'
}
def fetch(q,cursor='*'):
 url='https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':q,'format':'json','pageSize':1000,'cursorMark':cursor,'resultType':'lite'})
 for attempt in range(4):
  try:
   with urllib.request.urlopen(url,timeout=90) as r:return json.load(r)
  except Exception:
   if attempt==3:raise
   time.sleep(2*(attempt+1))
def work(pair):
 name,terms=pair;q=base+' AND TITLE_ABS:('+terms+')';cursor='*';records=[];expected=None;pages=0
 while True:
  d=fetch(q,cursor);expected=d['hitCount'];batch=d.get('resultList',{}).get('result',[]);records.extend(batch);pages+=1
  nxt=d.get('nextCursorMark')
  if not batch or not nxt or nxt==cursor or len(records)>=expected:break
  cursor=nxt
 log={'category':name,'query':q,'hit_count':expected,'retrieved':len(records),'pages':pages,'complete_pagination':len(records)==expected}
 (OUT/(list(buckets).index(name).__str__()+'.json')).write_text(json.dumps({'log':log,'records':records}))
 print(json.dumps(log),flush=True);return name,records,log
allrecords={};logs=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for future in concurrent.futures.as_completed([pool.submit(work,p) for p in buckets.items()]):
  try:name,records,log=future.result()
  except Exception as e:logs.append({'error':str(e)});continue
  logs.append(log)
  for r in records:
   key=(r.get('doi') or '').lower().strip() or r.get('source','')+':'+r['id']
   if key not in allrecords:
    allrecords[key]={'id':key,'title':r.get('title',''),'authors':r.get('authorString',''),'year':r.get('pubYear',''),'date':r.get('firstPublicationDate',''),'journal':r.get('journalTitle',''),'doi':r.get('doi',''),'pmid':r.get('pmid',''),'pmcid':r.get('pmcid',''),'source':r.get('source',''),'source_id':r['id'],'publication_type':r.get('pubType',''),'open_access':r.get('isOpenAccess',''),'categories':[],'status':'Awaiting relevance screening','url':'https://europepmc.org/article/'+r.get('source','MED')+'/'+r['id']}
   if name not in allrecords[key]['categories']:allrecords[key]['categories'].append(name)
records=sorted(allrecords.values(),key=lambda x:(x['year'],x['title']),reverse=True)
manifest={'version':4,'retrieved_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'date_start':'2006-11-02','date_end':'2026-11-02','database':'Europe PMC','search_fields':'Title and abstract','included_sources':['MED','PPR'],'deduplication':'Lowercase DOI, otherwise source + identifier','unique_records':len(records),'searches':logs,'coverage_status':'Expanded search collection; not exhaustive or systematically screened','scope_note':'Mitochondrial-potential-only papers are a separate adjacent collection. Query categories are retrieval tags, not verified mechanisms.'}
(OUT/'catalogue.json').write_text(json.dumps(records,ensure_ascii=False,separators=(',',':')))
(OUT/'search-log.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('TOTAL',len(records),flush=True)
