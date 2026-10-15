import {readdir,readFile} from 'node:fs/promises';
async function files(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','.next','dist','out'].includes(e.name))continue;const p=dir+'/'+e.name;out.push(...(e.isDirectory()?await files(p):[p]));}return out;}
for(const file of await files('web/src')){const text=await readFile(file,'utf8');if(/AKIA[0-9A-Z]{16}|aws_secret_access_key|LINE_CHANNEL_SECRET/.test(text))throw new Error('Secret pattern in browser source: '+file);}
console.log('Browser source secret-pattern check passed');
