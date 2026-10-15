import {verifyContract} from './preview-contract.mjs';
import {resolve} from 'node:path';
const manifest=await verifyContract(resolve(import.meta.dirname,'../web/src/lib'));
console.log('PASS pinned browser preview '+manifest.formulaVersion+' / SHA-256 integrity');
