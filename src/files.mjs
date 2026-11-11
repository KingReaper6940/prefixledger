import {parseProject} from './model.mjs';
export const MAX_FILE_BYTES=1200000;
export async function readProject(file){if(!file||file.size>MAX_FILE_BYTES)throw Error('Choose a project JSON file no larger than 1.2 MB');const bytes=new Uint8Array(await file.arrayBuffer());return parseProject(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}
export function downloads(){const urls=[];return {save(text,type,name){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();return blob},clear(){for(const url of urls.splice(0))URL.revokeObjectURL(url)}}}
