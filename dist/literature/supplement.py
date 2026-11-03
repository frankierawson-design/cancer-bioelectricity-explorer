import ast,pathlib,urllib.request,urllib.parse,json
p=pathlib.Path(__file__).parent
nodes=ast.parse((p/'harvest.py').read_text()).body
vals={}
for n in nodes:
 if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ['cancer','buckets']:vals[n.targets[0].id]=ast.literal_eval(n.value)
extra='TITLE_ABS:(malignan* OR oncolog* OR myeloma* OR neuroblastoma* OR medulloblastoma* OR retinoblastoma* OR mesothelioma* OR myelodysplas* OR osteosarcoma* OR gliosarcoma* OR rhabdomyosarcoma* OR chordoma* OR ependymoma*)'
q='(SRC:MED OR SRC:PPR) AND FIRST_PDATE:[2006-11-02 TO 2026-11-02] AND '+extra+' AND NOT '+vals['cancer']+' AND TITLE_ABS:('+ ' OR '.join('('+v+')' for v in vals['buckets'].values())+')'
rows=[];cursor='*'
while True:
 u='https://www.ebi.ac.uk/europepmc/webservices/rest/search?'+urllib.parse.urlencode({'query':q,'format':'json','pageSize':1000,'cursorMark':cursor})
 with urllib.request.urlopen(u,timeout=90) as r:d=json.load(r)
 rows+=d['resultList']['result'];n=d['hitCount'];nxt=d.get('nextCursorMark')
 if len(rows)>=n or not nxt or nxt==cursor:break
 cursor=nxt
log={'category':'Additional cancer terminology','query':q,'hit_count':n,'retrieved':len(rows),'complete_pagination':n==len(rows)}
(p/'supplement.json').write_text(json.dumps({'log':log,'records':rows}))
print('Additional records',n)
