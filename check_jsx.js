const fs = require('fs');
const f = 'c:/Users/user/Documents/asmamaw/clm/clm/frontend/src/pages/technician/TechnicianManageBooking.jsx';
const content = fs.readFileSync(f, 'utf8');

// Simple tag counter
const selfClosing = /<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)[^>]*\/?>/gi;
const openTag = /<([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9]*)/g;
const closeTag = /<\/([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9]*)>/g;

let opens = {};
let closes = {};

let m;
while ((m = openTag.exec(content)) !== null) {
    opens[m[1]] = (opens[m[1]] || 0) + 1;
}
while ((m = closeTag.exec(content)) !== null) {
    closes[m[1]] = (closes[m[1]] || 0) + 1;
}

console.log('Tag balance:');
for (const tag of Object.keys(opens).sort()) {
    const o = opens[tag] || 0;
    const c = closes[tag] || 0;
    if (o !== c) {
        console.log(`  ${tag}: open=${o} close=${c} DIFF=${o-c}`);
    }
}
