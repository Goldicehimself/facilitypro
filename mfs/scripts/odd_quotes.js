const fs=require('fs');
const s=fs.readFileSync('src/pages/WorkOrders/WorkOrders.jsx','utf8');
const lines=s.split(/\r?\n/);
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  const single=(line.match(/'/g)||[]).length;
  const double=(line.match(/"/g)||[]).length;
  const back=(line.match(/`/g)||[]).length;
  if(single%2!==0 || double%2!==0 || back%2!==0){
    console.log(`${i+1}: single(${single}) double(${double}) back(${back}) => ${line.trim()}`);
  }
}
