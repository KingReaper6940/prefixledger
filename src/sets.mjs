import {SPACE,dotted,parseList} from './ipv4.mjs';import {validate} from './model.mjs';
export const CATEGORIES=['onlyA','both','onlyB','union','a','b'];
function validRange([s,e]){if(!Number.isInteger(s)||!Number.isInteger(e)||s<0||e>SPACE||s>=e)throw Error('Invalid half-open IPv4 range.');}
export function mergeRanges(input){
 const rows=input.map(r=>{validRange(r);return [...r];}).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),out=[];
 for(const r of rows){const last=out.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push(r);}return out;
}
export function intersectRanges(a,b){const out=[];let i=0,j=0;while(i<a.length&&j<b.length){const start=Math.max(a[i][0],b[j][0]),end=Math.min(a[i][1],b[j][1]);if(start<end)out.push([start,end]);if(a[i][1]<b[j][1])i++;else j++;}return mergeRanges(out);}
export function subtractRanges(a,b){const out=[];for(const [start,end] of a){let cursor=start;for(const [bs,be] of b){if(be<=cursor)continue;if(bs>=end)break;if(bs>cursor)out.push([cursor,Math.min(bs,end)]);cursor=Math.max(cursor,be);if(cursor>=end)break;}if(cursor<end)out.push([cursor,end]);}return out;}
export const measure=rows=>rows.reduce((n,[s,e])=>n+e-s,0);
export function rangeCIDRs(start,end){
 validRange([start,end]);const out=[];let cursor=start;
 while(cursor<end){let size=1;while(size*2<=end-cursor&&size*2<=SPACE&&cursor%(size*2)===0)size*=2;out.push(dotted(cursor)+'/'+(32-Math.log2(size)));cursor+=size;}return out;
}
export function coverage(p){
 validate(p);const entriesA=parseList(p.listA,'a'),entriesB=parseList(p.listB,'b'),a=mergeRanges(entriesA.map(x=>[x.start,x.end])),b=mergeRanges(entriesB.map(x=>[x.start,x.end])),both=intersectRanges(a,b),onlyA=subtractRanges(a,b),onlyB=subtractRanges(b,a),union=mergeRanges([...a,...b]);
 const ranges={onlyA,both,onlyB,union,a,b},counts=Object.fromEntries(CATEGORIES.map(k=>[k,measure(ranges[k])])),cidrs=Object.fromEntries(CATEGORIES.map(k=>[k,ranges[k].flatMap(([s,e])=>rangeCIDRs(s,e))]));
 if(counts.a!==counts.onlyA+counts.both||counts.b!==counts.onlyB+counts.both||counts.union!==counts.onlyA+counts.both+counts.onlyB)throw Error('Coverage accounting failed.');
 return {entriesA,entriesB,ranges,counts,cidrs};
}
