const fs = require('fs');
const path = 'src/pages/WorkOrders/WorkOrders.jsx';
const s = fs.readFileSync(path, 'utf8');
const lines = s.split(/\r?\n/);
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openMatches = (line.match(/<div\b/g) || []).length;
  const selfMatches = (line.match(/<div[^>]*\/>/g) || []).length;
  const closeMatches = (line.match(/<\/div>/g) || []).length;
  for (let j = 0; j < openMatches; j++) { stack.push({line: i+1, text: line.trim()}); }
  for (let j = 0; j < selfMatches; j++) { if (stack.length) stack.pop(); }
  for (let j = 0; j < closeMatches; j++) { if (stack.length) stack.pop(); else console.log('extra close at', i+1); }
  if (openMatches || closeMatches || selfMatches) console.log(`${i+1}: +${openMatches} +self${selfMatches} -${closeMatches} => stack=${stack.length}`);
}
if (stack.length === 0) console.log('All divs closed');
else console.log('Unclosed divs:',stack);
