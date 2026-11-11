import {blank,validate} from './model.mjs';
import {audit,history,lookup} from './audit.mjs';
import {example} from './example.mjs';
import {escape,projectJSON,reportJSON,cidrText,htmlReport,summarySVG} from './exports.mjs';
import {downloads,readProject} from './files.mjs';
export function mount(doc=document){
 const $=s=>doc.querySelector(s),form=$('#editor'),h=history(blank(),validate),dl=downloads();let dirty=false,page=0,token=0,disposed=false;
 const status=(text,error=false)=>{$('#status').textContent=text;$('#status').classList.toggle('error',error)};
 const fields=['title','labelA','labelB','listA','listB','notes'];
 function draft(){dirty=true;token++;$('#draft').textContent='Draft changes — analyze to update';doc.querySelectorAll('[data-export]').forEach(b=>b.disabled=true);$('#lookup button').disabled=true}
 function render(fill=true){const p=h.value,r=audit(p);if(fill){for(const k of fields)form.elements[k].value=p[k];dirty=false;$('#draft').textContent='Analyzed snapshot';$('#lookup-result').textContent='';}$('#snapshot').textContent=p.title+' · '+p.labelA+' / '+p.labelB;
 $('#metrics').innerHTML=['onlyA','both','onlyB','union'].map((k,i)=>'<div class="metric"><span>'+['Only A','In both','Only B','Union'][i]+'</span><strong>'+r.counts[k].toLocaleString('en-US')+'</strong><span>IPv4 addresses</span></div>').join('');
 $('#cover').textContent=r.cidrs[$('#category').value].join('\n')||'(empty coverage)';
 $('#sources').innerHTML=[...r.entriesA,...r.entriesB].map(e=>'<tr>'+[e.id,e.token,e.canonical,[e.normalized?'Host bits normalized':'Canonical input',e.bare?'Bare host → /32':'',e.duplicateOf?'Duplicate of '+e.duplicateOf:'',e.containedBy.length?'Contained by '+e.containedBy.join(', '):''].filter(Boolean).join('; ')].map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="4">No input entries.</td></tr>';
 const f=$('#filter').value,rows=r.segments.filter(s=>f==='all'||s.category===f),max=Math.max(1,Math.ceil(rows.length/20));page=Math.min(page,max-1);
 $('#segments').innerHTML=rows.slice(page*20,(page+1)*20).map(s=>'<tr>'+[s.first+' → '+s.last,s.count.toLocaleString('en-US'),s.category,s.sourceA.join(', ')||'—',s.sourceB.join(', ')||'—'].map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="5">No covered segments.</td></tr>';
 $('#page').textContent='Page '+(page+1)+' / '+max+' · '+rows.length+' segments';$('#previous').disabled=page===0;$('#next').disabled=page+1>=max;$('#undo').disabled=!h.canUndo;$('#redo').disabled=!h.canRedo;doc.querySelectorAll('[data-export]').forEach(b=>b.disabled=dirty);$('#lookup button').disabled=dirty;
 $('#sources-heading').textContent='Original-line receipts · '+r.entriesA.length+' A / '+r.entriesB.length+' B entries';}
 form.addEventListener('input',draft);form.addEventListener('change',draft);
 form.addEventListener('submit',e=>{e.preventDefault();try{const p={...h.value};for(const k of fields)p[k]=form.elements[k].value;h.commit(p);token++;page=0;render();status('Coverage analyzed. Save a project to keep the original inputs.')}catch(e){status(e.message,true)}});
 for(const [id,fn] of [['undo',()=>h.undo()],['redo',()=>h.redo()]])$('#'+id).addEventListener('click',()=>{token++;fn();page=0;render();status('Analyzed snapshot restored. Unanalyzed edits were discarded.')});
 for(const [id,p] of [['sample',example()],['new',blank()]])$('#'+id).addEventListener('click',()=>{token++;h.commit(p);page=0;render();status(id==='sample'?'Synthetic example loaded. Documentation ranges only.':'New empty review. Previous analyzed snapshot remains in undo history.')});
 $('#category').addEventListener('change',()=>render(false));$('#filter').addEventListener('change',()=>{page=0;render(false)});
 $('#previous').addEventListener('click',()=>{page--;render(false)});$('#next').addEventListener('click',()=>{page++;render(false)});
 $('#lookup').addEventListener('submit',e=>{e.preventDefault();if(dirty)return;try{const x=lookup(h.value,$('#lookup-address').value);$('#lookup-result').textContent=x.ip+' · '+x.category+' · A: '+(x.sourceA.map(e=>e.id).join(', ')||'none')+' · B: '+(x.sourceB.map(e=>e.id).join(', ')||'none')}catch(e){$('#lookup-result').textContent=e.message}});
 doc.querySelectorAll('[data-export]').forEach(button=>button.addEventListener('click',()=>{if(dirty)return;try{const p=h.value,k=button.dataset.export;const spec={project:[projectJSON(p),'application/json','project.json'],json:[reportJSON(p),'application/json','receipt.json'],html:[htmlReport(p),'text/html','report.html'],svg:[summarySVG(p),'image/svg+xml','summary.svg'],cidr:[cidrText(p,$('#category').value),'text/plain',$('#category').value+'.txt']}[k];dl.clear();dl.save(spec[0],spec[1],'prefixledger-'+spec[2]);status('Saved '+spec[2]+'. Full reports include every segment and original input.')}catch(e){status(e.message,true)}}));
 $('#open').addEventListener('change',async()=>{const file=$('#open').files[0],request=++token;if(!file)return;status('Reading project…');try{const p=await readProject(file);if(disposed||request!==token)return;h.commit(p);page=0;render();status('Project opened and validated.')}catch(e){if(!disposed&&request===token)status('Open failed: '+e.message,true)}finally{if(request===token)$('#open').value=''}});
 const unload=()=>dl.clear();doc.defaultView.addEventListener('pagehide',unload);render();return {get project(){return h.value},get dirty(){return dirty},dispose(){disposed=true;token++;dl.clear();doc.defaultView.removeEventListener('pagehide',unload)}}}
if(typeof document!=='undefined'&&document.querySelector('#workspace'))mount(document);
