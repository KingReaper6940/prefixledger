import {parseList} from './ipv4.mjs';
export const SCHEMA='prefixledger-project-v1';
function text(v,max,name,multi=false){if(typeof v!=='string'||v.length>max||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)||(!multi&&/[\r\n]/.test(v)))throw Error('Invalid '+name+' or exceeds '+max+' characters.');}
export function validate(p){
 const keys=['schema','title','labelA','labelB','listA','listB','notes'];if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!==keys.sort().join('|')||p.schema!==SCHEMA)throw Error('Unsupported project fields or version.');
 for(const [k,max] of [['title',80],['labelA',48],['labelB',48]]){text(p[k],max,k);if(!p[k].trim())throw Error('Title and list labels must not be blank.');}
 text(p.notes,1000,'notes',true);for(const side of ['A','B']){text(p['list'+side],60000,'List '+side,true);try{parseList(p['list'+side],side.toLowerCase());}catch(e){throw Error('List '+side+': '+e.message);}}return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled coverage review',labelA:'List A',labelB:'List B',listA:'',listB:'',notes:''});
export function parseProject(source){if(typeof source!=='string'||source.length>300000)throw Error('Project exceeds 300,000 characters.');return clone(JSON.parse(source));}
