/** Browser-only data helpers. Kept independent of React so validation can be tested. */
export const STORE_KEY = 'money-mentor-demo-v1'; // Do NOT change: existing users have data here.
export const ONBOARD_KEY = 'money-mentor-onboarded-v1';
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const idValid = id => (typeof id === 'string' && id.length > 0 && id.length <= 128) || finite(id);
const validDate = str => typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(new Date(`${str}T12:00:00`).getTime()) && new Date(`${str}T12:00:00`).toISOString().slice(0,10) === str;
const requiredText = (s, max=160) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const ensure = (truth, message) => { if (!truth) throw new Error(message); };
const uniqueIds = (array, name) => {
  ensure(new Set(array.map(x => String(x.id))).size === array.length, `${name} contains duplicate IDs.`);
};
export const emptyState = () => ({ income:0, budget:1750, monthlyBudgets:{}, transactions:[], goals:[], bills:[], messages:[{id:1,role:'assistant',text:'Welcome to Money Mentor! This is a browser-only demo. Add an expense, set a budget, or ask a question to get started.'}] });
export const getMonthBudget = (state, month) => {
  const custom=state.monthlyBudgets?.[month];
  return finite(custom) && custom > 0 ? custom : (finite(state.budget) && state.budget>0 ? state.budget:1750);
};
/** Validates either a versioned export or the original v1 app's raw data object. */
export function parseBackupJson(input) {
  ensure(typeof input==='string' && input.length <= MAX_BACKUP_BYTES, 'Backup file is too large (maximum 4 MB).');
  let payload;
  try { payload=JSON.parse(input); } catch { throw new Error('This is not a valid JSON backup file.'); }
  let data=payload;
  if(isObject(payload) && Object.prototype.hasOwnProperty.call(payload,'formatVersion')){
    ensure(payload.app === 'money-mentor', 'This backup was not created for Money Mentor.');
    ensure(payload.formatVersion===BACKUP_VERSION, 'Unsupported backup version.');
    data=payload.data;
  }
  return validateState(data);
}
export function validateState(data){
  ensure(isObject(data), 'Backup must contain a valid data object.');
  ensure(Array.isArray(data.transactions) && Array.isArray(data.goals) && Array.isArray(data.bills), 'Backup is missing transactions, savings goals, or bills.');
  ensure(data.transactions.length<=10000 && data.goals.length<=1000 && data.bills.length<=1000, 'Backup has too many records.');
  ensure(finite(data.budget) && data.budget>0 && data.budget<=1e10, 'Invalid monthly budget in backup.');
  const transactions=data.transactions.map((t,i)=>{
    ensure(isObject(t)&&idValid(t.id)&&requiredText(t.name,160)&&finite(t.amount)&&t.amount!==0&&Math.abs(t.amount)<=1e10&&validDate(t.date),`Transaction ${i+1} is invalid.`);
    ensure(requiredText(t.category,80),`Transaction ${i+1} has an invalid category.`);
    return {id:t.id,name:t.name,category:t.amount>0?'Income':t.category,amount:t.amount,date:t.date,...(idValid(t.billId)?{billId:t.billId}:{})};
  }); uniqueIds(transactions,'Transactions');
  const goals=data.goals.map((g,i)=>{
    ensure(isObject(g)&&idValid(g.id)&&requiredText(g.name,160)&&finite(g.target)&&g.target>0&&g.target<=1e10&&finite(g.saved)&&g.saved>=0&&g.saved<=1e10,`Savings goal ${i+1} is invalid.`);
    const activity=Array.isArray(g.activity)?g.activity.slice(-50).filter(a=>isObject(a)&&finite(a.amount)&&validDate(a.date)&&idValid(a.id)).map(a=>({id:a.id,amount:a.amount,date:a.date})):[];
    return {id:g.id,name:g.name,target:g.target,saved:g.saved,icon:typeof g.icon==='string'&&g.icon.length<=10?g.icon:'🎯',activity};
  }); uniqueIds(goals,'Savings goals');
  const bills=data.bills.map((b,i)=>{
    ensure(isObject(b)&&idValid(b.id)&&requiredText(b.name,160)&&finite(b.amount)&&b.amount>0&&b.amount<=1e10&&validDate(b.due)&&typeof b.paid==='boolean',`Bill ${i+1} is invalid.`);
    return {id:b.id,name:b.name,amount:b.amount,due:b.due,paid:b.paid,...(idValid(b.paymentTransactionId)?{paymentTransactionId:b.paymentTransactionId}:{})};
  }); uniqueIds(bills,'Bills');
  const messages=Array.isArray(data.messages)?data.messages.slice(-200).filter(m=>isObject(m)&&idValid(m.id)&&['user','assistant'].includes(m.role)&&typeof m.text==='string'&&m.text.length<=3000).map(m=>({id:m.id,role:m.role,text:m.text})):[];
  const monthlyBudgets={};
  if(isObject(data.monthlyBudgets)){
    const entries=Object.entries(data.monthlyBudgets);
    ensure(entries.length<=240, 'Backup has too many monthly budget entries.');
    for(const [k,v] of entries){ensure(/^\d{4}-(0[1-9]|1[0-2])$/.test(k)&&finite(v)&&v>0&&v<=1e10,'Backup has an invalid month budget.');monthlyBudgets[k]=v;}
  }
  return {income:finite(data.income)?data.income:0,budget:data.budget,monthlyBudgets,transactions,goals,bills,messages};
}
export const createBackup = state => {
  const content=JSON.stringify({app:'money-mentor',formatVersion:BACKUP_VERSION,exportedAt:new Date().toISOString(),data:validateState(state)},null,2);
  ensure(new TextEncoder().encode(content).length<=MAX_BACKUP_BYTES,'Your backup is larger than 4 MB. Reduce old assistant messages or records before exporting.');
  return content;
};
