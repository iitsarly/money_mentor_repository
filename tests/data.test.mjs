import test from 'node:test';
import assert from 'node:assert/strict';
import {BACKUP_VERSION,STORE_KEY,emptyState,getMonthBudget,validateState,parseBackupJson,createBackup} from '../src/data.js';
const legacy=()=>({income:2400,budget:1750,transactions:[{id:1,name:'Tuition refund',category:'Income',amount:200,date:'2026-10-30'},{id:2,name:'Lunch',category:'Food & Drinks',amount:-12.5,date:'2026-10-30'}],goals:[{id:1,name:'Laptop',target:1000,saved:100,icon:'💻'}],bills:[{id:1,name:'Phone',amount:35,due:'2026-11-01',paid:false}],messages:[{id:1,role:'assistant',text:'Demo'}]});
test('original localStorage key preserved',()=>assert.equal(STORE_KEY,'money-mentor-demo-v1'));
test('v1 browser data normalized with no loss',()=>{
 const migrated=validateState(legacy());
 assert.deepEqual(migrated.transactions,legacy().transactions);
 assert.equal(migrated.goals[0].saved,100);
 assert.deepEqual(migrated.monthlyBudgets,{});
 assert.equal(migrated.bills[0].paid,false);
});
test('monthly budget inherits legacy limit until customized',()=>{
 const s=validateState(legacy());
 assert.equal(getMonthBudget(s,'2026-10'),1750);
 s.monthlyBudgets['2026-10']=1425;
 assert.equal(getMonthBudget(s,'2026-10'),1425);
 assert.equal(getMonthBudget(s,'2026-11'),1750);
});
test('versioned export and import roundtrip preserves all records',()=>{
 const data=validateState(legacy());
 data.monthlyBudgets['2026-10']=1600;
 data.goals[0].activity.push({id:123,date:'2026-10-30',amount:50});
 data.transactions.push({id:3,name:'Bill: Phone',category:'Housing',date:'2026-10-30',amount:-35,billId:1});
 data.bills[0].paymentTransactionId=3;data.bills[0].paid=true;
 const file=createBackup(data);
 const parsed=JSON.parse(file);assert.equal(parsed.formatVersion,BACKUP_VERSION);
 assert.equal(parsed.app,'money-mentor');
 assert.deepEqual(parseBackupJson(file),data);
});
test('legacy raw JSON can also be imported',()=>{
 assert.deepEqual(parseBackupJson(JSON.stringify(legacy())),validateState(legacy()));
});
test('empty workspace has valid data for first-time users',()=>{
 const data=validateState(emptyState());assert.equal(data.transactions.length,0);assert.equal(data.goals.length,0);
});
test('rejects invalid and unexpected backup formats',()=>{
 for(const input of ['bad text','{}','{"app":"other","formatVersion":2,"data":{}}','{"app":"money-mentor","formatVersion":99,"data":{}}']){
  assert.throws(()=>parseBackupJson(input));
 }
});
test('rejects malformed and duplicate records, keeps originals unchanged',()=>{
 const x=legacy();x.transactions[0].amount=Infinity;assert.throws(()=>validateState(x));
 const y=legacy();y.transactions[0].date='2026-02-30';assert.throws(()=>validateState(y));
 const z=legacy();z.transactions.push({...z.transactions[0]});assert.throws(()=>validateState(z));
});
test('rejects unsafe month budgets',()=>{
 const x=legacy();x.monthlyBudgets={'2026-13':400};assert.throws(()=>validateState(x));
});
