import fs from 'node:fs';
import path from 'node:path';
const roots=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean);
for(const root of roots)for(const suffix of ['Microsoft/Edge/Application/msedge.exe','Google/Chrome/Application/chrome.exe']){const p=path.join(root,suffix);if(fs.existsSync(p))console.log('BROWSER',p);}
const cache=path.join(process.env.LOCALAPPDATA||'', 'ms-playwright');
if(fs.existsSync(cache))console.log('PLAYWRIGHT CACHE',fs.readdirSync(cache));
const npx=path.join(process.env.LOCALAPPDATA||'','npm-cache','_npx');
if(fs.existsSync(npx))for(const dir of fs.readdirSync(npx)){const p=path.join(npx,dir,'node_modules','playwright','index.mjs');if(fs.existsSync(p))console.log('PLAYWRIGHT MODULE',p);}
