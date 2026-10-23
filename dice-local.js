/* SLASHER / dados locais; resultado rápido com envio assíncrono ao Supabase.
 * Uma rolagem feita no cliente NÃO é verificável como aleatória por terceiros.
 * O servidor ainda valida permissões, arma, alvo e regras de dano. */
(function(){
'use strict';
function face(sides){
 const n=Number(sides);if(!Number.isInteger(n)||n<1||n>100)throw Error('Dado não suportado');
 const max=4294967296,limit=Math.floor(max/n)*n,buf=new Uint32Array(1);
 if(!globalThis.crypto?.getRandomValues)throw Error('Gerador seguro do navegador indisponível');
 let value;do{globalThis.crypto.getRandomValues(buf);value=buf[0]}while(value>=limit);return value%n+1;
}
function build(p){const natural=face(20),sides=Number(p.damage_sides||0),damage=p.kind!=='test'&&sides>0?face(sides):0;return {natural,damage,modifier:Number(p.modifier||0),total:natural+Number(p.modifier||0)}}
window.SLASHER_DICE={face,build};
})();