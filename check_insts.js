const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/watersync_gaza_full.json', 'utf8'));
const insts = data.stations.flatMap(s => s.institutions || []);
const ids = new Map();
insts.forEach(i => {
    if(!ids.has(i.id)) ids.set(i.id, []);
    ids.get(i.id).push(i);
});
console.log(Array.from(ids.entries()).filter(([k,v]) => v.length > 1));
