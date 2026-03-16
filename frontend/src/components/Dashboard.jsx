import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI } from '../services/api';

const fc = (n) => `₹${Number(n).toFixed(0)}`;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATS     = ['Colours', 'Toppings', 'Baraf', 'Other'];
const CAT_EMOJI = { Colours:'🎨', Toppings:'🧁', Baraf:'🧊', Other:'📦' };
const CAT_COLOR = { Colours:'#e91e63', Toppings:'#ff9800', Baraf:'#2196f3', Other:'#607d8b' };

const PAYERS = ['JP', 'Jenish', 'Urvish'];
const PAYER_EMOJI = { JP:'👦🏻', Jenish:'🧔🏻‍♂️', Urvish:'👨🏻' };
const PAYER_COLOR = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669' };

const thisMonth = () => new Date().toISOString().slice(0, 7);

// ── Sub-components defined OUTSIDE to prevent focus loss ─────────────────────
function StatCard({ emoji, label, value, color, sub }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', flex:1, minWidth:140 }}>
      <div style={{ fontSize:28, marginBottom:6 }}>{emoji}</div>
      <div style={{ fontSize:11, color:'#b0a090', fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#b0a090', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ExpenseRow({ expense, onEdit, onDelete }) {
  const payer = expense.paidBy || 'Me';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 8px', borderBottom:'1px solid #f5efe8' }}>
      <div style={{ width:36, height:36, borderRadius:10, background: CAT_COLOR[expense.category] + '20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
        {CAT_EMOJI[expense.category]}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{expense.title}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, background: CAT_COLOR[expense.category] + '20', color: CAT_COLOR[expense.category], padding:'1px 7px', borderRadius:10, fontWeight:700 }}>{expense.category}</span>
          {/* Paid By badge */}
          <span style={{ fontSize:10, background: PAYER_COLOR[payer] + '18', color: PAYER_COLOR[payer], padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
            {PAYER_EMOJI[payer]} {payer}
          </span>
          <span style={{ fontSize:11, color:'#b0a090' }}>{expense.date}</span>
          {expense.note && <span style={{ fontSize:11, color:'#c9a96e' }}>· {expense.note}</span>}
        </div>
      </div>
      <div style={{ fontWeight:800, color:'#c0504d', fontSize:14, flexShrink:0 }}>-{fc(expense.amount)}</div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(expense)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #e0d5c8', background:'#fff8ef', cursor:'pointer', fontSize:13, color:'#c17f3c' }}>✏️</button>
        <button onClick={() => onDelete(expense._id)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #f0d0d0', background:'transparent', cursor:'pointer', fontSize:13, color:'#c0504d' }}>×</button>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [month, setMonth]           = useState(thisMonth());
  const [summary, setSummary]       = useState(null);
  const [expenses, setExpenses]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);

  // Paid By filter — null means "All"
  const [filterPayer, setFilterPayer] = useState(null);

  // Form fields
  const [fTitle,    setFTitle]    = useState('');
  const [fAmount,   setFAmount]   = useState('');
  const [fCategory, setFCategory] = useState('Colours');
  const [fNote,     setFNote]     = useState('');
  const [fDate,     setFDate]     = useState(() => new Date().toISOString().split('T')[0]);
  const [fPaidBy,   setFPaidBy]   = useState('Me');
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, eRes] = await Promise.all([
        expensesAPI.getSummary(month),
        expensesAPI.getAll({ month }),
      ]);
      setSummary(sRes.data.data);
      setExpenses(eRes.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const resetForm = () => {
    setFTitle(''); setFAmount(''); setFCategory('Colours');
    setFNote(''); setFDate(new Date().toISOString().split('T')[0]);
    setFPaidBy('Me'); setEditingId(null); setShowForm(false);
  };

  const openEdit = (exp) => {
    setFTitle(exp.title); setFAmount(String(exp.amount));
    setFCategory(exp.category); setFNote(exp.note || '');
    setFDate(exp.date); setFPaidBy(exp.paidBy || 'Me');
    setEditingId(exp._id);
    setShowForm(true);
    setTimeout(() => document.getElementById('expense-title-input')?.focus(), 100);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
    setTimeout(() => document.getElementById('expense-title-input')?.focus(), 100);
  };

  const saveExpense = async () => {
    if (!fTitle.trim()) return toast.error('Title is required');
    if (!fAmount || isNaN(fAmount) || Number(fAmount) <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      const payload = { title:fTitle, amount:Number(fAmount), category:fCategory, note:fNote, date:fDate, paidBy:fPaidBy };
      if (editingId) {
        await expensesAPI.update(editingId, payload);
        toast.success('✅ Expense updated!');
      } else {
        await expensesAPI.create(payload);
        toast.success('✅ Expense added!');
      }
      resetForm();
      load();
    } catch {
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const exportCSV = () => {
    if (!expenses.length) return toast.error('No expenses to export');
    const headers = ['Date', 'Title', 'Category', 'Paid By', 'Amount (₹)', 'Note'];
    const rows = filteredExpenses.map(e => [
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.paidBy || 'Me',
      e.amount,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `expenses-${month}${filterPayer ? `-${filterPayer}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`✅ Exported ${filteredExpenses.length} expenses`);
  };

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const [y, m] = month.split('-').map(Number);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;

  // ── Client-side filter by payer ──────────────────────────────────────────
  const filteredExpenses = filterPayer
    ? expenses.filter(e => (e.paidBy || 'Me') === filterPayer)
    : expenses;

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Per-payer totals for the summary chips
  const payerTotals = PAYERS.reduce((acc, p) => {
    acc[p] = expenses.filter(e => (e.paidBy || 'Me') === p).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:10,
    border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00',
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <h2 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>
          📊 Dashboard
        </h2>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:12, padding:'6px 12px', border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <button onClick={() => changeMonth(-1)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#c17f3c', padding:'0 4px' }}>‹</button>
          <span style={{ fontWeight:700, color:'#3d1a00', fontSize:14, minWidth:90, textAlign:'center' }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#c17f3c', padding:'0 4px' }}>›</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:36 }}>⏳</div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
            <StatCard emoji="💰" label="TOTAL INCOME"   value={fc(summary?.totalIncome   || 0)} color="#2e7d32" sub={`${summary?.totalOrders || 0} orders`} />
            <StatCard emoji="💸" label="TOTAL EXPENSES" value={fc(summary?.totalExpenses || 0)} color="#c0504d" sub={`${expenses.length} entries`} />
            <StatCard emoji="📈" label="NET PROFIT"     value={fc(summary?.totalProfit   || 0)} color={(summary?.totalProfit || 0) >= 0 ? '#c17f3c' : '#c0504d'} sub={(summary?.totalProfit || 0) >= 0 ? '🟢 Profitable' : '🔴 Loss'} />
          </div>

          {/* ── Paid By Summary Cards ── */}
          <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
            <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:'#7a6a5a', letterSpacing:1 }}>💳 PAID BY</h3>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {PAYERS.map(p => (
                <button key={p} onClick={() => setFilterPayer(filterPayer === p ? null : p)} style={{
                  flex:1, minWidth:90, padding:'10px 12px', borderRadius:14,
                  border:`2px solid ${filterPayer === p ? PAYER_COLOR[p] : '#e8e0d5'}`,
                  background: filterPayer === p ? PAYER_COLOR[p] + '15' : '#faf8f5',
                  cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                }}>
                  <div style={{ fontSize:20, marginBottom:2 }}>{PAYER_EMOJI[p]}</div>
                  <div style={{ fontSize:12, fontWeight:700, color: filterPayer === p ? PAYER_COLOR[p] : '#3d1a00' }}>{p}</div>
                  <div style={{ fontSize:13, fontWeight:800, color: PAYER_COLOR[p], marginTop:2 }}>{fc(payerTotals[p])}</div>
                  {filterPayer === p && <div style={{ fontSize:10, color: PAYER_COLOR[p], marginTop:2, fontWeight:600 }}>● Filtering</div>}
                </button>
              ))}
            </div>
            {filterPayer && (
              <button onClick={() => setFilterPayer(null)} style={{
                marginTop:10, width:'100%', padding:'7px', borderRadius:10,
                border:'1.5px dashed #e0d5c8', background:'transparent',
                color:'#b0a090', fontSize:12, cursor:'pointer', fontWeight:600,
              }}>
                ✕ Clear filter — show all
              </button>
            )}
          </div>

          {/* ── Profit Bar ── */}
          {summary && summary.totalIncome > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#7a6a5a' }}>PROFIT MARGIN</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#c17f3c' }}>
                  {summary.totalIncome > 0 ? Math.round((summary.totalProfit / summary.totalIncome) * 100) : 0}%
                </span>
              </div>
              <div style={{ height:10, background:'#f0ebe4', borderRadius:10, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:10, transition:'width 0.5s',
                  background: summary.totalProfit >= 0 ? 'linear-gradient(90deg,#c17f3c,#e8a045)' : '#c0504d',
                  width: `${Math.min(100, Math.max(0, summary.totalIncome > 0 ? (summary.totalProfit / summary.totalIncome) * 100 : 0))}%`,
                }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'#b0a090' }}>
                <span>Income: {fc(summary.totalIncome)}</span>
                <span>Expenses: {fc(summary.totalExpenses)}</span>
              </div>
            </div>
          )}

          {/* ── Expense by Category ── */}
          {summary && Object.keys(summary.byCategory || {}).length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
              <h3 style={{ margin:'0 0 14px', fontSize:13, fontWeight:700, color:'#7a6a5a', letterSpacing:1 }}>EXPENSES BY CATEGORY</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {Object.entries(summary.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => {
                  const pct = Math.round((amt / summary.totalExpenses) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                        <span>{CAT_EMOJI[cat]} {cat}</span>
                        <span style={{ fontWeight:700, color:'#c0504d' }}>{fc(amt)} <span style={{ color:'#b0a090', fontWeight:400 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height:6, background:'#f0ebe4', borderRadius:6 }}>
                        <div style={{ height:'100%', borderRadius:6, background: CAT_COLOR[cat], width:`${pct}%`, transition:'width 0.5s' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Expenses List ── */}
          <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', marginBottom:80 }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#3d1a00' }}>
                💸 Expenses — {monthLabel}
                {filterPayer && (
                  <span style={{ marginLeft:8, fontSize:12, background: PAYER_COLOR[filterPayer] + '18', color: PAYER_COLOR[filterPayer], padding:'2px 8px', borderRadius:10, fontWeight:700 }}>
                    {PAYER_EMOJI[filterPayer]} {filterPayer}
                  </span>
                )}
              </h3>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={exportCSV} style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #4caf50', background:'#f0fff0', color:'#2e7d32', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>📥</button>
                <button onClick={openAdd} style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #9500ff', background:'#b088f01c', color:'#893fe3', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>➕</button>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#b0a090' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>💸</div>
                <p style={{ margin:0 }}>No expenses {filterPayer ? `paid by ${filterPayer}` : `for ${monthLabel}`}</p>
                <p style={{ fontSize:12, marginTop:4 }}>Click ➕ to record one</p>
              </div>
            ) : (
              <div style={{ padding:'0 8px' }}>
                {filteredExpenses.map(exp => (
                  <ExpenseRow key={exp._id} expense={exp} onEdit={openEdit} onDelete={deleteExpense} />
                ))}
                <div style={{ padding:'12px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  {filterPayer && <span style={{ fontSize:11, color:'#b0a090' }}>{filteredExpenses.length} of {expenses.length} expenses</span>}
                  <span style={{ fontSize:14, fontWeight:800, color:'#c0504d', marginLeft:'auto' }}>Total: {fc(filteredTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Add/Edit Expense Modal ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={resetForm}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>

            {/* Modal Header */}
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:1 }}>
              <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>
                {editingId ? '✏️ Edit Expense' : '➕ Add Expense'}
              </div>
              <button onClick={resetForm} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>

            {/* Form */}
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>TITLE *</label>
                <input id="expense-title-input" value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Milk purchase" style={inputStyle} />
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>AMOUNT (₹) *</label>
                  <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>DATE *</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>CATEGORY *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {CATS.map(cat => (
                    <button key={cat} type="button" onClick={() => setFCategory(cat)} style={{
                      padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600,
                      border:`2px solid ${fCategory === cat ? CAT_COLOR[cat] : '#e0d5c8'}`,
                      background: fCategory === cat ? CAT_COLOR[cat] + '20' : 'transparent',
                      color: fCategory === cat ? CAT_COLOR[cat] : '#7a6a5a',
                      cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                    }}>
                      {CAT_EMOJI[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Paid By ── */}
              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>PAID BY *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {PAYERS.map(p => (
                    <button key={p} type="button" onClick={() => setFPaidBy(p)} style={{
                      flex:1, padding:'8px 6px', borderRadius:12, fontSize:12, fontWeight:700,
                      border:`2px solid ${fPaidBy === p ? PAYER_COLOR[p] : '#e0d5c8'}`,
                      background: fPaidBy === p ? PAYER_COLOR[p] + '18' : 'transparent',
                      color: fPaidBy === p ? PAYER_COLOR[p] : '#7a6a5a',
                      cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'center',
                    }}>
                      <div style={{ fontSize:16 }}>{PAYER_EMOJI[p]}</div>
                      <div>{p}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>NOTE (optional)</label>
                <input value={fNote} onChange={e => setFNote(e.target.value)} placeholder="Any extra details..." style={inputStyle} />
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={saveExpense} disabled={saving} style={{
                  flex:1, padding:'14px', borderRadius:12, border:'none',
                  background: saving ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
                  color:'#fff', fontSize:15, fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily:"'DM Sans',sans-serif",
                  boxShadow:'0 4px 14px rgba(193,127,60,0.4)',
                }}>
                  {saving ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add Expense'}
                </button>
                <button onClick={resetForm} style={{ padding:'14px 20px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}