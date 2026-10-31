import {readFile} from 'node:fs/promises';import {preview} from './deadlines.mjs';import {fictional} from './fixtures.mjs';
const input=process.argv[2]?JSON.parse(await readFile(process.argv[2],'utf8')):{pack:fictional,changes:{hearing:'2026-11-04'}};
console.log(JSON.stringify({provenance:'executed fictional dependency rules; no legal calendar integration',...preview(input.pack,input.changes)},null,2));
