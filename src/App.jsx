import React, {useEffect, useMemo, useRef, useState} from 'react';
import {STORE_KEY, ONBOARD_KEY, emptyState, getMonthBudget, parseBackupJson, createBackup, validateState, MAX_BACKUP_BYTES} from './data.js';
import {LayoutDashboard, ArrowLeftRight, Target, CalendarDays, MessageCircle, ChartNoAxesCombined, ShieldCheck, Bell, Plus, Search, ArrowUpRight, ArrowDownRight, ChevronRight, CircleHelp, UtensilsCrossed, ShoppingBag, Home, GraduationCap, BusFront, Coffee, Wallet, Menu, X, Send, Sparkles, Trash2, CheckCircle2, Pencil, TrendingUp, TrendingDown, Info, Download, RotateCcw, BadgeDollarSign, AlertTriangle, PiggyBank, Check, ChevronDown, CircleDollarSign, Lightbulb} from 'lucide-react';

const today = new Date();
const iso = (d)=> new Date(d).toLocaleDateString('en-CA');
const dateShift = (n)=> {const d = new Date(); d.setDate(d.getDate()+n);return iso(d)};
const monthKey=(d)=>String(d).slice(0,7);
const monthName=(d)=>new Date(`${monthKey(d)}-15T12:00:00`).toLocaleDateString('en-US',{month:'long',year:'numeric'});
const money=(n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const starter = ()=>({
  income: 2400,
  budget: 1750,
  monthlyBudgets: {},
  transactions: [
    {id:1, name:'Campus dining',category:'Food & Drinks',amount:-68.4,date:dateShift(-1)},
    {id:2, name:'Part-time paycheck',category:'Income',amount:840,date:dateShift(-2)},
    {id:3, name:'Target groceries',category:'Shopping',amount:-56.72,date:dateShift(-3)},
    {id:4, name:'CTA Ventra pass',category:'Transport',amount:-30,date:dateShift(-5)},
    {id:5, name:'Monthly rent',category:'Housing',amount:-720,date:dateShift(-7)},
    {id:6, name:'Coffee with friends',category:'Food & Drinks',amount:-13.8,date:dateShift(-9)},
    {id:7, name:'Campus bookshop',category:'Education',amount:-85,date:dateShift(-12)},
    {id:8, name:'Freelance design',category:'Income',amount:260,date:dateShift(-14)},
    {id:9, name:'Campus dining',category:'Food & Drinks',amount:-46.5,date:dateShift(-18)},
    {id:10, name:'Movie night',category:'Entertainment',amount:-24,date:dateShift(-22)},
  ],
  goals:[{id:1,name:'Emergency fund',target:1000,saved:420,icon:'🛟'},{id:2,name:'Spring break trip',target:800,saved:275,icon:'✈️'}],
  bills:[{id:1,name:'Internet',amount:45,due:dateShift(5),paid:false},{id:2,name:'Phone plan',amount:35,due:dateShift(11),paid:false},{id:3,name:'Streaming service',amount:12.99,due:dateShift(18),paid:false}],
  messages:[{id:1,role:'assistant',text:"Hey there! 👋 I'm your Money Mentor demo assistant. I can help you understand your spending, plan savings, and learn financial basics. Ask me anything, or try one of the suggested questions below."}],
});
const icons={'Food & Drinks':UtensilsCrossed,Shopping:ShoppingBag,Housing:Home,Education:GraduationCap,Transport:BusFront,Entertainment:Coffee,Health:ShieldCheck,Other:Wallet,Income:ArrowDownRight};
const palette={'Food & Drinks':'#f6aa60',Shopping:'#9a8dff',Housing:'#7d91f5',Education:'#6fc7b0',Transport:'#e6bb67',Entertainment:'#ed8fab',Health:'#6dbfdc',Other:'#9ea6b6'};
const categories=Object.keys(palette);
const nav=[['Overview',LayoutDashboard],['Transactions',ArrowLeftRight],['Savings goals',Target],['Upcoming bills',CalendarDays],['Spending reports',ChartNoAxesCombined],['AI assistant',MessageCircle],['Data & settings',ShieldCheck]];
function readStore(){try{const v=localStorage.getItem(STORE_KEY);return v?validateState(JSON.parse(v)):starter()}catch{return starter()}}
function answerFor(input,state){
 const q=input.toLowerCase();const current=state.transactions.filter(t=>monthKey(t.date)===monthKey(iso(today)));
 const exp=current.filter(t=>t.amount<0).reduce((s,t)=>s-Math.min(0,t.amount),0);
 const budget=getMonthBudget(state,monthKey(iso(today)));
 const remain=budget-exp;
 const food=current.filter(t=>t.category==='Food & Drinks').reduce((s,t)=>s-Math.min(0,t.amount),0);
 const unPaid=state.bills.filter(b=>!b.paid).reduce((s,b)=>s+Number(b.amount),0);
 const available=remain-unPaid;
 if(/afford|buy|purchase|spend.*\$|\$\d+/.test(q)){
  const found=input.match(/\$\s*([\d,]+(?:\.\d+)?)/);let amount=found?Number(found[1].replaceAll(',','')):null;
  return amount!==null ? `You have ${money(remain)} left in this month's spending budget, and ${money(unPaid)} in unpaid listed bills. That leaves an estimated ${money(available)} before any unlisted costs. A ${money(amount)} purchase would ${amount<=available?'fit within that estimated cushion':'exceed that estimated cushion'}. This is only a budget check, not a guarantee of available cash. Review your actual account balance and essentials before deciding.` : `You have ${money(remain)} left in your monthly budget and ${money(unPaid)} in upcoming unpaid bills. Tell me a purchase amount, like “Can I afford $65?”, for a rough budget check. This does not check your bank balance.`;
 }
 if(/food|restaurant|dining|grocer/.test(q))return `So far this month, your recorded Food & Drinks spending is ${money(food)}. Your total spending is ${money(exp)}, leaving ${money(remain)} of your overall ${money(budget)} budget. Try choosing a weekly food cap and logging meals as you go.`;
 if(/loan|interest|apr|borrow|debt/.test(q))return 'A student loan is borrowed money you repay, usually with interest. Compare interest rate, fees, repayment terms, and whether the loan is federal or private. For U.S. federal student loan guidance, see studentaid.gov/understand-aid/types/loans. This is general education, not individualized financial advice.';
 if(/save|saving|goal|emergency/.test(q)){const g=state.goals[0];return `Your “${g?.name||'savings'}” goal has ${money(g?.saved||0)} saved${g?` toward ${money(g.target)}`:''}. A small automatic contribution can make progress more predictable. If you put aside $10 per week, you'd save about $520 over 52 weeks. Adjust this to your real ability to pay.`}
 if(/bill|due|pay/.test(q))return `Your listed unpaid bills total ${money(unPaid)}. Visit “Upcoming bills” to see due dates and mark payments as paid. This demo does not connect to banks or send payments.`;
 if(/budget|overspend|left|spending|expense|where/.test(q))return `You've recorded ${money(exp)} of expenses this month against a ${money(budget)} budget, leaving ${money(remain)} (${budget>0?Math.max(0,Math.round(remain/budget*100)):0}% of your budget). For more detail, check Spending reports. Only expenses you've recorded are included.`;
 if(/privacy|data|secure/.test(q))return 'This MVP keeps your demo entries in your browser’s local storage. It does not connect to your bank or send messages to an AI provider. Avoid entering account numbers, passwords, or sensitive personal financial information. Clearing browser data can remove your entries.';
 return 'I can help with your budget, spending categories, savings goals, upcoming bills, affordability estimates, or basic student-loan concepts. My responses are rule-based demo guidance, not professional financial advice, and I can only use expenses you enter here. What would you like to explore?';
}
function App(){
 const [state,setState]=useState(readStore);const [page,setPage]=useState('Overview');const [mobile,setMobile]=useState(false);const [modal,setModal]=useState('');const [search,setSearch]=useState('');const [period,setPeriod]=useState('Monthly');const [draft,setDraft]=useState('');const [toast,setToast]=useState('');const [newTx,setNewTx]=useState({name:'',amount:'',category:'Food & Drinks',kind:'expense',date:iso(today)});
 const [newGoal,setNewGoal]=useState({name:'',target:'',saved:'',icon:'🎯'});
 const [newBill,setNewBill]=useState({name:'',amount:'',due:dateShift(7)});
 const [editingTxId,setEditingTxId]=useState(null);
 const [editingGoalId,setEditingGoalId]=useState(null);
 const [editingBillId,setEditingBillId]=useState(null);
 const [budgetDraft,setBudgetDraft]=useState('');
 const [contribution,setContribution]=useState(null);
 const [billPayment,setBillPayment]=useState(null);
 const [billUnpay,setBillUnpay]=useState(null);
 const [restorePreview,setRestorePreview]=useState(null);
 const [restoreError,setRestoreError]=useState('');
 const [firstVisit,setFirstVisit]=useState(()=>{try{return !localStorage.getItem(STORE_KEY) && !localStorage.getItem(ONBOARD_KEY)}catch{return false}});
 const restoreFileRef=useRef(null);
 const [showHelp,setShowHelp]=useState(false);
 const [confirmReset,setConfirmReset]=useState(false);
 // Keep the last deleted entry in memory for a short, reversible window.
 const [pendingDelete,setPendingDelete]=useState(null);
 const [undoRecord,setUndoRecord]=useState(null);
 const cancelDeleteRef=useRef(null);
 useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(state))}catch(e){console.warn('Money Mentor local storage could not save',e)}},[state]);
 useEffect(()=>{
  const opened=!!(modal||pendingDelete||contribution||billPayment||billUnpay||restorePreview||firstVisit||showHelp||confirmReset);
  if(!opened)return;
  const prev=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=prev};
 },[modal,pendingDelete,contribution,billPayment,billUnpay,restorePreview,firstVisit,showHelp,confirmReset]);
 useEffect(()=>{
  if(!toast)return;
  const timer=setTimeout(()=>{setToast('');setUndoRecord(null)},undoRecord?10000:3200);
  return()=>clearTimeout(timer);
 },[toast,undoRecord]);
 useEffect(()=>{
  if(!pendingDelete)return;
  cancelDeleteRef.current?.focus();
  const onEscape=(event)=>{if(event.key==='Escape')setPendingDelete(null)};
  window.addEventListener('keydown',onEscape);
  return()=>window.removeEventListener('keydown',onEscape);
 },[pendingDelete]);
 const month=monthKey(iso(today));
 const current=useMemo(()=>state.transactions.filter(t=>monthKey(t.date)===month),[state.transactions,month]);
 const expenses=current.filter(t=>t.amount<0).reduce((s,t)=>s-t.amount,0);
 const monthBudget=getMonthBudget(state,month);
 const earned=current.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
 const remaining=monthBudget-expenses;
 const savingTotal=state.goals.reduce((s,g)=>s+Number(g.saved),0);
 const unpaid=state.bills.filter(b=>!b.paid).reduce((s,b)=>s+Number(b.amount),0);
 const grouped=categories.map(c=>({name:c,value:current.filter(t=>t.amount<0&&t.category===c).reduce((s,t)=>s-t.amount,0),color:palette[c]})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);
 const ordered=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 const windowed=state.transactions.filter(t=>{const elapsed=Math.floor((new Date(`${iso(today)}T12:00:00`)-new Date(`${t.date}T12:00:00`))/86400000);return elapsed >= 0 && (period==='Daily'?elapsed===0:period==='Monthly'?monthKey(t.date)===month:elapsed<90)});
 const reportRows=categories.map(c=>({name:c,value:windowed.filter(t=>t.amount<0&&t.category===c).reduce((s,t)=>s-t.amount,0),color:palette[c]})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);
 const reportSpent=reportRows.reduce((s,x)=>s+x.value,0);
 const notify=(msg)=>{setUndoRecord(null);setToast(msg)};
 const requestDelete=(kind,item)=>setPendingDelete({kind,item});
 const confirmDelete=()=>{
  if(!pendingDelete)return;
  const {kind,item}=pendingDelete;
  const index=state[kind].findIndex(entry=>entry.id===item.id);
  setPendingDelete(null);
  if(index<0){notify('This item was already removed');return}
  const deletedItem={...state[kind][index]};
  setState(current=>({
   ...current,
   [kind]:current[kind].filter(entry=>entry.id!==item.id),
   ...(kind==='transactions'?{bills:current.bills.map(b=>b.paymentTransactionId===item.id?{...b,paymentTransactionId:null}:b)}:{})
  }));
  const singular={transactions:'Transaction',goals:'Savings goal',bills:'Bill'}[kind];
  setUndoRecord({kind,item:deletedItem,index,token:Date.now()});
  setToast(`${singular} deleted`);
 };
 const undoDelete=()=>{
  if(!undoRecord)return;
  const {kind,item,index}=undoRecord;
  setState(current=>{
   if(current[kind].some(entry=>entry.id===item.id))return current;
   const restored=[...current[kind]];
   restored.splice(Math.min(index,restored.length),0,item);
   return {...current,[kind]:restored,...(kind==='transactions' && item.billId?{bills:current.bills.map(b=>b.id===item.billId?{...b,paymentTransactionId:item.id}:b)}:{})};
  });
  setUndoRecord(null);
  setToast('Deletion undone — item restored');
 };
 const openTx=(tx=null)=>{
  setEditingTxId(tx?.id??null);
  setNewTx(tx?{name:tx.name,amount:String(Math.abs(tx.amount)),category:tx.amount>0?'Food & Drinks':tx.category,kind:tx.amount>0?'income':'expense',date:tx.date}:{name:'',amount:'',category:'Food & Drinks',kind:'expense',date:iso(today)});
  setModal('tx');
 };
 const saveTx=(e)=>{
  e.preventDefault();const amt=Number(newTx.amount);
  if(!newTx.name.trim()||!Number.isFinite(amt)||amt<=0||amt>1e10||!/^\d{4}-\d{2}-\d{2}$/.test(newTx.date))return;
  const tx={name:newTx.name.trim(),amount:newTx.kind==='income'?amt:-amt,category:newTx.kind==='income'?'Income':newTx.category,date:newTx.date};
  setState(s=>({...s,transactions:editingTxId!==null?s.transactions.map(t=>t.id===editingTxId?{...t,...tx}:t):[{id:Date.now()+Math.random(),...tx},...s.transactions]}));
  setModal('');notify(editingTxId!==null?'Transaction updated':newTx.kind==='income'?'Income added successfully':'Expense added successfully');setEditingTxId(null);
 };
 const openGoal=(g=null)=>{
  setEditingGoalId(g?.id??null);
  setNewGoal(g?{name:g.name,target:String(g.target),saved:String(g.saved),icon:g.icon}:{name:'',target:'',saved:'',icon:'🎯'});
  setModal('goal');
 };
 const saveGoal=(e)=>{
  e.preventDefault();const t=Number(newGoal.target),v=String(newGoal.saved).trim()===''?0:Number(newGoal.saved);
  if(!newGoal.name.trim()||!Number.isFinite(t)||!Number.isFinite(v)||t<=0||v<0||t>1e10||v>1e10)return;
  setState(s=>({...s,goals:editingGoalId!==null?s.goals.map(g=>g.id===editingGoalId?{...g,name:newGoal.name.trim(),target:t,saved:v,icon:newGoal.icon}:g):[...s.goals,{id:Date.now()+Math.random(),name:newGoal.name.trim(),target:t,saved:v,icon:newGoal.icon,activity:[]}]}));
  setModal('');setEditingGoalId(null);notify(editingGoalId!==null?'Savings goal updated':'Savings goal created');
 };
 const openBill=(b=null)=>{
  setEditingBillId(b?.id??null);setNewBill(b?{name:b.name,amount:String(b.amount),due:b.due}:{name:'',amount:'',due:dateShift(7)});setModal('bill');
 };
 const saveBill=(e)=>{
  e.preventDefault();const n=Number(newBill.amount);
  if(!newBill.name.trim()||!Number.isFinite(n)||n<=0||n>1e10)return;
  setState(s=>({...s,bills:editingBillId!==null?s.bills.map(b=>b.id===editingBillId?{...b,name:newBill.name.trim(),amount:n,due:newBill.due}:b):[...s.bills,{id:Date.now()+Math.random(),name:newBill.name.trim(),amount:n,due:newBill.due,paid:false}]}));
  setModal('');setEditingBillId(null);notify(editingBillId!==null?'Bill updated':'Bill added');
 };
 const saveBudget=(e)=>{
  e.preventDefault();const n=Number(budgetDraft);
  if(!Number.isFinite(n)||n<=0||n>1e10)return;
  setState(s=>({...s,monthlyBudgets:{...s.monthlyBudgets,[month]:n}}));
  setModal('');notify(`Monthly budget for ${monthName(iso(today))} set to ${money(n)}`);
 };
 const goalForContribution=contribution?state.goals.find(g=>g.id===contribution.id):null;
 const applyContribution=(e)=>{
  e.preventDefault();if(!goalForContribution)return;
  const amt=Number(contribution.amount);if(!Number.isFinite(amt)||amt<=0||amt>1e10)return;
  if(contribution.action==='remove'&&amt>Number(goalForContribution.saved))return;
  const change=contribution.action==='add'?amt:-amt;
  setState(s=>({...s,goals:s.goals.map(g=>g.id===contribution.id?{...g,saved:Math.round((Number(g.saved)+change)*100)/100,activity:[...(g.activity||[]),{id:Date.now()+Math.random(),date:iso(today),amount:change}].slice(-50)}:g)}));
  setContribution(null);notify(change>0?'Savings added to goal':'Savings balance corrected');
 };
 const recordBillPaid=(recordExpense)=>{
  if(!billPayment)return;
  const b=state.bills.find(x=>x.id===billPayment.id);if(!b||b.paid){setBillPayment(null);return;}
  const linked=state.transactions.some(t=>t.id===b.paymentTransactionId);
  const txId=Date.now()+Math.random();
  setState(s=>({...s,
   bills:s.bills.map(x=>x.id===b.id?{...x,paid:true,paymentTransactionId:recordExpense&&!linked?txId:(x.paymentTransactionId??null)}:x),
   transactions:recordExpense&&!linked?[{id:txId,name:`Bill: ${b.name}`,category:billPayment.category,amount:-Number(b.amount),date:billPayment.date,billId:b.id},...s.transactions]:s.transactions
  }));
  setBillPayment(null);
  notify(recordExpense&&!linked?'Bill marked paid and expense recorded':linked?'Bill marked paid; existing linked expense kept':'Bill marked paid (no expense added)');
 };
 const markBillUnpaid=()=>{
  if(!billUnpay)return;
  setState(s=>({...s,bills:s.bills.map(b=>b.id===billUnpay.id?{...b,paid:false}:b)}));
  setBillUnpay(null);notify('Bill marked unpaid. Any existing transaction was kept.');
 };
 const saveFile=(filename,text,contentType)=>{
  const url=URL.createObjectURL(new Blob([text],{type:contentType}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const downloadBackup=()=>{
  try{saveFile(`money-mentor-backup-${iso(today)}.json`,createBackup(state),'application/json');notify('Backup downloaded to your device')}
  catch(e){notify(`Could not create backup: ${e.message}`)}
 };
 const chooseBackup=()=>restoreFileRef.current?.click();
 const readBackup=async(e)=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  setRestoreError('');
  if(file.size>MAX_BACKUP_BYTES){setRestoreError('Backup is larger than 4 MB.');setRestorePreview({error:true});return}
  try{
   const text=await file.text();const data=parseBackupJson(text);
   setRestorePreview({data,name:file.name});
  }catch(err){setRestoreError(err.message||'Could not read the backup file.');setRestorePreview({error:true})}
 };
 const restoreBackup=()=>{
  if(!restorePreview?.data)return;
  setState(restorePreview.data);setRestorePreview(null);setUndoRecord(null);setPendingDelete(null);setSearch('');notify('Backup restored successfully');go('Overview');
 };
 const completeOnboarding=(useSamples)=>{
  if(!useSamples)setState(emptyState());
  try{localStorage.setItem(ONBOARD_KEY,'true')}catch{}
  setFirstVisit(false);
  notify(useSamples?'Sample data ready to explore':'Your empty workspace is ready');
 };
 const send=(value=draft)=>{const text=value.trim();if(!text)return;setState(s=>({...s,messages:[...s.messages,{id:Date.now(),role:'user',text},{id:Date.now()+1,role:'assistant',text:answerFor(text,s)}]}));setDraft('');setPage('AI assistant');setMobile(false)};
 const go=(p)=>{setPage(p);setMobile(false);window.scrollTo({top:0,behavior:'smooth'})};
 const csv=()=>{const content=['Date,Description,Category,Amount',...ordered.map(t=>[t.date,`"${t.name.replaceAll('"','""')}"`,t.category,t.amount].join(','))].join('\n');saveFile('money-mentor-transactions.csv',content,'text/csv');notify('Transactions exported')};
 function Metric({title,value,Icon,foot,accent}){return <div className="metric"><div className="metric-top"><span>{title}</span><span className={'metric-icon '+(accent||'')}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>}
 function progress(value,target){return <div className="progress"><div style={{width:`${Math.min(100,Math.max(0,(value/(target||1))*100))}%`}}/></div>}
 function TxList({rows,compact=false}){return rows.length?<div className="tx-list">{rows.map(t=>{const Icon=icons[t.category]||Wallet;return <div className="tx-row" key={t.id}><span className="tx-ico"><Icon size={19}/></span><div className="tx-info"><strong>{t.name}</strong><small>{t.category} <span className="dotsep">·</span> {new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small></div><strong className={t.amount>0?'positive':'negative'}>{t.amount>0?'+':'−'}{money(Math.abs(t.amount))}</strong>{!compact&&<div className="row-actions"><button title="Edit transaction" aria-label={`Edit ${t.name}`} className="icon-btn subtle" onClick={()=>openTx(t)}><Pencil size={16}/></button><button title="Delete transaction" aria-label={`Delete ${t.name}`} className="icon-btn subtle" onClick={()=>requestDelete('transactions',t)}><Trash2 size={16}/></button></div>}</div>})}</div>:<div className="empty">No transactions found. Add one to get started.</div>}
 function Breakdown({rows,amount}){return rows.length?<><div className="break-bar">{rows.map(r=><span key={r.name} title={`${r.name}: ${money(r.value)}`} style={{background:r.color,width:`${r.value/(amount||1)*100}%`}} />)}</div><div className="break-list">{rows.map(r=><div className="break-row" key={r.name}><span className="legend-label"><i style={{background:r.color}}/>{r.name}</span><span><strong>{money(r.value)}</strong><small>{Math.round(r.value/(amount||1)*100)}%</small></span></div>)}</div></>:<div className="empty">No spending to show for this period.</div>}
 return <div className="app-shell">
  <aside className={'sidebar '+(mobile?'sidebar-open':'')}><div className="brand" onClick={()=>go('Overview')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go('Overview')}}} role="button" tabIndex={0}><span className="brand-mark"><CircleDollarSign size={24}/></span><div>money<span>mentor</span><small>YOUR FINANCES, SIMPLIFIED</small></div></div><div className="side-label">WORKSPACE</div><nav>{nav.map(([name,Icon])=><button key={name} onClick={()=>go(name)} className={'nav-item '+(page===name?'active':'')}><Icon size={19}/><span>{name}</span>{page===name&&<i/>}</button>)}</nav><div className="side-bottom"><div className="helper"><span className="helper-ico"><Sparkles size={18}/></span><strong>Need a hand?</strong><p>Your money questions, answered simply.</p><button onClick={()=>go('AI assistant')}>Ask Money Mentor <ArrowUpRight size={15}/></button></div><div className="demo-side"><ShieldCheck size={16}/> Private, browser-only demo</div></div></aside>
  {mobile&&<button className="scrim" aria-label="Close menu" onClick={()=>setMobile(false)}/>}
  <main className="main"><header className="topbar"><div className="top-left"><button className="icon-btn burger" aria-label="Open menu" onClick={()=>setMobile(true)}><Menu size={22}/></button><div className="crumb">Workspace <ChevronRight size={15}/> <strong>{page}</strong></div></div><div className="top-right"><span className="demo-chip"><span/> Demo environment</span><button title="View upcoming bills" className="icon-btn notification" onClick={()=>go('Upcoming bills')}><Bell size={20}/>{state.bills.some(b=>!b.paid)&&<i/>}</button><span className="avatar">S</span></div></header>
  <div className="main-content">
  {page==='Overview'&&<><div className="heading-row"><div><span className="eyebrow">YOUR FINANCIAL SPACE</span><h1>Good to see you again <span className="wave">✳</span></h1><p>Here's what's happening with your money in {monthName(iso(today))}.</p></div><button className="primary" onClick={()=>openTx()}><Plus size={18}/> Add transaction</button></div>
   <div className="metrics"><Metric title="Monthly budget" value={money(monthBudget)} Icon={Wallet} foot="Your monthly spending limit"/><Metric title="Total spent" value={money(expenses)} Icon={ArrowUpRight} foot="Recorded expenses this month" accent="coral"/><Metric title="Budget remaining" value={money(remaining)} Icon={ArrowDownRight} foot={remaining>=0?'Available for this month':'Over your monthly budget'} accent="green"/><Metric title="Savings progress" value={money(savingTotal)} Icon={PiggyBank} foot="Across all your savings goals" accent="purple"/></div>
   <div className="layout-two"><section className="panel budget-panel"><div className="panel-head"><div><h2>Monthly spending</h2><p>Stay on top of your budget</p></div><div className="budget-controls"><span className="pill">{monthName(iso(today))}</span><button className="secondary compact-button" onClick={()=>{setBudgetDraft(String(monthBudget));setModal('budget')}}><Pencil size={14}/> Edit budget</button></div></div><div className="budget-values"><div><span>Spent so far</span><strong>{money(expenses)}</strong></div><div className="right"><span>Monthly budget</span><strong>{money(monthBudget)}</strong></div></div>{progress(expenses,monthBudget)}<div className="budget-labels"><span>{monthBudget?Math.round(expenses/monthBudget*100):0}% used</span><span>{money(Math.max(0,remaining))} left to spend</span></div>{expenses>monthBudget?<div className="notice danger"><AlertTriangle size={18}/><span>You're over your budget. Review recent transactions and adjust your plan.</span></div>:<div className="notice"><Lightbulb size={19}/><span>{expenses>monthBudget*.8?'Heads up: you’ve used over 80% of your monthly budget.':'Looking good! Keep tracking your expenses to stay on course.'}</span></div>}<button className="text-link" onClick={()=>go('Spending reports')}>Explore spending insights <ArrowUpRight size={16}/></button></section>
   <section className="panel"><div className="panel-head"><div><h2>Spending breakdown</h2><p>Where your money goes</p></div><button className="view-link" onClick={()=>go('Spending reports')}>View report <ChevronRight size={16}/></button></div><Breakdown rows={grouped} amount={expenses}/></section></div>
   <div className="layout-two bottom-grid"><section className="panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Your latest transactions</p></div><button className="view-link" onClick={()=>go('Transactions')}>View all <ChevronRight size={16}/></button></div><TxList rows={ordered.slice(0,4)} compact/></section><section className="panel goals-mini"><div className="panel-head"><div><h2>Savings goals</h2><p>Every little bit adds up</p></div><button className="view-link" onClick={()=>go('Savings goals')}>View goals <ChevronRight size={16}/></button></div>{state.goals.slice(0,3).map(g=><div className="goal-mini" key={g.id}><div className="mini-heading"><span className="goal-emoji">{g.icon}</span><div><strong>{g.name}</strong><small>{money(g.saved)} of {money(g.target)}</small></div><span className="percent">{Math.round(g.saved/g.target*100)}%</span></div>{progress(g.saved,g.target)}</div>)}{!state.goals.length&&<div className="empty">No goals yet.</div>}</section></div>
   <div className="ai-banner"><div className="ai-glow"><Sparkles size={25}/></div><div><strong>A little guidance goes a long way.</strong><p>Ask Money Mentor about budgeting, bills, or that next big purchase.</p></div><button onClick={()=>go('AI assistant')}>Chat with AI assistant <ArrowUpRight size={17}/></button></div>
  </>}
  {page==='Transactions'&&<><div className="heading-row"><div><span className="eyebrow">YOUR MONEY, ACCOUNTED FOR</span><h1>Transactions</h1><p>Every dollar tells a story. Keep yours organized.</p></div><div className="heading-actions"><button className="secondary" onClick={csv}><Download size={17}/> Export CSV</button><button className="primary" onClick={()=>openTx()}><Plus size={18}/> Add transaction</button></div></div><div className="metrics metrics-three"><Metric title="Income this month" value={money(earned)} Icon={TrendingUp} foot="From recorded income" accent="green"/><Metric title="Expenses this month" value={money(expenses)} Icon={TrendingDown} foot="From recorded expenses" accent="coral"/><Metric title="Net cash flow" value={money(earned-expenses)} Icon={Wallet} foot="Income minus expenses"/></div><section className="panel full-panel"><div className="panel-head"><div><h2>All transactions</h2><p>{state.transactions.length} entries saved in this browser</p></div><div className="searchbox"><Search size={17}/><input placeholder="Search transactions" aria-label="Search transactions" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><TxList rows={ordered.filter(t=>(t.name+' '+t.category).toLowerCase().includes(search.toLowerCase()))}/></section></>}
  {page==='Savings goals'&&<><div className="heading-row"><div><span className="eyebrow">MAKE THE FUTURE HAPPEN</span><h1>Savings goals</h1><p>Big dreams start with small steps.</p></div><button className="primary" onClick={()=>openGoal()}><Plus size={18}/> New goal</button></div><div className="metrics metrics-three"><Metric title="Total saved" value={money(savingTotal)} Icon={PiggyBank} foot="Across all goals" accent="green"/><Metric title="Savings targets" value={money(state.goals.reduce((s,g)=>s+Number(g.target),0))} Icon={Target} foot="Your combined target"/><Metric title="Active goals" value={String(state.goals.length)} Icon={CheckCircle2} foot="Goals you're working towards" accent="purple"/></div><div className="goal-grid">{state.goals.map(g=><div key={g.id} className="panel goal-card"><div className="goal-card-top"><span className="goal-large">{g.icon}</span><div className="row-actions"><button className="icon-btn subtle" aria-label={`Edit ${g.name}`} title="Edit goal" onClick={()=>openGoal(g)}><Pencil size={17}/></button><button className="icon-btn subtle" aria-label={`Delete ${g.name}`} title="Delete goal" onClick={()=>requestDelete('goals',g)}><Trash2 size={17}/></button></div></div><h2>{g.name}</h2><p>You've saved <strong>{money(g.saved)}</strong> toward {money(g.target)}</p>{progress(g.saved,g.target)}<div className="goal-footer"><span>{Math.round(g.saved/g.target*100)}% complete</span><span>{money(Math.max(0,g.target-g.saved))} to go</span></div><div className="goal-actions"><button className="secondary full-width" onClick={()=>setContribution({id:g.id,action:'add',amount:''})}><Plus size={16}/> Add savings</button><button className="secondary full-width" onClick={()=>setContribution({id:g.id,action:'remove',amount:''})}><Pencil size={16}/> Correct balance</button></div>{(g.activity||[]).length>0&&<small className="goal-activity">Last update: {(g.activity[g.activity.length-1].amount>0?'+':'−')+money(Math.abs(g.activity[g.activity.length-1].amount))} on {g.activity[g.activity.length-1].date}</small>}</div>)}{!state.goals.length&&<div className="panel empty">No savings goals yet. Create your first goal to start tracking.</div>}</div><p className="disclaimer"><Info size={15}/> Savings progress is manually recorded and does not move money between accounts.</p></>}
  {page==='Upcoming bills'&&<><div className="heading-row"><div><span className="eyebrow">NO MORE SURPRISES</span><h1>Upcoming bills</h1><p>Keep important due dates in one place.</p></div><button className="primary" onClick={()=>openBill()}><Plus size={18}/> Add bill</button></div><div className="metrics metrics-three"><Metric title="Unpaid bills" value={money(unpaid)} Icon={CalendarDays} foot="Total amount pending" accent="coral"/><Metric title="Bills remaining" value={String(state.bills.filter(b=>!b.paid).length)} Icon={Bell} foot="Still to pay"/><Metric title="Bills completed" value={String(state.bills.filter(b=>b.paid).length)} Icon={CheckCircle2} foot="Marked paid manually" accent="green"/></div><section className="panel full-panel"><div className="panel-head"><div><h2>Bill calendar</h2><p>Check off bills as you pay them</p></div><span className="pill">Manual tracking</span></div><div className="bill-list">{[...state.bills].sort((a,b)=>a.due.localeCompare(b.due)).map(b=><div className="bill-row" key={b.id}><div className="bill-date"><strong>{new Date(b.due+'T12:00:00').toLocaleDateString('en-US',{day:'2-digit'})}</strong><small>{new Date(b.due+'T12:00:00').toLocaleDateString('en-US',{month:'short'})}</small></div><div className="bill-info"><strong>{b.name}</strong><span>Due {new Date(b.due+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>{!b.paid&&b.due<iso(today)&&<small className="overdue-label">Overdue</small>}</div><strong>{money(b.amount)}</strong><div className="bill-status"><button className={'status-btn '+(b.paid?'paid':'')} onClick={()=>b.paid?setBillUnpay({id:b.id}):setBillPayment({id:b.id,date:iso(today),category:'Housing'})}>{b.paid?<><Check size={15}/> Paid</>:'Mark paid'}</button>{b.paymentTransactionId&&state.transactions.some(t=>t.id===b.paymentTransactionId)&&<span className="linked-expense">Expense recorded</span>}</div><div className="row-actions"><button className="icon-btn subtle" title="Edit bill" aria-label={`Edit ${b.name}`} onClick={()=>openBill(b)}><Pencil size={17}/></button><button className="icon-btn subtle" title="Delete bill" aria-label={`Delete ${b.name}`} onClick={()=>requestDelete('bills',b)}><Trash2 size={17}/></button></div></div>)}{!state.bills.length&&<div className="empty">No bills yet. Add one to start tracking.</div>}</div></section><p className="disclaimer"><Info size={15}/> Marking a bill paid is a manual record only. Optionally log an expense when you mark it paid; existing linked expenses won't be counted twice. No real payments are made.</p></>}
  {page==='Spending reports'&&<><div className="heading-row"><div><span className="eyebrow">TURN NUMBERS INTO CLARITY</span><h1>Spending reports</h1><p>See your money patterns, one day at a time.</p></div><div className="segmented">{['Daily','Monthly','Quarterly'].map(p=><button key={p} className={period===p?'selected':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div><div className="metrics metrics-three"><Metric title={`${period} expenses`} value={money(reportSpent)} Icon={ArrowUpRight} foot="All recorded spending" accent="coral"/><Metric title={`${period} income`} value={money(windowed.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0))} Icon={ArrowDownRight} foot="All recorded deposits" accent="green"/><Metric title="Transactions" value={String(windowed.length)} Icon={ArrowLeftRight} foot={`In selected ${period.toLowerCase()} period`}/></div><div className="layout-two"><section className="panel"><div className="panel-head"><div><h2>Expenses by category</h2><p>{period==='Daily'?'Today':period==='Monthly'?monthName(iso(today)):'Past 90 days'}</p></div></div><Breakdown rows={reportRows} amount={reportSpent}/></section><section className="panel"><div className="panel-head"><div><h2>Category comparison</h2><p>Your biggest spending areas</p></div></div>{reportRows.length?<div className="bar-chart">{reportRows.map(r=><div className="chart-item" key={r.name}><div><span>{r.name}</span><strong>{money(r.value)}</strong></div><div className="chart-track"><div style={{width:`${r.value/(reportRows[0].value||1)*100}%`,background:r.color}}/></div></div>)}</div>:<div className="empty">No spending to compare yet.</div>}</section></div><section className="panel full-panel"><div className="panel-head"><div><h2>Transactions in this period</h2><p>All entries matching your report</p></div><button className="view-link" onClick={csv}>Export all <Download size={16}/></button></div><TxList rows={[...windowed].sort((a,b)=>b.date.localeCompare(a.date))} compact/></section><p className="disclaimer"><Info size={15}/> Reports are based on entered transactions, not verified bank statements. Quarterly covers the last 90 days.</p></>}
  {page==='Data & settings'&&<><div className="heading-row"><div><span className="eyebrow">YOU CONTROL YOUR DATA</span><h1>Data & settings</h1><p>Back up your financial entries, restore them later, or explore the demo safely.</p></div></div><div className="settings-grid"><section className="panel settings-panel"><div className="settings-icon"><Download size={22}/></div><h2>Back up your data</h2><p>Download a JSON file of your transactions, savings goals, bills, current budget, and assistant messages. Keep it somewhere private.</p><button className="primary" onClick={downloadBackup}><Download size={17}/> Download backup</button></section><section className="panel settings-panel"><div className="settings-icon"><RotateCcw size={22}/></div><h2>Restore a backup</h2><p>Import a Money Mentor JSON backup to recover data or move it between devices. You'll review the contents before anything is replaced.</p><button className="secondary" onClick={chooseBackup}><RotateCcw size={17}/> Choose backup file</button></section><section className="panel settings-panel"><div className="settings-icon"><Pencil size={22}/></div><h2>Monthly spending budget</h2><p>Your limit for {monthName(iso(today))} is <strong>{money(monthBudget)}</strong>. Adjust it any time; other months keep their own budget.</p><button className="secondary" onClick={()=>{setBudgetDraft(String(monthBudget));setModal('budget')}}><Pencil size={17}/> Edit monthly budget</button></section><section className="panel settings-panel"><div className="settings-icon"><CircleHelp size={22}/></div><h2>Getting started</h2><p>See how to track an expense, set a savings goal, log a paid bill, and protect your records with a backup.</p><button className="secondary" onClick={()=>setShowHelp(true)}><CircleHelp size={17}/> Quick guide</button></section></div><div className="notice privacy-box"><ShieldCheck size={21}/><span>Data stays in this browser's local storage unless you export a backup. JSON backups are not encrypted. Do not enter passwords, bank account details, or other sensitive information.</span></div><button className="secondary reset-data" onClick={()=>setConfirmReset(true)}><RotateCcw size={16}/> Reset or clear demo data</button></>}
  {page==='AI assistant'&&<><div className="heading-row"><div><span className="eyebrow">HERE TO HELP YOU FIGURE IT OUT</span><h1>Ask Money Mentor <span className="sparkle-heading"><Sparkles size={24}/></span></h1><p>Financial questions are easier when you don't have to figure them out alone.</p></div><span className="ai-label"><Sparkles size={15}/> Rule-based AI demo</span></div><div className="chat-container"><div className="chat-header"><div className="assistant-avatar"><Sparkles size={24}/></div><div><strong>Money Mentor</strong><p><span className="online-dot"/> Here to help · Demo assistant</p></div><span className="chat-shield"><ShieldCheck size={15}/> Private demo</span></div><div className="chat-messages">{state.messages.map(m=><div key={m.id} className={'chat-line '+(m.role==='user'?'user':'assistant')}><div className="chat-bubble">{m.text}</div></div>)}</div><div className="quick-prompts">{['How is my budget looking?','Can I afford $60?','How much did I spend on food?','How do student loans work?'].map(s=><button key={s} onClick={()=>send(s)}>{s} <ArrowUpRight size={14}/></button>)}</div><form className="chat-input" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="Message Money Mentor" placeholder="Ask a question about your finances…" value={draft} onChange={e=>setDraft(e.target.value)}/><button className="send-btn" disabled={!draft.trim()} aria-label="Send message"><Send size={19}/></button></form><div className="chat-disclaimer"><Info size={14}/> Demo assistant uses transparent rules, not a live AI model. Educational guidance only; verify important financial decisions.</div></div></>}
  <footer className="footer"><span>© {today.getFullYear()} Money Mentor · Student finance, made simple</span><button onClick={()=>go('Data & settings')}><ShieldCheck size={14}/> Backup & settings</button></footer>
  </div></main>
  {!!toast&&<div className={'toast '+(undoRecord?'toast-with-action':'')} role="status" aria-live="polite"><CheckCircle2 size={18}/><span>{toast}</span>{undoRecord&&<button className="toast-undo" onClick={undoDelete} type="button"><RotateCcw size={16}/> Undo</button>}</div>}
  {!!modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal('')}}><div className="modal" role="dialog" aria-modal="true" aria-label={modal==='tx'?`${editingTxId!==null?'Edit':'Add'} ${newTx.kind==='income'?'income':'expense'}`:modal==='goal'?(editingGoalId!==null?'Edit savings goal':'Create savings goal'):modal==='bill'?(editingBillId!==null?'Edit bill':'Add upcoming bill'):'Edit monthly budget'}><div className="modal-heading"><div><h2>{modal==='tx'?`${editingTxId!==null?'Edit':'Add'} ${newTx.kind==='income'?'income':'expense'}`:modal==='goal'?(editingGoalId!==null?'Edit savings goal':'Create savings goal'):modal==='bill'?(editingBillId!==null?'Edit bill':'Add upcoming bill'):'Edit monthly budget'}</h2><p>{modal==='tx'?(newTx.kind==='income'?'Record money you received.':'Record money you spent.'):modal==='goal'?'Name your goal and track your progress.':modal==='bill'?'Stay ahead of what you owe.':`Set a spending limit for ${monthName(iso(today))}.`}</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setModal('')}><X size={20}/></button></div>
  {modal==='tx'&&<form onSubmit={saveTx} className="modal-form"><label>Type<select value={newTx.kind} disabled={editingTxId!==null&&state.transactions.some(t=>t.id===editingTxId&&t.billId)} onChange={e=>setNewTx(v=>({...v,kind:e.target.value}))}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>{newTx.kind==='income'?'Income source':'What was this expense for?'}<input required placeholder={newTx.kind==='income'?'e.g., Part-time job paycheck':'e.g., Lunch at campus café'} maxLength={70} value={newTx.name} onChange={e=>setNewTx(v=>({...v,name:e.target.value}))}/></label><label>{newTx.kind==='income'?'Income amount ($)':'Expense amount ($)'}<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={newTx.amount} onChange={e=>setNewTx(v=>({...v,amount:e.target.value}))}/></label>{newTx.kind==='expense'&&<label>Category<select value={newTx.category} onChange={e=>setNewTx(v=>({...v,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>}{editingTxId!==null&&state.transactions.some(t=>t.id===editingTxId&&t.billId)&&<p className="field-note">This expense is linked to a paid bill. You can edit its details but cannot change it into income.</p>}<label>Date<input required type="date" value={newTx.date} onChange={e=>setNewTx(v=>({...v,date:e.target.value}))}/></label><button className="primary full-width" type="submit"><Plus size={18}/> {editingTxId!==null?'Save changes':newTx.kind==='income'?'Add income':'Add expense'}</button></form>}
  {modal==='goal'&&<form onSubmit={saveGoal} className="modal-form"><label>Goal name<input required maxLength={60} placeholder="e.g., New laptop" value={newGoal.name} onChange={e=>setNewGoal(v=>({...v,name:e.target.value}))}/></label><label>Target amount ($)<input required type="number" min="0.01" step="0.01" placeholder="1000" value={newGoal.target} onChange={e=>setNewGoal(v=>({...v,target:e.target.value}))}/></label><label>{editingGoalId!==null?'Current saved amount ($)':'Starting savings ($) — optional'}<input type="number" min="0" step="0.01" placeholder="Enter amount already saved" value={newGoal.saved} onChange={e=>setNewGoal(v=>({...v,saved:e.target.value}))}/><small className="form-help">{editingGoalId!==null?'Update this balance to correct an earlier entry. No money moves between accounts.':"Money already saved toward this goal. Leave blank if you’re starting from $0. This does not transfer money."}</small></label><label>Icon<select value={newGoal.icon} onChange={e=>setNewGoal(v=>({...v,icon:e.target.value}))}>{['🎯','💻','✈️','🛟','📚','🚲','🏠'].map(i=><option key={i} value={i}>{i}</option>)}</select></label><button className="primary full-width" type="submit">{editingGoalId!==null?<Pencil size={18}/>:<Plus size={18}/>} {editingGoalId!==null?'Save goal changes':'Create goal'}</button></form>}
  {modal==='bill'&&<form onSubmit={saveBill} className="modal-form"><label>Bill name<input required maxLength={70} placeholder="e.g., Electric bill" value={newBill.name} onChange={e=>setNewBill(v=>({...v,name:e.target.value}))}/></label><label>Amount ($)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={newBill.amount} onChange={e=>setNewBill(v=>({...v,amount:e.target.value}))}/></label><label>Due date<input required type="date" value={newBill.due} onChange={e=>setNewBill(v=>({...v,due:e.target.value}))}/></label>{editingBillId!==null&&state.bills.some(b=>b.id===editingBillId&&b.paymentTransactionId)&&<p className="field-note">If you change this bill’s amount, its previously recorded payment expense will not change automatically. Edit the expense separately if needed.</p>}<button className="primary full-width" type="submit">{editingBillId!==null?<Pencil size={18}/>:<Plus size={18}/>} {editingBillId!==null?'Save bill changes':'Add bill'}</button></form>}
  {modal==='budget'&&<form onSubmit={saveBudget} className="modal-form"><label>Monthly spending limit ($)<input type="number" min="0.01" max="10000000000" step="0.01" required value={budgetDraft} onChange={e=>setBudgetDraft(e.target.value)}/></label><p className="field-note">This limit controls the current month's overview, alerts, and assistant budget estimates. It does not change your account balance.</p><button className="primary full-width" type="submit"><Check size={17}/> Save budget</button></form>}
  </div></div>}
  {!!pendingDelete&&<div className="modal-backdrop confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPendingDelete(null)}}>
   <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc">
    <div className="confirm-icon"><Trash2 size={22}/></div>
    <h2 id="delete-dialog-title">Delete {pendingDelete.kind==='transactions'?'transaction':pendingDelete.kind==='goals'?'savings goal':'bill'}?</h2>
    <p id="delete-dialog-desc">Are you sure you want to delete <strong>“{pendingDelete.item.name}”</strong>{pendingDelete.kind==='transactions'?` (${money(Math.abs(pendingDelete.item.amount))})`:pendingDelete.kind==='bills'?` (${money(pendingDelete.item.amount)})`:''}? {pendingDelete.kind==='goals'?'Its recorded savings progress will be removed.':pendingDelete.kind==='transactions'?'Your financial summaries will update.':'Your upcoming-bills totals will update.'}</p>
    <p className="confirm-note"><Info size={15}/> You can undo this action for 10 seconds after deletion.</p>
    <div className="confirm-actions"><button ref={cancelDeleteRef} type="button" className="secondary" onClick={()=>setPendingDelete(null)}>Cancel</button><button type="button" className="danger-button" onClick={confirmDelete}><Trash2 size={16}/> Delete</button></div>
   </div>
  </div>}
  <input ref={restoreFileRef} type="file" accept=".json,application/json" className="visually-hidden" tabIndex={-1} onChange={readBackup} aria-label="Select Money Mentor backup JSON file"/>
  {contribution&&goalForContribution&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setContribution(null)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Adjust savings"><div className="modal-heading"><div><h2>{contribution.action==='add'?'Add savings':'Correct savings balance'}</h2><p>{goalForContribution.name}</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setContribution(null)}><X size={20}/></button></div><div className="contribution-summary"><div><span>Currently saved</span><strong>{money(goalForContribution.saved)}</strong></div><div><span>Target</span><strong>{money(goalForContribution.target)}</strong></div></div><form onSubmit={applyContribution} className="modal-form"><label>Action<select value={contribution.action} onChange={e=>setContribution({...contribution,action:e.target.value,amount:''})}><option value="add">Add money saved</option><option value="remove">Subtract mistaken entry / correction</option></select></label><label>Amount ($)<input autoFocus type="number" min="0.01" step="0.01" required placeholder="e.g., 50.00" value={contribution.amount} onChange={e=>setContribution({...contribution,amount:e.target.value})}/></label>{contribution.amount&&Number(contribution.amount)>0&&<div className="contribution-result">New goal balance: <strong>{money(Number(goalForContribution.saved)+(contribution.action==='add'?1:-1)*Number(contribution.amount))}</strong></div>}{contribution.action==='remove'&&Number(contribution.amount)>Number(goalForContribution.saved)&&<p className="form-error">You cannot subtract more than you have saved.</p>}<p className="field-note">This is manual tracking only. No money is transferred or withdrawn.</p><button className="primary full-width" type="submit" disabled={!contribution.amount||Number(contribution.amount)<=0||(contribution.action==='remove'&&Number(contribution.amount)>Number(goalForContribution.saved))}><Check size={17}/> Save contribution</button></form></div></div>}
  {billPayment&&(()=>{const b=state.bills.find(x=>x.id===billPayment.id);if(!b)return null;const linked=state.transactions.some(t=>t.id===b.paymentTransactionId);return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setBillPayment(null)}}><div className="modal" role="dialog" aria-modal="true" aria-label={`Mark ${b.name} paid`}><div className="modal-heading"><div><h2>Mark bill as paid</h2><p>{b.name} · {money(b.amount)}</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setBillPayment(null)}><X size={20}/></button></div><div className="notice pay-notice"><Info size={18}/><span>Choose whether to record this payment as an expense too. If you already entered the expense manually, use <strong>Mark paid only</strong> to avoid counting it twice.</span></div>{!linked&&<div className="modal-form pay-fields"><label>Payment date<input type="date" value={billPayment.date} onChange={e=>setBillPayment(v=>({...v,date:e.target.value}))}/></label><label>Expense category<select value={billPayment.category} onChange={e=>setBillPayment(v=>({...v,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>}{linked&&<p className="field-note">This bill already has a linked expense; re-marking it paid will not add another.</p>}<div className="pay-actions"><button className="secondary full-width" onClick={()=>recordBillPaid(false)}>Mark paid only</button><button className="primary full-width" onClick={()=>recordBillPaid(true)} disabled={!billPayment.date}><Check size={17}/> {linked?'Mark paid (expense already recorded)':'Mark paid + record expense'}</button></div></div></div>})()}
  {billUnpay&&(()=>{const b=state.bills.find(x=>x.id===billUnpay.id);return b?<div className="modal-backdrop"><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-label="Mark bill unpaid"><h2>Mark “{b.name}” unpaid?</h2><p>This will change the bill's status. If a payment expense was recorded earlier, it will stay in Transactions so your history is not deleted by mistake.</p><div className="confirm-actions"><button className="secondary" onClick={()=>setBillUnpay(null)}>Cancel</button><button className="primary" onClick={markBillUnpaid}>Mark unpaid</button></div></div></div>:null})()}
  {restorePreview&&<div className="modal-backdrop"><div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-label="Review backup restore"><div className="confirm-icon"><RotateCcw size={22}/></div><h2>{restorePreview.error?'Unable to restore backup':'Restore this backup?'}</h2>{restorePreview.error?<p className="form-error">{restoreError}</p>:<><p>File: <strong>{restorePreview.name}</strong></p><div className="restore-stats"><span>{restorePreview.data.transactions.length} transactions</span><span>{restorePreview.data.goals.length} goals</span><span>{restorePreview.data.bills.length} bills</span></div><p>This will <strong>replace all current browser records</strong>, including your budgets and messages. Export a backup first if you want to keep them.</p></>}<div className="confirm-actions"><button className="secondary" onClick={()=>{setRestorePreview(null);setRestoreError('')}}>Cancel</button>{!restorePreview.error&&<button className="danger-button" onClick={restoreBackup}><RotateCcw size={16}/> Replace & restore</button>}</div></div></div>}
  {firstVisit&&<div className="modal-backdrop welcome-backdrop"><div className="modal welcome-modal" role="dialog" aria-modal="true" aria-label="Welcome to Money Mentor"><div className="welcome-symbol"><CircleDollarSign size={30}/></div><span className="eyebrow">WELCOME TO YOUR FINANCIAL SPACE</span><h2>Make sense of your money, one step at a time.</h2><p>Track expenses, plan a budget, set goals and stay ahead of bills. Your entries stay in this browser. This is a demo, not a bank account.</p><div className="welcome-options"><button className="primary full-width" onClick={()=>completeOnboarding(true)}>Explore with sample data <ArrowUpRight size={17}/></button><button className="secondary full-width" onClick={()=>completeOnboarding(false)}>Start with my own empty workspace</button></div><small>Use fictional or non-sensitive data only. You can reset the demo or export a backup later.</small></div></div>}
  {showHelp&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowHelp(false)}}><div className="modal guide-modal" role="dialog" aria-modal="true" aria-label="Money Mentor quick guide"><div className="modal-heading"><div><h2>Quick start guide</h2><p>Four steps to get comfortable with Money Mentor.</p></div><button className="icon-btn" aria-label="Close" onClick={()=>setShowHelp(false)}><X size={20}/></button></div><ol><li><strong>Transactions:</strong> Add income or expenses. Use Edit to correct mistakes.</li><li><strong>Budget:</strong> Edit the current month's spending limit on Overview.</li><li><strong>Goals & bills:</strong> Track savings manually and optionally log expenses when paying bills.</li><li><strong>Backup:</strong> Export a JSON copy before clearing browser data or changing devices.</li></ol><p className="field-note">All amounts are self-reported. This demo is not a banking or financial advice service.</p><button className="primary full-width" onClick={()=>setShowHelp(false)}>Got it</button></div></div>}
  {confirmReset&&<div className="modal-backdrop"><div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-label="Reset or clear data"><div className="confirm-icon"><AlertTriangle size={22}/></div><h2>Reset your workspace?</h2><p>This will replace current transactions, goals, bills, and budgets. Export a backup first if you might need your data later.</p><div className="reset-options"><button className="secondary full-width" onClick={()=>{setState(starter());setConfirmReset(false);notify('Sample data restored');go('Overview')}}>Restore example data</button><button className="danger-button full-width" onClick={()=>{setState(emptyState());setConfirmReset(false);notify('All demo records cleared');go('Overview')}}>Clear all records</button><button className="secondary full-width" onClick={()=>setConfirmReset(false)}>Cancel</button></div></div></div>}
 </div>
}
export default App;
