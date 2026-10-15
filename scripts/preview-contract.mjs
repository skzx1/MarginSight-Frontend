import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
export const allowed=name=>name==='domain.generated.js'||name==='domain.generated.d.ts'||/^domain-types\/[a-z-]+\.d\.ts$/.test(name);
export async function verifyContract(directory){
  const root=resolve(directory),manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
  if(manifest.schemaVersion!==1||manifest.sourceRepository!=='https://github.com/skzx1/MarginSight-Backend'||!/^margin-v/.test(manifest.formulaVersion))throw new Error('Invalid preview manifest');
  for(const required of ['domain.generated.js','domain.generated.d.ts','domain-types/calculate.d.ts','domain-types/model.d.ts'])if(!manifest.files?.[required])throw new Error('Incomplete preview contract: '+required);
  for(const [name,expected] of Object.entries(manifest.files)){
    if(!allowed(name)||!/^([a-f0-9]{64})$/.test(expected))throw new Error('Unsafe preview file: '+name);
    const target=resolve(root,name);if(!target.startsWith(root+sep))throw new Error('Path outside contract');
    if((await lstat(target)).isSymbolicLink())throw new Error('Symlink not allowed');
    const data=await readFile(target);if(createHash('sha256').update(data).digest('hex')!==expected)throw new Error('Preview integrity mismatch: '+name);
    if(name.endsWith('.d.ts')&&/\.\.\/.*backend|backend\/src/.test(data.toString()))throw new Error('Cross-repository type dependency');
  }
  for(const name of await readdir(resolve(root,'domain-types')))if(!manifest.files['domain-types/'+name])throw new Error('Untracked preview declaration');
  return manifest;
}
