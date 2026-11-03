import json,pathlib,shutil,html,re
p=pathlib.Path(__file__).parent;dest=p.parent/'research-site/dist/literature';dest.mkdir(exist_ok=True)
rows=json.loads((p/'catalogue.json').read_text());by={r['id']:r for r in rows};supp=json.loads((p/'supplement.json').read_text());log=json.loads((p/'search-log.json').read_text())
for r in supp['records']:
 key=(r.get('doi') or '').lower().strip() or r.get('source','')+':'+r['id']
 if key in by:
  by[key]['categories'].append('Additional cancer terminology');continue
 by[key]={'id':key,'title':r.get('title',''),'authors':r.get('authorString',''),'year':r.get('pubYear',''),'date':r.get('firstPublicationDate',''),'journal':r.get('journalTitle',''),'doi':r.get('doi',''),'pmid':r.get('pmid',''),'pmcid':r.get('pmcid',''),'source':r.get('source',''),'source_id':r['id'],'publication_type':r.get('pubType',''),'open_access':r.get('isOpenAccess',''),'categories':['Additional cancer terminology'],'status':'Awaiting relevance screening','url':'https://europepmc.org/article/'+r.get('source','MED')+'/'+r['id']}
rows=sorted(by.values(),key=lambda r:(r['date'],r['title']),reverse=True)
for r in rows:r['title']=re.sub(r'<[^>]+>','',html.unescape(r['title']))
assert len(rows)==len({r['id'] for r in rows})
assert all('2006-11-02'<=r['date']<='2026-11-02' for r in rows)
log['searches'].append(supp['log']);assert all(s['complete_pagination'] for s in log['searches'])
log['unique_records']=len(rows);log['preprints']=sum(r['source']=='PPR' for r in rows)
log['seed_pmid_checks']={i:any(r['pmid']==i for r in rows) for i in ['24380845','24176851','31534222','28087597','41572439','37709951']}
log['seed_check_note']='Six known examples recovered. This is not an estimate of overall recall.'
files=[]
for i in range(0,len(rows),1000):
 name=f'catalogue-{i//1000:03d}.json';(dest/name).write_text(json.dumps(rows[i:i+1000],ensure_ascii=False,separators=(',',':')));files.append(name)
log['data_files']=files
(dest/'search-log.json').write_text(json.dumps(log,ensure_ascii=False,indent=2))
for name in ['harvest.py','supplement.py','package.py']:shutil.copy(p/name,dest/name)
(dest/'README.txt').write_text('Cancer bioelectricity literature repository, 2006-11-02 to 2026-11-02.\nRun harvest.py, then supplement.py, to reproduce retrieval. package.py assembles the site data from those outputs.\nAll records are candidates awaiting screening. Topic labels indicate query matches, not confirmed mechanisms.\nThe data_files list in search-log.json contains the catalogue shards. Search-log.json records queries and retrieval counts.\nMetadata only. No copyrighted full texts are redistributed.\n')
print(json.dumps({'unique_records':len(rows),'preprints':log['preprints'],'searches':len(log['searches']),'shards':len(files),'seed_checks':log['seed_pmid_checks']}))
