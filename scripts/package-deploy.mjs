import {mkdir,cp} from 'node:fs/promises';
const root='artifacts/deploy';await mkdir(root,{recursive:true});
await cp('web/out',root+'/web/out',{recursive:true});

console.log('Deployment payload prepared: artifacts/deploy (no credentials).');
