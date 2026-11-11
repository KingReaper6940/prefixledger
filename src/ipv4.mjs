export const SPACE=4294967296;
export function address(text){
 if(typeof text!=='string')throw Error('Use a dotted-decimal IPv4 address.');
 const parts=text.split('.');if(parts.length!==4||parts.some(p=>!/^(0|[1-9]\d{0,2})$/.test(p)||Number(p)>255))throw Error('Use four IPv4 octets 0–255 without leading zeros.');
 return parts.reduce((n,p)=>n*256+Number(p),0);
}
export function dotted(n){if(!Number.isInteger(n)||n<0||n>=SPACE)throw Error('Invalid IPv4 address value.');return [24,16,8,0].map(bits=>Math.floor(n/2**bits)%256).join('.');}
export function network(token){
 const pieces=token.split('/');if(pieces.length>2)throw Error('Use one address or address/prefix.');
 const ip=address(pieces[0]),prefix=pieces.length===1?32:/^(0|[1-9]\d?)$/.test(pieces[1])?Number(pieces[1]):-1;if(prefix<0||prefix>32)throw Error('IPv4 prefix must be 0–32.');
 const size=2**(32-prefix),start=Math.floor(ip/size)*size;
 return {address:ip,prefix,start,end:start+size,count:size,canonical:dotted(start)+'/'+prefix,normalized:ip!==start,bare:pieces.length===1};
}
export function parseList(source,side='a'){
 if(typeof source!=='string'||source.length>60000)throw Error('Each list is limited to 60,000 characters.');
 const entries=[];for(const [index,line] of source.split(/\r?\n/).entries()){
  if(line.length>512)throw Error('Line '+(index+1)+' exceeds 512 characters.');
  const hash=line.indexOf('#'),token=(hash<0?line:line.slice(0,hash)).trim(),comment=hash<0?'':line.slice(hash+1).trim();if(comment.length>160)throw Error('Line '+(index+1)+' comment exceeds 160 characters.');if(!token)continue;
  if(entries.length>=200)throw Error('Each list supports 200 entries.');let n;try{n=network(token);}catch(e){throw Error('Line '+(index+1)+': '+e.message);}
  entries.push({id:side+(index+1),line:index+1,token,comment,...n});
 }
 return entries;
}
