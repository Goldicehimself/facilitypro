const fs=require('fs');const esbuild=require('esbuild');
const code=fs.readFileSync('src/pages/WorkOrders/WorkOrders.jsx','utf8');
try{
  esbuild.transformSync(code,{loader:'jsx'});
  console.log('Parse ok');
}catch(e){
  console.error('Error:',e.message);
  console.error(e.errors && e.errors[0]);
}
