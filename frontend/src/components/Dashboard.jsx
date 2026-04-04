

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI, ordersAPI, settingsAPI, withdrawalsAPI } from '../services/api';

const fc = (n) => `₹${Number(n).toFixed(0)}`;
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATS      = ['Colours', 'Toppings', 'Baraf', 'Other'];
const CAT_EMOJI = { Colours:'🎨', Toppings:'🧁', Baraf:'🧊', Other:'📦' };
const CAT_COLOR = { Colours:'#e91e63', Toppings:'#ff9800', Baraf:'#2196f3', Other:'#607d8b' };
const PAYERS      = ['JP', 'Jenish', 'Urvish'];
const PAYER_EMOJI = { JP:'👦🏻', Jenish:'🧔🏻‍♂️', Urvish:'👨🏻' };
const PAYER_COLOR = { JP:'#7c3aed', Jenish:'#1d2bf7', Urvish:'#059669' };

const thisMonth = () => {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().slice(0, 7);
};
const todayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #e8e0d5',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  marginBottom: 14,
  overflow: 'hidden',
};
const cardHeader = {
  padding: '13px 18px',
  borderBottom: '1px solid #f0ebe4',
  fontSize: 13,
  fontWeight: 700,
  color: '#3d1a00',
  fontFamily: "'Playfair Display',Georgia,serif",
  background: '#fffbf5',
};
const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: '#b0a090',
  textTransform: 'uppercase',
};

export default function Dashboard() {
  const [month, setMonth]             = useState(thisMonth());
  const [summary, setSummary]         = useState(null);
  const [expenses, setExpenses]       = useState([]);
  const [allTimeOrders, setAllTime]   = useState([]);
  const [monthOrders, setMonthOrders] = useState([]);
  const [upiOwners, setUpiOwners]     = useState([]);
  const [withdrawals, setWithdrawals]         = useState([]);
  const [allTimeExpenses, setAllTimeExpenses] = useState(0);
  const [loading, setLoading]                 = useState(true);

  // Inline cash input per person — add & subtract
  const [cashInputs, setCashInputs]   = useState({ JP:'', Jenish:'', Urvish:'' });
  const [savingCash, setSavingCash]   = useState({ JP:false, Jenish:false, Urvish:false });

  // Expense form state
  const [showExpForm,  setShowExpForm]  = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [fTitle,    setFTitle]    = useState('');
  const [fAmount,   setFAmount]   = useState('');
  const [fCategory, setFCategory] = useState('Colours');
  const [fNote,     setFNote]     = useState('');
  const [fDate,     setFDate]     = useState(todayIST);
  const [fPaidBy,   setFPaidBy]   = useState('JP');
  const [savingExp, setSavingExp] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, eRes, moRes, allRes, setRes, wRes, allExpRes] = await Promise.all([
        expensesAPI.getSummary(month),
        expensesAPI.getAll({ month }),
        ordersAPI.getAll({ month, limit: 5000 }),
        ordersAPI.getAll({ limit: 5000, from:'2000-01-01', to:'2099-12-31' }),
        settingsAPI.getPublic(),
        withdrawalsAPI.getAll({ month }),
        expensesAPI.getAll({}), // all-time — no month filter → returns everything
      ]);
      setSummary(sRes.data.data);
      setExpenses(eRes.data.data);
      setMonthOrders(moRes.data.data);
      setAllTime(allRes.data.data);
      setUpiOwners(setRes.data.data?.upiOwners || []);
      setWithdrawals(wRes.data.data);
      // Sum all expenses across all time
      const allExpList = allExpRes.data.data || [];
      setAllTimeExpenses(allExpList.reduce((s, e) => s + e.amount, 0));
    } catch { toast.error('Failed to load dashboard'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [month]);

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };
  const [yr, mo] = month.split('-').map(Number);
  const monthLabel = `${MONTHS[mo-1]} ${yr}`;

  // ── Computed ──────────────────────────────────────────────────────────────
  const allActive       = allTimeOrders.filter(o => o.status !== 'cancelled');
  const allTotalIncome  = allActive.reduce((s,o) => s+o.total, 0);
  const allCashIncome   = allActive.filter(o => !o.paymentMethod || o.paymentMethod==='cash').reduce((s,o) => s+o.total, 0);
  const allOnlineIncome = allActive.filter(o => o.paymentMethod==='online').reduce((s,o) => s+o.total, 0);

  const monthActive       = monthOrders.filter(o => o.status !== 'cancelled');
  const monthCashOrders   = monthActive.filter(o => !o.paymentMethod || o.paymentMethod==='cash');
  const monthOnlineOrders = monthActive.filter(o => o.paymentMethod==='online');
  const monthCashIncome   = monthCashOrders.reduce((s,o) => s+o.total, 0);
  const monthOnlineIncome = monthOnlineOrders.reduce((s,o) => s+o.total, 0);
  const monthTotalIncome  = monthCashIncome + monthOnlineIncome;
  const monthExpenses     = summary?.totalExpenses || 0;
  const monthProfit       = monthTotalIncome - monthExpenses;
  const monthProfitPct    = monthTotalIncome > 0 ? Math.round((monthProfit/monthTotalIncome)*100) : 0;

  // Per-UPI-owner online income (month)
  const ownerOnline = upiOwners.reduce((acc, owner) => {
    acc[owner.key] = monthOnlineOrders.filter(o=>o.upiOwner===owner.key).reduce((s,o)=>s+o.total, 0);
    return acc;
  }, {});

  // Cash withdrawals per person (month) — manually entered
  const wByPerson = withdrawals.reduce((acc, w) => {
    acc[w.person] = (acc[w.person]||0) + w.amount;
    return acc;
  }, {});
  const totalWithdrawn = Object.values(wByPerson).reduce((s,v)=>s+v, 0);

  // Per person income = their UPI + their manually entered cash
  const perPersonIncome = PAYERS.reduce((acc, p) => {
    const upiAmt  = ownerOnline[p] || 0;
    const cashAmt = wByPerson[p]   || 0;
    acc[p] = { upi: upiAmt, cash: cashAmt, total: upiAmt + cashAmt };
    return acc;
  }, {});

  // Overall (all-time income vs all-time expenses)
  const overallExpenses = allTimeExpenses;
  const overallProfit   = allTotalIncome - overallExpenses;
  const overallPct      = allTotalIncome > 0 ? Math.round((overallProfit/allTotalIncome)*100) : 0;

  // ── Cash add/subtract ─────────────────────────────────────────────────────
  const recordCash = async (person, type) => {
    const amt = Number(cashInputs[person]);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (type === 'add' && (totalWithdrawn + amt) > monthCashIncome) {
      return toast.error(`❌ Total withdrawals would exceed cash income (${fc(monthCashIncome)})`);
    }
    setSavingCash(p => ({ ...p, [person]: true }));
    try {
      // For subtract: store as negative withdrawal (or a separate approach — store with negative amount)
      await withdrawalsAPI.create({
        person,
        amount: type === 'add' ? amt : -amt,
        note: type === 'add' ? 'cash received' : 'cash returned',
        date: todayIST(),
      });
      setCashInputs(p => ({ ...p, [person]: '' }));
      toast.success(type === 'add' ? `✅ ${person} +${fc(amt)} recorded` : `✅ ${person} -${fc(amt)} recorded`);
      load();
    } catch { toast.error('Failed'); }
    finally { setSavingCash(p => ({ ...p, [person]: false })); }
  };

  // ── Expense helpers ───────────────────────────────────────────────────────
  const resetExpForm = () => {
    setFTitle(''); setFAmount(''); setFCategory('Colours'); setFNote('');
    setFDate(todayIST()); setFPaidBy('JP'); setEditingExpId(null); setShowExpForm(false);
  };
  const openEditExp = (exp) => {
    setFTitle(exp.title); setFAmount(String(exp.amount)); setFCategory(exp.category);
    setFNote(exp.note||''); setFDate(exp.date); setFPaidBy(exp.paidBy||'JP');
    setEditingExpId(exp._id); setShowExpForm(true);
    setTimeout(()=>document.getElementById('exp-title-input')?.focus(),100);
  };
  const openAddExp = () => {
    resetExpForm(); setShowExpForm(true);
    setTimeout(()=>document.getElementById('exp-title-input')?.focus(),100);
  };
  const saveExpense = async () => {
    if (!fTitle.trim()) return toast.error('Title is required');
    if (!fAmount || isNaN(fAmount) || Number(fAmount)<=0) return toast.error('Enter a valid amount');
    setSavingExp(true);
    try {
      const payload = { title:fTitle, amount:Number(fAmount), category:fCategory, note:fNote, date:fDate, paidBy:fPaidBy };
      if (editingExpId) { await expensesAPI.update(editingExpId, payload); toast.success('✅ Updated!'); }
      else              { await expensesAPI.create(payload); toast.success('✅ Added!'); }
      resetExpForm(); load();
    } catch { toast.error('Failed to save'); }
    finally { setSavingExp(false); }
  };
  const deleteExpense = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await expensesAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const inp = {
    width:'100%', padding:'10px 14px', borderRadius:10,
    border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00', background:'#fff',
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <h2 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>📊 Dashboard</h2>
      </div>

      {loading ? <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:36 }}>⏳</div> : (<>

        {/* ══════════════════════════════════════════
            1. OVERALL TOTALS (all time)
        ══════════════════════════════════════════ */}
        <div style={card}>
          <div style={cardHeader}>🏆 Overall Totals</div>
          <div style={{ padding:'16px 18px' }}>

            {/* Row 1 — 3 columns with dividers */}
            <div className="ot-row" style={{ display:'flex', marginBottom:14 }}>
              <div className="ot-cell" style={{ flex:1, minWidth:0 }}>
                <div style={sectionLabel}>TOTAL INCOME</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#3d1a00', marginTop:5 }}>{fc(allTotalIncome)}</div>
              </div>
              <div className="ot-divider" style={{ width:1, background:'#f0ebe4', margin:'0 20px', flexShrink:0 }}/>
              <div className="ot-cell" style={{ flex:1, minWidth:0 }}>
                <div style={sectionLabel}>CASH</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#2e7d32', marginTop:5 }}>{fc(allCashIncome)}</div>
              </div>
              <div className="ot-divider" style={{ width:1, background:'#f0ebe4', margin:'0 20px', flexShrink:0 }}/>
              <div className="ot-cell" style={{ flex:1, minWidth:0 }}>
                <div style={sectionLabel}>ONLINE / UPI</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#1a237e', marginTop:5 }}>{fc(allOnlineIncome)}</div>
              </div>
            </div>

            <div style={{ height:1, background:'#f0ebe4', marginBottom:14 }}/>

            {/* Row 2 — 2 columns with divider */}
            <div className="ot-row" style={{ display:'flex', marginBottom:14 }}>
              <div className="ot-cell" style={{ flex:1, minWidth:0 }}>
                <div style={sectionLabel}>TOTAL EXPENSE</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#c0504d', marginTop:5 }}>{fc(overallExpenses)}</div>
              </div>
              <div className="ot-divider" style={{ width:1, background:'#f0ebe4', margin:'0 20px', flexShrink:0 }}/>
              <div className="ot-cell" style={{ flex:1, minWidth:0 }}>
                <div style={sectionLabel}>PROFIT</div>
                <div style={{ fontSize:20, fontWeight:800, color: overallProfit>=0?'#2e7d32':'#c0504d', marginTop:5 }}>{fc(overallProfit)}</div>
              </div>
            </div>

            {/* Margin bar */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={sectionLabel}>PROFIT MARGIN</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#c17f3c' }}>{overallPct}%</span>
            </div>
            <div style={{ height:7, background:'#f0ebe4', borderRadius:8, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:8, background: overallProfit>=0?'linear-gradient(90deg,#c17f3c,#e8a045)':'#c0504d', width:`${Math.min(100,Math.max(0,overallPct))}%`, transition:'width 0.5s' }}/>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            2. INCOME PER PERSON
        ══════════════════════════════════════════ */}
        <div style={card}>
          <div style={cardHeader}>👥 Income Per Person</div>
          <div style={{ padding:'14px 18px', display:'flex', gap:10, flexWrap:'wrap' }}>
            {PAYERS.map((p) => {
              const color = PAYER_COLOR[p];
              return (
                <div key={p} style={{ flex:'1 1 100px', background:`${color}10`, border:`1.5px solid ${color}80`, borderRadius:14, padding:'14px 16px', minWidth:100, textAlign:'center' }}>
                  <div style={{ fontSize:26, marginBottom:6 }}>{PAYER_EMOJI[p]}</div>
                  <div style={{ fontSize:13, fontWeight:800, color, marginBottom:10 }}>{p}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, color:'#b0a090' }}>UPI</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#1a237e' }}>{fc(perPersonIncome[p].upi)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, color:'#b0a090' }}>Cash</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#2e7d32' }}>{fc(perPersonIncome[p].cash)}</span>
                    </div>
                    <div style={{ height:1, background:`${color}80`, margin:'3px 0' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:'#7a6a5a', fontWeight:600 }}>Total</span>
                      <span style={{ fontSize:13, fontWeight:800, color }}>{fc(perPersonIncome[p].total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            3. INCOME BY UPI OWNER
        ══════════════════════════════════════════ */}
        {upiOwners.filter(o=>o.upiId).length > 0 && (
          <div style={card}>
            <div style={cardHeader}>📱 Online — by UPI Owner</div>
            <div style={{ padding:'14px 18px', display:'flex', gap:10, flexWrap:'wrap' }}>
              {upiOwners.filter(o=>o.upiId).map((owner) => {
                const color = PAYER_COLOR[owner.key] || '#7c3aed';
                const amt   = ownerOnline[owner.key] || 0;
                const pct   = monthOnlineIncome > 0 ? Math.round((amt/monthOnlineIncome)*100) : 0;
                return (
                  <div key={owner.key} style={{ flex:'1 1 100px', background:`${color}10`, border:`1.5px solid ${color}80`, borderRadius:14, padding:'14px 16px', minWidth:100, textAlign:'center' }}>
                    <div style={{ fontSize:26, marginBottom:4 }}>{owner.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:800, color, marginBottom:6 }}>{owner.name}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#1a237e' }}>{fc(amt)}</div>
                    <div style={{ fontSize:11, color:'#9fa8da', marginTop:3 }}>
                      {monthOnlineOrders.filter(o=>o.upiOwner===owner.key).length} orders
                    </div>
                    {monthOnlineIncome > 0 && (
                      <>
                        <div style={{ height:4, background:`${color}20`, borderRadius:4, margin:'8px 0 4px' }}>
                          <div style={{ height:'100%', background:color, borderRadius:4, width:`${pct}%`, transition:'width 0.5s' }}/>
                        </div>
                        <div style={{ fontSize:10, color, fontWeight:700 }}>{pct}%</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            3b. EXPENSES PAID BY
        ══════════════════════════════════════════ */}
        {summary?.byPaidBy && (
          <div style={card}>
            <div style={cardHeader}>💳 Expenses Paid By</div>
            <div style={{ padding:'14px 18px', display:'flex', gap:10, flexWrap:'wrap' }}>
              {PAYERS.map((p) => {
                const color = PAYER_COLOR[p];
                const amt   = summary.byPaidBy[p] || 0;
                return (
                  <div key={p} style={{ flex:'1 1 100px', background:`${color}10`, border:`1.5px solid ${color}80`, borderRadius:14, padding:'14px 16px', minWidth:100, textAlign:'center' }}>
                    <div style={{ fontSize:26, marginBottom:6 }}>{PAYER_EMOJI[p]}</div>
                    <div style={{ fontSize:12, fontWeight:800, color, marginBottom:8 }}>{p}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#c0504d' }}>{fc(amt)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            4. INCOME BY CASH — manual + / −
        ══════════════════════════════════════════ */}
        <div style={card}>
          <div style={cardHeader}>💵 Income by Cash — add manually</div>
          <div style={{ padding:'8px 18px 6px', fontSize:11, color:'#b0a090' }}>
            Cash box this month: <strong style={{ color:'#c17f3c' }}>{fc(monthCashIncome)}</strong> total · <strong style={{ color: (monthCashIncome-totalWithdrawn)>=0?'#2e7d32':'#c0504d' }}>{fc(monthCashIncome-totalWithdrawn)}</strong> remaining
          </div>
          <div style={{ padding:'10px 18px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            {PAYERS.map((p) => {
              const color    = PAYER_COLOR[p];
              const wAmt     = wByPerson[p] || 0;
              const isSaving = savingCash[p];
              const myW      = withdrawals.filter(w => w.person===p);
              return (
                <div key={p} style={{ width:'100%', background:`${color}10`, border:`1.5px solid ${color}80`, borderRadius:14, padding:'14px 14px' }}>
                  <div style={{ flex:1 }}>
                    {/* Name + total */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:16 }}>{PAYER_EMOJI[p]}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#3d1a00' }}>{p}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color }}>{fc(wAmt)}</span>
                    </div>

                    {/* Input field */}
                    <div style={{ display:'flex', alignItems:'center', background:'#faf8f5', border:'1.5px solid #e8e0d5', borderRadius:10, overflow:'hidden', marginBottom:6 }}>
                      <span style={{ color:'#c9a96e', fontSize:14, padding:'0 8px', fontWeight:600 }}>₹</span>
                      <input
                        type="number"
                        value={cashInputs[p]}
                        onChange={e => setCashInputs(prev => ({ ...prev, [p]: e.target.value }))}
                        placeholder="0"
                        style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#3d1a00', fontSize:14, fontFamily:"'DM Sans',sans-serif", padding:'8px 0' }}
                      />
                    </div>

                    {/* + and − buttons */}
                    <div style={{ display:'flex', gap:6 }}>
                      <button
                        onClick={() => recordCash(p, 'add')}
                        disabled={isSaving}
                        style={{ flex:1, padding:'8px 0', borderRadius:8, background: isSaving?'#ccc':`#05966928`, color, fontWeight:800, fontSize:15, cursor:isSaving?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${color}40` }}
                      >＋</button>
                      <button
                        onClick={() => recordCash(p, 'subtract')}
                        disabled={isSaving}
                        style={{ flex:1, padding:'8px 0', borderRadius:8, background: isSaving?'#ccc':'#fff0f0', color:'#c0504d', fontWeight:800, fontSize:15, cursor:isSaving?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", border:'1.5px solid #f0c0c0' }}
                      >－</button>
                    </div>

                    {/* History */}
                    {myW.length > 0 && (
                      <div style={{ marginTop:8 }}>
                        {myW.map(w => (
                          <div key={w._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderTop:'1px solid #f5efe8' }}>
                            <span style={{ fontSize:10, color:'#c9a96e' }}>{w.date}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <span style={{ fontSize:11, fontWeight:700, color: w.amount>=0?'#2e7d32':'#c0504d' }}>
                                {w.amount>=0?'+':''}{fc(w.amount)}
                              </span>
                              <button
                                onClick={async () => { if(!window.confirm('Delete?')) return; await withdrawalsAPI.delete(w._id); toast.success('Deleted'); load(); }}
                                style={{ width:16, height:16, borderRadius:4, border:'none', background:'transparent', color:'#c9a96e', cursor:'pointer', fontSize:13, padding:0, lineHeight:1 }}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            5. MONTHLY VIEW
        ══════════════════════════════════════════ */}
        <div style={card}>
          <div style={{ padding:'13px 13px', borderBottom:'1px solid #f0ebe4', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fffbf5' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>📅 Monthly View</span>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:10, padding:'4px 10px', border:'1px solid #e8e0d5' }}>
              <button onClick={() => changeMonth(-1)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#c17f3c', padding:'0 2px' }}>‹</button>
              <span style={{ fontWeight:700, color:'#3d1a00', fontSize:13, minWidth:72, textAlign:'center' }}>{monthLabel}</span>
              <button onClick={() => changeMonth(1)}  style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#c17f3c', padding:'0 2px' }}>›</button>
            </div>
          </div>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', gap:0, marginBottom:16 }}>
              <div style={{ flex:1 }}>
                <div style={sectionLabel}>Income</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#3d1a00', marginTop:4 }}>{fc(monthTotalIncome)}</div>
              </div>
              <div style={{ width:1, background:'#f0ebe4', margin:'0 14px' }}/>
              <div style={{ flex:1 }}>
                <div style={sectionLabel}>Expense</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#c0504d', marginTop:4 }}>{fc(monthExpenses)}</div>
              </div>
              <div style={{ width:1, background:'#f0ebe4', margin:'0 14px' }}/>
              <div style={{ flex:1 }}>
                <div style={sectionLabel}>Profit</div>
                <div style={{ fontSize:20, fontWeight:800, color: monthProfit>=0?'#2e7d32':'#c0504d', marginTop:4 }}>{fc(monthProfit)}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={sectionLabel}>Monthly profit margin</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#c17f3c' }}>{monthProfitPct}%</span>
            </div>
            <div style={{ height:7, background:'#f0ebe4', borderRadius:8, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:8, background: monthProfit>=0?'linear-gradient(90deg,#c17f3c,#e8a045)':'#c0504d', width:`${Math.min(100,Math.max(0,monthProfitPct))}%`, transition:'width 0.5s' }}/>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            6. EXPENSES LIST
        ══════════════════════════════════════════ */}
        <div style={{ ...card, marginBottom:80 }}>
          <div style={{ padding:'13px 18px', borderBottom:'1px solid #f0ebe4', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fffbf5' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>💸 Expenses — {monthLabel}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => {
                if (!expenses.length) return toast.error('No expenses to export');
                const headers = ['Date','Title','Category','Paid By','Amount (₹)','Note'];
                const rows = expenses.map(e => [
                  e.date,
                  `"${e.title.replace(/"/g,'""')}"`,
                  e.category,
                  e.paidBy || 'JP',
                  e.amount,
                  `"${(e.note||'').replace(/"/g,'""')}"`,
                ]);
                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type:'text/csv' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = `expenses-${month}.csv`; a.click();
                URL.revokeObjectURL(url);
                toast.success(`✅ Exported ${expenses.length} expenses`);
              }} style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #4caf50', background:'#f0fff0', color:'#2e7d32', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                📥
              </button>
              <button onClick={openAddExp} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #6f3cc1', background:'#5934ec12', color:'#c17f3c', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                ➕ 
              </button>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px', color:'#b0a090' }}>
              <div style={{ fontSize:32 }}>💸</div>
              <p style={{ fontSize:13, margin:'8px 0 0' }}>No expenses for {monthLabel}</p>
            </div>
          ) : (<>
            {expenses.map(exp => (
              <div key={exp._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderBottom:'1px solid #f5efe8' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:CAT_COLOR[exp.category]||'#ccc', flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#3d1a00' }}>{exp.title}</div>
                  <div style={{ fontSize:11, color:'#b0a090', marginTop:2 }}>
                    {exp.category} · {exp.paidBy} · {exp.date}
                  </div>
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:'#c0504d', flexShrink:0 }}>{fc(exp.amount)}</span>
                <button onClick={() => openEditExp(exp)} style={{ background:'transparent', border:'1.5px solid #c9a96e', borderRadius:8, color:'#c9a96e', cursor:'pointer', fontSize:12, padding:6 }}>✏️</button>
                <button onClick={() => deleteExpense(exp._id)} style={{ background:'transparent', border:'1.5px solid #c9a96e', borderRadius:8, color:'#c9a96e', cursor:'pointer', fontSize:12, padding:8, lineHeight:1 }}>❌</button>
              </div>
            ))}
            <div style={{ padding:'11px 18px', display:'flex', justifyContent:'flex-end' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#c0504d' }}>Total: {fc(monthExpenses)}</span>
            </div>
          </>)}
        </div>

      </>)}

      {/* ══ EXPENSE MODAL ══ */}
      {showExpForm && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={resetExpForm}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0 }}>
              <div style={{ color:'#f5c842', fontWeight:700, fontSize:15, fontFamily:"'Playfair Display',Georgia,serif" }}>{editingExpId?'✏️ Edit Expense':'➕ Add Expense'}</div>
              <button onClick={resetExpForm} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>TITLE *</label>
                <input id="exp-title-input" value={fTitle} onChange={e=>setFTitle(e.target.value)} placeholder="e.g. Colours purchase" style={inp}/>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>AMOUNT (₹) *</label>
                  <input type="number" value={fAmount} onChange={e=>setFAmount(e.target.value)} placeholder="0" style={inp}/>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>DATE *</label>
                  <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={inp}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>CATEGORY *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {CATS.map(cat=>(
                    <button key={cat} type="button" onClick={()=>setFCategory(cat)} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:`1.5px solid ${fCategory===cat?CAT_COLOR[cat]:'#e0d5c8'}`, background:fCategory===cat?CAT_COLOR[cat]+'20':'transparent', color:fCategory===cat?CAT_COLOR[cat]:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      {CAT_EMOJI[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>PAID BY *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {PAYERS.map(p=>(
                    <button key={p} type="button" onClick={()=>setFPaidBy(p)} style={{ flex:1, padding:'10px 6px', borderRadius:12, fontSize:12, fontWeight:700, border:`1.5px solid ${fPaidBy===p?PAYER_COLOR[p]:'#e0d5c8'}`, background:fPaidBy===p?PAYER_COLOR[p]+'18':'transparent', color:fPaidBy===p?PAYER_COLOR[p]:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'center' }}>
                      <div style={{ fontSize:18 }}>{PAYER_EMOJI[p]}</div>
                      <div style={{ marginTop:3 }}>{p}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>NOTE</label>
                <input value={fNote} onChange={e=>setFNote(e.target.value)} placeholder="Optional..." style={inp}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={saveExpense} disabled={savingExp} style={{ flex:1, padding:'13px', borderRadius:12, border:'none', background:savingExp?'#aaa':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:14, fontWeight:700, cursor:savingExp?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(193,127,60,0.4)' }}>
                  {savingExp?'⏳ Saving...':editingExpId?'💾 Update':'➕ Add expense'}
                </button>
                <button onClick={resetExpForm} style={{ padding:'13px 20px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 500px) {
          .ot-row { flex-direction: column !important; gap: 12px; }
          .ot-divider { display: none !important; }
          .ot-cell { padding-bottom: 4px; }
        }
      `}</style>
    </div>
  );
}