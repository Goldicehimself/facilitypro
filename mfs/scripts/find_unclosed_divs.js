const fs = require('fs');
const path = 'src/pages/WorkOrders/WorkOrders.jsx';
const s = fs.readFileSync(path, 'utf8');
const lines = s.split(/\r?\n/);
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openRegex = /<div\b/g;
  let m;
  while ((m = openRegex.exec(line)) !== null) {
    stack.push({ line: i + 1, text: line.trim() });
  }
  const selfRegex = /<div[^>]*\/>/g;
  let sm;
  while ((sm = selfRegex.exec(line)) !== null) {
    // remove the most recent opening that corresponds to this self-closing
    if (stack.length) stack.pop();
  }
  const closeRegex = /<\/div>/g;
  let cm;
  while ((cm = closeRegex.exec(line)) !== null) {
    if (stack.length) stack.pop(); else console.log('extra close at', i + 1);
  }
}
if (stack.length === 0) console.log('All divs closed');
else console.log('Unclosed divs:', stack);
