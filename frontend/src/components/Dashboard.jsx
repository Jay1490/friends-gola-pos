import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI, ordersAPI, settingsAPI, withdrawalsAPI } from '../services/api';

const fc = (n) => `₹${Number(n).toFixed(0)}`;

const CATS      = ['Colours', 'Toppings', 'Baraf', 'Other'];
const CAT_EMOJI = { Colours:'🎨', Toppings:'🧁', Baraf:'🧊', Other:'📦' };
const CAT_COLOR = { Colours:'#e91e63', Toppings:'#ff9800', Baraf:'#2196f3', Other:'#607d8b' };

const PAYERS      = ['JP', 'Jenish', 'Urvish'];
const PAYER_EMOJI = { JP:'👦🏻', Jenish:'🧔🏻‍♂️', Urvish:'👨🏻' };
const PAYER_COLOR = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669' };

const todayIST = () => {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().split('T')[0];
};
const currentMonth = () => {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().slice(0, 7);
};
const fmtMonth = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const inp = {
  width:'100%', padding:'10px 14px', borderRadius:10,
  border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
  boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00', background:'#fff',
};

const EXP_PER_PAGE = 6;

// ── Expense row ───────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onEdit, onDelete }) {
  const payer = expense.paidBy || 'JP';
  const color = PAYER_COLOR[payer] || '#c17f3c';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 8px', borderBottom:'1px solid #f5efe8' }}>
      <div style={{ width:34, height:34, borderRadius:10, background: (CAT_COLOR[expense.category] || '#607d8b') + '20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
        {CAT_EMOJI[expense.category] || '📦'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{expense.title}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, background:(CAT_COLOR[expense.category]||'#607d8b')+'20', color:CAT_COLOR[expense.category]||'#607d8b', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>{expense.category}</span>
          <span style={{ fontSize:10, background:color+'18', color, padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
            {PAYER_EMOJI[payer] || ''} {payer}
          </span>
          <span style={{ fontSize:11, color:'#b0a090' }}>{expense.date}</span>
          {expense.note && <span style={{ fontSize:11, color:'#c9a96e' }}>· {expense.note}</span>}
        </div>
      </div>
      <div style={{ fontWeight:800, color:'#c0504d', fontSize:13, flexShrink:0 }}>-{fc(expense.amount)}</div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={() => onEdit(expense)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #e0d5c8', background:'#fff8ef', cursor:'pointer', fontSize:13, color:'#c17f3c' }}>✏️</button>
        <button onClick={() => onDelete(expense._id)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #f0d0d0', background:'transparent', cursor:'pointer', fontSize:14, color:'#c0504d', fontWeight:700, lineHeight:1 }}>×</button>
      </div>
    </div>
  );
}

// ── Section: Statements ───────────────────────────────────────────────────────
function StatementsSection({ onBack }) {
  const [mode,        setMode]        = useState('alltime'); // 'alltime' | 'month'
  const [month,       setMonth]       = useState(currentMonth());
  const [allSummary,  setAllSummary]  = useState(null);
  const [monSummary,  setMonSummary]  = useState(null);
  const [allOrders,   setAllOrders]   = useState([]);
  const [monOrders,   setMonOrders]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [allRes, oRes] = await Promise.all([
          expensesAPI.getSummary(''),
          ordersAPI.getAll({ limit: 10000 }),
        ]);
        setAllSummary(allRes.data.data);
        setAllOrders(oRes.data.data || []);
      } catch { toast.error('Failed to load statements'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (mode !== 'month') return;
    (async () => {
      try {
        const [expRes, oRes] = await Promise.all([
          expensesAPI.getSummary(month),
          ordersAPI.getAll({ month, limit: 10000 }),
        ]);
        setMonSummary(expRes.data.data);
        setMonOrders(oRes.data.data || []);
      } catch { toast.error('Failed to load month data'); }
    })();
  }, [month, mode]);

  const summary = mode === 'month' ? monSummary : allSummary;

  // All-time computed
  const activeAll = allOrders.filter(o => o.status !== 'cancelled');
  const allIncome = activeAll.reduce((s, o) => s + o.total, 0);
  const allOnline = activeAll.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);
  const allCash   = activeAll.filter(o => !o.paymentMethod || o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);

  // Month computed
  const activeMon = monOrders.filter(o => o.status !== 'cancelled');
  const monIncome = activeMon.reduce((s, o) => s + o.total, 0);
  const monOnline = activeMon.filter(o => o.paymentMethod === 'online').reduce((s, o) => s + o.total, 0);
  const monCash   = activeMon.filter(o => !o.paymentMethod || o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);

  const income  = mode === 'month' ? monIncome : allIncome;
  const expense = summary?.totalExpenses || 0;
  const profit  = income - expense;
  const orders  = mode === 'month' ? activeMon.length : activeAll.length;
  const online  = mode === 'month' ? monOnline : allOnline;
  const cash    = mode === 'month' ? monCash   : allCash;

  const profitPct  = income > 0 ? Math.round((Math.max(0, profit) / income) * 100) : 0;
  const expensePct = income > 0 ? Math.round((expense / income) * 100) : 0;
  const onlinePct  = income > 0 ? Math.round((online / income) * 100) : 0;
  const cashPct    = income > 0 ? Math.round((cash   / income) * 100) : 0;

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'12px 12px 70px', fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:18, border:'1.5px solid #e0d5c8', background:'#fff', cursor:'pointer', fontSize:18, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>
        <h2 style={{ margin:0, fontSize:20, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>💰 Statements</h2>
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{key:'alltime',label:'All time'},{key:'month',label:'By month'}].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} style={{ flex:1, padding:'10px', borderRadius:12, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s', background:mode===m.key?'#3d1a00':'#f0ebe4', color:mode===m.key?'#f5c842':'#7a6a5a' }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'month' && (
        <div style={{ marginBottom:14 }}>
          <input type="month" value={month} max={currentMonth()}
            onChange={e => setMonth(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #e0d5c8', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', color:'#3d1a00', background:'#fff', cursor:'pointer', width:'100%' }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60, fontSize:30, color:'#c9a96e' }}>⏳</div>
      ) : (
        <>
          <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:12 }}>
            {mode === 'alltime' ? 'ALL TIME' : fmtMonth(month).toUpperCase()} · {orders} orders
          </div>

          {/* 4 stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>TOTAL INCOME</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#2e7d32' }}>{fc(income)}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>TOTAL EXPENSE</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#c0504d' }}>{fc(expense)}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>ONLINE</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1a237e' }}>{fc(online)}</div>
              <div style={{ fontSize:11, color:'#b0a090', marginTop:3 }}>{onlinePct}% of income</div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:'14px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>CASH</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#c17f3c' }}>{fc(cash)}</div>
              <div style={{ fontSize:11, color:'#b0a090', marginTop:3 }}>{cashPct}% of income</div>
            </div>
          </div>

          {/* Net profit big card */}
          <div style={{ background: profit >= 0 ? '#f0fff4' : '#fff0f0', borderRadius:14, padding:'16px 18px', border:`1.5px solid ${profit>=0?'#a5d6a7':'#f5a0a0'}`, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>NET PROFIT</div>
              <div style={{ fontSize:28, fontWeight:800, color: profit >= 0 ? '#2e7d32' : '#c0504d' }}>{fc(profit)}</div>
              <div style={{ fontSize:12, color: profit>=0?'#2e7d32':'#c0504d', marginTop:3 }}>
                {income > 0 ? `${profitPct}% of income` : '—'}
              </div>
            </div>
            <div style={{ fontSize:36 }}>{profit >= 0 ? '📈' : '📉'}</div>
          </div>

          {/* ── Profit vs Expense stacked bar ── */}
          {income > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:'16px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.5, marginBottom:14 }}>INCOME BREAKDOWN</div>

              {/* Stacked bar: profit | expense fills the full income */}
              <div style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}>
                  <span>Profit vs Expense (of total income)</span>
                  <span style={{ fontWeight:700 }}>{fc(income)}</span>
                </div>
                <div style={{ height:20, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${profitPct}%`, background:'#2e7d32', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {profitPct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{profitPct}%</span>}
                  </div>
                  <div style={{ width:`${expensePct}%`, background:'#c0504d', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {expensePct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{expensePct}%</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#2e7d32', display:'inline-block' }}></span>
                    <span style={{ color:'#2e7d32', fontWeight:700 }}>Profit {fc(profit)} ({profitPct}%)</span>
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#c0504d', display:'inline-block' }}></span>
                    <span style={{ color:'#c0504d', fontWeight:700 }}>Expense {fc(expense)} ({expensePct}%)</span>
                  </span>
                </div>
              </div>

              {/* Online vs Cash bar */}
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px dashed #f0ebe4' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}>
                  <span>Online vs Cash</span>
                </div>
                <div style={{ height:14, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${onlinePct}%`, background:'#1a237e', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {onlinePct > 12 && <span style={{ fontSize:9, fontWeight:700, color:'#fff' }}>{onlinePct}%</span>}
                  </div>
                  <div style={{ width:`${cashPct}%`, background:'#c17f3c', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {cashPct > 12 && <span style={{ fontSize:9, fontWeight:700, color:'#fff' }}>{cashPct}%</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#1a237e', display:'inline-block' }}></span>
                    <span style={{ color:'#1a237e', fontWeight:700 }}>Online {fc(online)} ({onlinePct}%)</span>
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#c17f3c', display:'inline-block' }}></span>
                    <span style={{ color:'#c17f3c', fontWeight:700 }}>Cash {fc(cash)} ({cashPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Section: Cash Withdrawal ──────────────────────────────────────────────────
function CashWithdrawalSection({ onBack }) {
  const [mode,       setMode]       = useState('alltime');
  const [month,      setMonth]      = useState(currentMonth());
  const [withdrawals,setWithdrawals]= useState([]);
  const [upiOwners,  setUpiOwners]  = useState([]);
  const [allOrders,  setAllOrders]  = useState([]);
  const [monOrders,  setMonOrders]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cashInputs, setCashInputs] = useState({ JP:'', Jenish:'', Urvish:'' });
  const [cashNotes,  setCashNotes]  = useState({ JP:'', Jenish:'', Urvish:'' });
  const [savingCash, setSavingCash] = useState({ JP:false, Jenish:false, Urvish:false });
  const [expanded,   setExpanded]   = useState(null);

  // Initial load — all-time
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [wRes, setRes, oRes] = await Promise.all([
          withdrawalsAPI.getAll({}),
          settingsAPI.getPublic(),
          ordersAPI.getAll({ limit: 10000 }),
        ]);
        setWithdrawals(wRes.data.data);
        setUpiOwners(setRes.data.data?.upiOwners || []);
        setAllOrders(oRes.data.data || []);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    })();
  }, []);

  // Month mode load
  useEffect(() => {
    if (mode !== 'month') return;
    (async () => {
      try {
        const [wRes, oRes] = await Promise.all([
          withdrawalsAPI.getAll({ month }),
          ordersAPI.getAll({ month, limit: 10000 }),
        ]);
        setWithdrawals(wRes.data.data);
        setMonOrders(oRes.data.data || []);
      } catch { toast.error('Failed to load month data'); }
    })();
  }, [month, mode]);

  const handleModeSwitch = async (m) => {
    setMode(m);
    if (m === 'alltime') {
      try {
        const [wRes, oRes] = await Promise.all([
          withdrawalsAPI.getAll({}),
          allOrders.length ? Promise.resolve({ data:{ data: allOrders } }) : ordersAPI.getAll({ limit: 10000 }),
        ]);
        setWithdrawals(wRes.data.data);
        if (!allOrders.length) setAllOrders(oRes.data.data || []);
      } catch {}
    }
  };

  const orders       = mode === 'month' ? monOrders : allOrders;
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const onlineOrders = activeOrders.filter(o => o.paymentMethod === 'online');
  const cashOrders   = activeOrders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash');
  const totalIncome  = activeOrders.reduce((s,o) => s+o.total, 0);
  const onlineIncome = onlineOrders.reduce((s,o) => s+o.total, 0);
  const cashIncome   = cashOrders.reduce((s,o) => s+o.total, 0);
  const onlinePct    = totalIncome > 0 ? Math.round((onlineIncome / totalIncome) * 100) : 0;
  const cashPct      = totalIncome > 0 ? Math.round((cashIncome   / totalIncome) * 100) : 0;

  const wByPerson = PAYERS.reduce((acc, p) => {
    acc[p] = withdrawals.filter(w => w.person === p).reduce((s,w) => s+w.amount, 0);
    return acc;
  }, {});
  const totalWithdrawn = Object.values(wByPerson).reduce((s,v) => s+v, 0);
  const remaining      = cashIncome - totalWithdrawn;
  const withdrawnPct   = cashIncome > 0 ? Math.min(100, Math.round((totalWithdrawn / cashIncome) * 100)) : 0;
  const remainingPct   = 100 - withdrawnPct;

  const ownerOnline = upiOwners.reduce((acc, o) => {
    acc[o.key] = onlineOrders.filter(ord => ord.upiOwner === o.key).reduce((s,ord) => s+ord.total, 0);
    return acc;
  }, {});

  const recordWithdrawal = async (person) => {
    const amt = parseFloat(cashInputs[person]);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setSavingCash(p => ({ ...p, [person]:true }));
    try {
      await withdrawalsAPI.create({ person, amount:amt, note:cashNotes[person]||'', date:todayIST() });
      setCashInputs(p => ({ ...p, [person]:'' }));
      setCashNotes(p => ({ ...p, [person]:'' }));
      toast.success(`✅ ${person} received ${fc(amt)}`);
      const wRes = await withdrawalsAPI.getAll(mode === 'month' ? { month } : {});
      setWithdrawals(wRes.data.data);
    } catch { toast.error('Failed'); }
    finally { setSavingCash(p => ({ ...p, [person]:false })); }
  };

  const deleteW = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await withdrawalsAPI.delete(id);
      toast.success('Deleted');
      const wRes = await withdrawalsAPI.getAll(mode === 'month' ? { month } : {});
      setWithdrawals(wRes.data.data);
    } catch { toast.error('Failed'); }
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'12px 12px 70px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:18, border:'1.5px solid #e0d5c8', background:'#fff', cursor:'pointer', fontSize:18, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>
        <h2 style={{ margin:0, fontSize:20, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>🏧 Cash Withdrawal</h2>
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{key:'alltime',label:'All time'},{key:'month',label:'By month'}].map(m => (
          <button key={m.key} onClick={() => handleModeSwitch(m.key)} style={{ flex:1, padding:'10px', borderRadius:12, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s', background:mode===m.key?'#3d1a00':'#f0ebe4', color:mode===m.key?'#f5c842':'#7a6a5a' }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'month' && (
        <input type="month" value={month} max={currentMonth()}
          onChange={e => setMonth(e.target.value)}
          style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e0d5c8', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', color:'#3d1a00', background:'#fff', cursor:'pointer', marginBottom:14 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60, fontSize:30, color:'#c9a96e' }}>⏳</div>
      ) : (
        <>
          <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:12 }}>
            {mode === 'alltime' ? 'ALL TIME' : fmtMonth(month).toUpperCase()} · {activeOrders.length} orders
          </div>

          {/* 3 stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
            {[
              { label:'Total income', value:fc(totalIncome), color:'#2e7d32' },
              { label:'Online',       value:fc(onlineIncome), color:'#1a237e' },
              { label:'Cash',         value:fc(cashIncome),   color:'#c17f3c' },
            ].map(c => (
              <div key={c.label} style={{ background:'#fff', borderRadius:12, padding:'12px 10px', border:'1px solid #e8e0d5', textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, marginBottom:4 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontSize:15, fontWeight:800, color:c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Withdrawn big card */}
          <div style={{ background:'#fff8ef', borderRadius:14, padding:'16px 18px', border:'1.5px solid #f5c842', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>TOTAL WITHDRAWN</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#c17f3c' }}>{fc(totalWithdrawn)}</div>
              <div style={{ fontSize:12, color: remaining >= 0 ? '#2e7d32' : '#c0504d', marginTop:3 }}>
                Remaining: {fc(remaining)}
              </div>
            </div>
            <div style={{ fontSize:36 }}>🏧</div>
          </div>

          {/* Stacked bars */}
          {totalIncome > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:'16px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.5, marginBottom:14 }}>INCOME BREAKDOWN</div>

              {/* Online vs Cash bar */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}>
                  <span>Online vs Cash</span>
                  <span style={{ fontWeight:700 }}>{fc(totalIncome)}</span>
                </div>
                <div style={{ height:20, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                  <div style={{ width:`${onlinePct}%`, background:'#1a237e', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {onlinePct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{onlinePct}%</span>}
                  </div>
                  <div style={{ width:`${cashPct}%`, background:'#c17f3c', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {cashPct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{cashPct}%</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#1a237e', display:'inline-block' }}></span>
                    <span style={{ color:'#1a237e', fontWeight:700 }}>Online {fc(onlineIncome)} ({onlinePct}%)</span>
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:'#c17f3c', display:'inline-block' }}></span>
                    <span style={{ color:'#c17f3c', fontWeight:700 }}>Cash {fc(cashIncome)} ({cashPct}%)</span>
                  </span>
                </div>
              </div>

              {/* Withdrawn vs Remaining bar (of cash) */}
              {cashIncome > 0 && (
                <div style={{ paddingTop:14, borderTop:'1px dashed #f0ebe4' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}>
                    <span>Withdrawn vs Remaining (of cash)</span>
                    <span style={{ fontWeight:700 }}>{fc(cashIncome)}</span>
                  </div>
                  <div style={{ height:20, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                    <div style={{ width:`${withdrawnPct}%`, background:'#c17f3c', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {withdrawnPct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{withdrawnPct}%</span>}
                    </div>
                    <div style={{ width:`${remainingPct}%`, background:'#2e7d32', transition:'width 0.6s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {remainingPct > 10 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{remainingPct}%</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:'#c17f3c', display:'inline-block' }}></span>
                      <span style={{ color:'#c17f3c', fontWeight:700 }}>Withdrawn {fc(totalWithdrawn)} ({withdrawnPct}%)</span>
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:'#2e7d32', display:'inline-block' }}></span>
                      <span style={{ color:'#2e7d32', fontWeight:700 }}>Remaining {fc(remaining)} ({remainingPct}%)</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per person */}
          <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.5, marginBottom:10 }}>PER PERSON</div>
          {PAYERS.map(person => {
            const color = PAYER_COLOR[person];
            const withdrawn = wByPerson[person] || 0;
            const personOnline = ownerOnline[person] || 0;
            const personCash   = wByPerson[person] || 0;
            const history = withdrawals.filter(w => w.person === person).sort((a,b) => b.date.localeCompare(a.date));
            const isExpanded = expanded === person;
            const isSaving = savingCash[person];

            return (
              <div key={person} style={{ background:color+'08', border:`2px solid ${color}30`, borderRadius:16, overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:color+'20', border:`2px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                      {PAYER_EMOJI[person]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#3d1a00' }}>{person}</div>
                      <div style={{ fontSize:11, color:'#b0a090', marginTop:1 }}>Withdrawn: <span style={{ fontWeight:700, color }}>{fc(withdrawn)}</span></div>
                    </div>
                    {history.length > 0 && (
                      <button onClick={() => setExpanded(isExpanded ? null : person)}
                        style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${color}40`, background:isExpanded?`${color}15`:'transparent', color, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                        {isExpanded ? '▲' : `▼ ${history.length}`}
                      </button>
                    )}
                  </div>

                  {/* Per person income row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
                    {[
                      { label:'Total', val:fc(personOnline + personCash) },
                      { label:'Online', val:fc(personOnline), color:'#1a237e' },
                      { label:'Cash recv.', val:fc(personCash), color:'#2e7d32' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#fff', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, marginBottom:2 }}>{s.label.toUpperCase()}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:s.color||'#3d1a00' }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Input row */}
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ display:'flex', alignItems:'center', background:'#fff', border:`1.5px solid ${color}40`, borderRadius:10, overflow:'hidden' }}>
                        <span style={{ color:'#c9a96e', fontSize:14, padding:'0 10px', fontWeight:700, borderRight:`1px solid ${color}20` }}>₹</span>
                        <input type="number" value={cashInputs[person]}
                          onChange={e => setCashInputs(p => ({ ...p, [person]:e.target.value }))}
                          placeholder="Amount..."
                          style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#3d1a00', fontSize:14, fontFamily:"'DM Sans',sans-serif", padding:'10px' }} />
                      </div>
                      <input type="text" value={cashNotes[person]}
                        onChange={e => setCashNotes(p => ({ ...p, [person]:e.target.value }))}
                        placeholder="Note (optional)"
                        style={{ background:'#fff', border:`1.5px solid ${color}30`, borderRadius:10, outline:'none', color:'#7a6a5a', fontSize:12, fontFamily:"'DM Sans',sans-serif", padding:'8px 12px' }} />
                    </div>
                    <button onClick={() => recordWithdrawal(person)} disabled={isSaving || !cashInputs[person]}
                      style={{ width:54, borderRadius:12, border:'none', flexShrink:0, background:isSaving||!cashInputs[person]?'#e0d5c8':`linear-gradient(135deg,${color},${color}cc)`, color:isSaving||!cashInputs[person]?'#b0a090':'#fff', fontSize:22, cursor:isSaving||!cashInputs[person]?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                      {isSaving ? '⏳' : '✓'}
                    </button>
                  </div>
                </div>

                {isExpanded && history.length > 0 && (
                  <div style={{ borderTop:`1px solid ${color}20`, background:`${color}05` }}>
                    <div style={{ padding:'8px 16px 4px', fontSize:10, fontWeight:700, color, letterSpacing:0.8 }}>HISTORY</div>
                    {history.map(w => (
                      <div key={w._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', borderBottom:`1px solid ${color}10` }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#3d2a1a' }}>
                            {fc(w.amount)}{w.note && <span style={{ color:'#b0a090', fontWeight:400 }}> · {w.note}</span>}
                          </div>
                          <div style={{ fontSize:10, color:'#b0a090', marginTop:1 }}>{w.date}</div>
                        </div>
                        <button onClick={() => deleteW(w._id)}
                          style={{ width:22, height:22, borderRadius:6, border:'1px solid #f0d0d0', background:'transparent', color:'#c0504d', cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          ×
                        </button>
                      </div>
                    ))}
                    <div style={{ padding:'8px 16px', display:'flex', justifyContent:'flex-end' }}>
                      <span style={{ fontSize:11, fontWeight:700, color }}>Total: {fc(withdrawn)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Section: Expenses ─────────────────────────────────────────────────────────
function ExpensesSection({ onBack }) {
  const [mode,        setMode]        = useState('alltime');
  const [month,       setMonth]       = useState(currentMonth());
  const [expenses,    setExpenses]    = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [fTitle,      setFTitle]      = useState('');
  const [fAmount,     setFAmount]     = useState('');
  const [fCategory,   setFCategory]   = useState('Colours');
  const [fNote,       setFNote]       = useState('');
  const [fDate,       setFDate]       = useState(todayIST);
  const [fPaidBy,     setFPaidBy]     = useState('JP');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await expensesAPI.getAll({});
        setAllExpenses(res.data.data);
        setExpenses(res.data.data);
      } catch { toast.error('Failed to load expenses'); }
      finally { setLoading(false); }
    })();
  }, []);

  const switchMode = async (m) => {
    setMode(m); setPage(1);
    if (m === 'alltime') { setExpenses(allExpenses); }
    else { try { const r = await expensesAPI.getAll({ month }); setExpenses(r.data.data); } catch {} }
  };

  const loadMonth = async (m) => {
    setMonth(m); setPage(1);
    try { const r = await expensesAPI.getAll({ month: m }); setExpenses(r.data.data); } catch {}
  };

  const displayExpenses = expenses;
  const totalPages = Math.ceil(displayExpenses.length / EXP_PER_PAGE);
  const pageSlice  = displayExpenses.slice((page-1)*EXP_PER_PAGE, page*EXP_PER_PAGE);
  const grandTotal = displayExpenses.reduce((s,e) => s+e.amount, 0);

  const byCategory = displayExpenses.reduce((acc, e) => { acc[e.category]=(acc[e.category]||0)+e.amount; return acc; }, {});
  const byPayer    = PAYERS.reduce((acc, p) => { acc[p]=displayExpenses.filter(e=>(e.paidBy||'JP')===p).reduce((s,e)=>s+e.amount,0); return acc; }, {});

  const resetForm = () => { setShowForm(false); setEditingId(null); setFTitle(''); setFAmount(''); setFCategory('Colours'); setFNote(''); setFDate(todayIST()); setFPaidBy('JP'); };
  const openEdit  = (exp) => { setFTitle(exp.title); setFAmount(String(exp.amount)); setFCategory(exp.category); setFNote(exp.note||''); setFDate(exp.date); setFPaidBy(exp.paidBy||'JP'); setEditingId(exp._id); setShowForm(true); };
  const openAdd   = () => { resetForm(); setShowForm(true); };

  const reloadAll = async () => {
    const [allR, monR] = await Promise.all([
      expensesAPI.getAll({}),
      mode==='month' ? expensesAPI.getAll({ month }) : Promise.resolve(null),
    ]);
    setAllExpenses(allR.data.data);
    setExpenses(mode==='month' ? monR.data.data : allR.data.data);
    setPage(1);
  };

  const saveExpense = async () => {
    if (!fTitle.trim()) return toast.error('Title required');
    if (!fAmount || isNaN(fAmount) || Number(fAmount)<=0) return toast.error('Valid amount required');
    setSaving(true);
    try {
      const p = { title:fTitle, amount:Number(fAmount), category:fCategory, note:fNote, date:fDate, paidBy:fPaidBy };
      if (editingId) { await expensesAPI.update(editingId, p); toast.success('✅ Updated!'); }
      else           { await expensesAPI.create(p); toast.success('✅ Added!'); }
      resetForm(); await reloadAll();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expensesAPI.delete(id); toast.success('Deleted'); await reloadAll(); }
    catch { toast.error('Failed'); }
  };

  const exportCSV = () => {
    if (!displayExpenses.length) return toast.error('No expenses');
    const rows = displayExpenses.map(e => [e.date,`"${e.title}"`,e.category,e.paidBy||'JP',e.amount,`"${e.note||''}"`]);
    const csv = [['Date','Title','Category','Paid By','Amount','Note'],...rows].map(r=>r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:`expenses-${mode==='month'?month:'all'}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success(`Exported ${displayExpenses.length} expenses`);
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'12px 12px 70px', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:18, border:'1.5px solid #e0d5c8', background:'#fff', cursor:'pointer', fontSize:18, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>
        <h2 style={{ margin:0, fontSize:20, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>💸 Expenses</h2>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #4caf50', background:'#f0fff0', color:'#2e7d32', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>📥</button>
          <button onClick={openAdd} style={{ padding:'7px 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>➕</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{key:'alltime',label:'All time'},{key:'month',label:'By month'}].map(m => (
          <button key={m.key} onClick={() => switchMode(m.key)} style={{ flex:1, padding:'10px', borderRadius:12, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s', background:mode===m.key?'#3d1a00':'#f0ebe4', color:mode===m.key?'#f5c842':'#7a6a5a' }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode==='month' && (
        <input type="month" value={month} max={currentMonth()} onChange={e => loadMonth(e.target.value)}
          style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1.5px solid #e0d5c8', fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', color:'#3d1a00', background:'#fff', cursor:'pointer', marginBottom:14 }} />
      )}

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60, fontSize:30, color:'#c9a96e' }}>⏳</div>
      ) : (
        <>
          <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:12 }}>
            {mode==='alltime'?'ALL TIME':fmtMonth(month).toUpperCase()} · {displayExpenses.length} records
          </div>

          {/* Total expense big card */}
          <div style={{ background:'#fff0f0', borderRadius:14, padding:'16px 18px', border:'1.5px solid #f5a0a0', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>TOTAL EXPENSE</div>
              <div style={{ fontSize:28, fontWeight:800, color:'#c0504d' }}>{fc(grandTotal)}</div>
            </div>
            <div style={{ fontSize:36 }}>💸</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            <div style={{ background:'#fff', borderRadius:12, padding:'12px', border:'1px solid #e8e0d5', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, marginBottom:4 }}>RECORDS</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#3d1a00' }}>{displayExpenses.length}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:12, padding:'12px', border:'1px solid #e8e0d5', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, marginBottom:4 }}>AVG PER RECORD</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#c0504d' }}>{displayExpenses.length>0?fc(Math.round(grandTotal/displayExpenses.length)):'₹0'}</div>
            </div>
          </div>

          {grandTotal > 0 && (
            <div style={{ background:'#fff', borderRadius:14, padding:'16px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.5, marginBottom:14 }}>EXPENSE BREAKDOWN</div>

              {/* By category */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}>
                  <span>By category</span><span style={{ fontWeight:700 }}>{fc(grandTotal)}</span>
                </div>
                <div style={{ height:20, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                  {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => {
                    const pct = Math.round((amt/grandTotal)*100);
                    const col = CAT_COLOR[cat]||'#607d8b';
                    return <div key={cat} style={{ width:`${pct}%`, background:col, display:'flex', alignItems:'center', justifyContent:'center', transition:'width 0.6s' }}>
                      {pct>10 && <span style={{ fontSize:9, fontWeight:700, color:'#fff' }}>{pct}%</span>}
                    </div>;
                  })}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                  {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => {
                    const pct=Math.round((amt/grandTotal)*100); const col=CAT_COLOR[cat]||'#607d8b';
                    return <span key={cat} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                      <span style={{ width:10,height:10,borderRadius:3,background:col,display:'inline-block',flexShrink:0 }}></span>
                      <span style={{ color:col,fontWeight:700 }}>{CAT_EMOJI[cat]||'📦'} {cat} {fc(amt)} ({pct}%)</span>
                    </span>;
                  })}
                </div>
              </div>

              {/* By payer */}
              {PAYERS.some(p=>byPayer[p]>0) && (
                <div style={{ paddingTop:14, borderTop:'1px dashed #f0ebe4' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7a6a5a', marginBottom:6 }}><span>By payer</span></div>
                  <div style={{ height:20, background:'#f0ebe4', borderRadius:10, overflow:'hidden', display:'flex' }}>
                    {PAYERS.filter(p=>byPayer[p]>0).map(p => {
                      const pct=Math.round((byPayer[p]/grandTotal)*100);
                      return <div key={p} style={{ width:`${pct}%`, background:PAYER_COLOR[p], display:'flex', alignItems:'center', justifyContent:'center', transition:'width 0.6s' }}>
                        {pct>10 && <span style={{ fontSize:9,fontWeight:700,color:'#fff' }}>{pct}%</span>}
                      </div>;
                    })}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                    {PAYERS.filter(p=>byPayer[p]>0).map(p => {
                      const pct=Math.round((byPayer[p]/grandTotal)*100);
                      return <span key={p} style={{ display:'flex',alignItems:'center',gap:4,fontSize:11 }}>
                        <span style={{ width:10,height:10,borderRadius:3,background:PAYER_COLOR[p],display:'inline-block',flexShrink:0 }}></span>
                        <span style={{ color:PAYER_COLOR[p],fontWeight:700 }}>{PAYER_EMOJI[p]} {p} {fc(byPayer[p])} ({pct}%)</span>
                      </span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {displayExpenses.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#b0a090' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>💸</div>
              <p style={{ margin:0 }}>No expenses{mode==='month'?` for ${fmtMonth(month)}`:''}</p>
              <button onClick={openAdd} style={{ marginTop:16, padding:'10px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>➕ Add first expense</button>
            </div>
          ) : (
            <>
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8e0d5', marginBottom:14, overflow:'hidden' }}>
                {pageSlice.map(exp => <ExpenseRow key={exp._id} expense={exp} onEdit={openEdit} onDelete={deleteExpense} />)}
              </div>
              {totalPages>1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:8 }}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #e0d5c8',background:'#fff',cursor:page===1?'not-allowed':'pointer',fontSize:14,color:'#7a6a5a',opacity:page===1?0.5:1 }}>‹</button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>setPage(n)} style={{ width:32,height:32,borderRadius:8,border:'none',background:n===page?'#3d1a00':'#f0ebe4',color:n===page?'#f5c842':'#7a6a5a',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>{n}</button>
                  ))}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ width:32,height:32,borderRadius:8,border:'1.5px solid #e0d5c8',background:'#fff',cursor:page===totalPages?'not-allowed':'pointer',fontSize:14,color:'#7a6a5a',opacity:page===totalPages?0.5:1 }}>›</button>
                </div>
              )}
              <div style={{ textAlign:'center', fontSize:12, color:'#b0a090' }}>
                Showing {(page-1)*EXP_PER_PAGE+1}–{Math.min(page*EXP_PER_PAGE,displayExpenses.length)} of {displayExpenses.length}
              </div>
            </>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={resetForm}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:1 }}>
              <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>{editingId ? '✏️ Edit Expense' : '➕ Add Expense'}</div>
              <button onClick={resetForm} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>TITLE *</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Colours purchase" style={inp} autoFocus />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>AMOUNT (₹) *</label>
                  <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0" style={inp} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>DATE *</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>CATEGORY *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {CATS.map(cat => (
                    <button key={cat} type="button" onClick={() => setFCategory(cat)} style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600, border:`2px solid ${fCategory===cat?CAT_COLOR[cat]:'#e0d5c8'}`, background:fCategory===cat?CAT_COLOR[cat]+'20':'transparent', color:fCategory===cat?CAT_COLOR[cat]:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      {CAT_EMOJI[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>PAID BY *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {PAYERS.map(p => (
                    <button key={p} type="button" onClick={() => setFPaidBy(p)} style={{ flex:1, padding:'8px 6px', borderRadius:12, fontSize:12, fontWeight:700, border:`2px solid ${fPaidBy===p?PAYER_COLOR[p]:'#e0d5c8'}`, background:fPaidBy===p?PAYER_COLOR[p]+'18':'transparent', color:fPaidBy===p?PAYER_COLOR[p]:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'center' }}>
                      <div style={{ fontSize:16 }}>{PAYER_EMOJI[p]}</div>
                      <div>{p}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>NOTE (optional)</label>
                <input value={fNote} onChange={e => setFNote(e.target.value)} placeholder="Any extra details..." style={inp} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={saveExpense} disabled={saving} style={{ flex:1, padding:'14px', borderRadius:12, border:'none', background:saving?'#888':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:15, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  {saving ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add Expense'}
                </button>
                <button onClick={resetForm} style={{ padding:'14px 20px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [section, setSection] = useState(null); // null | 'statements' | 'cash' | 'withdrawal'

  if (section === 'statements') return <StatementsSection onBack={() => setSection(null)} />;
  if (section === 'cash')       return <CashWithdrawalSection onBack={() => setSection(null)} />;
  if (section === 'expense')    return <ExpensesSection onBack={() => setSection(null)} />;

  const menuItems = [
    {
      key: 'statements',
      emoji: '💰',
      label: 'Statements',
      sub: 'Income, online, cash & net profit',
      color: '#2e7d32',
      bg: '#f0fff4',
      border: '#a5d6a7',
    },
    {
      key: 'cash',
      emoji: '🏧',
      label: 'Cash withdrawal',
      sub: 'Per person — total, online & cash',
      color: '#c17f3c',
      bg: '#fff8ef',
      border: '#f5c842',
    },
    {
      key: 'expense',
      emoji: '📤',
      label: 'Expenses',
      sub: 'All expenses with pagination',
      color: '#c0504d',
      bg: '#fff0f0',
      border: '#f5a0a0',
    },
  ];

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'20px 16px 70px', fontFamily:"'DM Sans',sans-serif" }}>
      <h2 style={{ margin:'0 0 6px', color:'#3d1a00', fontSize:22, fontFamily:"'Playfair Display',Georgia,serif" }}>📊 Dashboard</h2>
      <p style={{ margin:'0 0 24px', color:'#b0a090', fontSize:13 }}>Select a section to view details</p>

      {menuItems.map(item => (
        <div key={item.key} onClick={() => setSection(item.key)}
          style={{ background:item.bg, border:`1.5px solid ${item.border}`, borderRadius:18, padding:'20px 18px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:16, transition:'transform 0.1s, box-shadow 0.1s', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}
          onPointerDown={e => e.currentTarget.style.transform='scale(0.98)'}
          onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
          onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            {item.emoji}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#3d1a00', marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:12, color:'#7a6a5a' }}>{item.sub}</div>
          </div>
          <div style={{ fontSize:22, color:item.color, fontWeight:700 }}>›</div>
        </div>
      ))}
    </div>
  );
}