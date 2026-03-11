const fs=require('fs');
const s=fs.readFileSync('src/pages/WorkOrders/WorkOrders.jsx','utf8');
let inSingle=false,inDouble=false,inBack=false,inLineComment=false,inBlockComment=false;
const candidates=[];
for(let i=0;i<s.length;i++){
  const ch=s[i];
  const next=s[i+1];
  if(inLineComment){ if(ch==='\n') inLineComment=false; continue; }
  if(inBlockComment){ if(ch==='*' && next==='/'){ inBlockComment=false; i++; } continue; }
  if(!inSingle && !inDouble && !inBack && ch==='/' && next!=='/' && next!=='*'){
    // a slash outside of strings/comments that could be a regex or divide
    const line = s.substring(0,i).split(/\r?\n/).length;
    candidates.push({pos:i, line, ctx: s.substring(Math.max(0,i-20), Math.min(s.length,i+20)).replace(/\n/g,'\\n')});
  }
  if(ch==='"' && !inSingle && !inBack && !inLineComment && !inBlockComment){ inDouble=!inDouble; }
  else if(ch==="'" && !inDouble && !inBack && !inLineComment && !inBlockComment){ inSingle=!inSingle; }
  else if(ch==='`' && !inSingle && !inDouble && !inLineComment && !inBlockComment) { inBack=!inBack; }
  if(ch==='/' && next=='/') { inLineComment=true; i++; }
  else if(ch==='/' && next==='*'){ inBlockComment=true; i++; }
}
console.log('Total candidates', candidates.length);
console.log('Last 15 candidates before line 568:');
console.log(candidates.filter(c=>c.line<=568).slice(-15));
