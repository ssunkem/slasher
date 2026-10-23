const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx={window:{},crypto:require('node:crypto').webcrypto,Uint32Array,console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dice-local.js'),'utf8'),ctx);
const d=ctx.window.SLASHER_DICE;assert(d&&typeof d.face==='function');
for(const die of [4,6,8,10,12,20])for(let i=0;i<200;i++){const face=d.face(die);assert(face>=1&&face<=die)}
assert.throws(()=>d.face(0),/não suportado/i);
const first=d.build({kind:'test',modifier:4,damage_sides:0});assert.equal(first.total,first.natural+4);assert.equal(first.damage,0);
const second=d.build({kind:'attack',modifier:3,damage_sides:8});assert(second.damage>=1&&second.damage<=8);
const sql=fs.readFileSync(path.join(__dirname,'../migrate_dice_local.sql'),'utf8');
for(const name of ['slasher_roll_local','slasher71_attack_local'])assert(sql.includes('function public.'+name+'('));
for(const key of ['p_client_natural not between 1 and 20','p_client_damage_face not between 1 and v_die','public.slasher_is_member(p_campaign)'])assert(sql.includes(key));
assert(!sql.includes('floor(random()'));
console.log('PASS: RNG local dentro dos dados, migração segura na autorização e limites numéricos');