import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

const inp = {
  width:'100%', padding:'10px 14px', borderRadius:10,
  border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
  boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00',
  background:'#fff',
};

const lbl = { fontSize:11, color:'#7a6a5a', display:'block', marginBottom:6, fontWeight:700, letterSpacing:0.5 };

const Section = ({ title, emoji, children }) => (
  <div style={{ background:'#fff', borderRadius:16, padding:'20px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #e8e0d5' }}>
    <h3 style={{ margin:'0 0 16px', fontSize:15, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", display:'flex', alignItems:'center', gap:8 }}>
      {emoji} {title}
    </h3>
    {children}
  </div>
);

const DEFAULT_UPI_OWNERS = [
  { key:'JP',     name:'JP',     upiId:'', emoji:'👦🏻' },
  { key:'Jenish', name:'Jenish', upiId:'', emoji:'🧔🏻‍♂️' },
  { key:'Urvish', name:'Urvish', upiId:'', emoji:'👨🏻' },
];

const OWNER_COLORS = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669' };

export default function Settings() {
  const [form, setForm] = useState({
    cafeName:'', address:'', phone:'', tagline:'',
    gstEnabled:false, gstRate:5,
  });
  const [upiOwners,   setUpiOwners]   = useState(DEFAULT_UPI_OWNERS);
  const [pinForm,     setPinForm]     = useState({ current:'', newPin:'', confirm:'' });
  const [saving,      setSaving]      = useState(false);
  const [savingUpi,   setSavingUpi]   = useState(false);
  const [savingPin,   setSavingPin]   = useState(false);
  const [showPins,    setShowPins]    = useState(false);
  const [storedPin,   setStoredPin]   = useState('');
  // Track which owner's field is being edited inline
  const [editingOwner, setEditingOwner] = useState(null); // key string

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsAPI.getFull();
        const s   = res.data.data;
        setForm({
          cafeName:   s.cafeName   || '',
          address:    s.address    || '',
          phone:      s.phone      || '',
          tagline:    s.tagline    || '',
          gstEnabled: s.gstEnabled || false,
          gstRate:    s.gstRate    || 5,
        });
        setStoredPin(s.ownerPin || '');
        if (s.upiOwners && s.upiOwners.length > 0) {
          setUpiOwners(s.upiOwners);
        } else {
          // migrate from legacy upiId
          setUpiOwners(prev => prev.map((o, i) => i === 0 ? { ...o, upiId: s.upiId || '' } : o));
        }
      } catch { toast.error('Failed to load settings'); }
    })();
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateOwnerUpi = (key, val) =>
    setUpiOwners(prev => prev.map(o => o.key === key ? { ...o, upiId: val } : o));

  // ── Save general ──────────────────────────────────────────────────────────
  const saveGeneral = async () => {
    if (!form.cafeName.trim()) return toast.error('Shop name is required');
    setSaving(true);
    try {
      await settingsAPI.update({ cafeName:form.cafeName, address:form.address, phone:form.phone, tagline:form.tagline, gstEnabled:form.gstEnabled, gstRate:Number(form.gstRate) });
      toast.success('✅ Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Save UPI Owners ───────────────────────────────────────────────────────
  const saveUpiOwners = async () => {
    // Validate non-empty UPI IDs
    for (const o of upiOwners) {
      if (o.upiId && !/^[\w.\-]+@[\w]+$/.test(o.upiId)) {
        return toast.error(`Invalid UPI ID for ${o.name}: ${o.upiId}`);
      }
    }
    setSavingUpi(true);
    try {
      await settingsAPI.update({ upiOwners });
      setEditingOwner(null);
      toast.success('✅ UPI IDs saved!');
    } catch { toast.error('Failed to save UPI IDs'); }
    finally { setSavingUpi(false); }
  };

  // ── Change PIN ────────────────────────────────────────────────────────────
  const savePin = async () => {
    if (pinForm.current !== storedPin)       return toast.error('Current PIN is wrong');
    if (!/^\d{4,6}$/.test(pinForm.newPin))  return toast.error('New PIN must be 4–6 digits');
    if (pinForm.newPin !== pinForm.confirm)  return toast.error('PINs do not match');
    setSavingPin(true);
    try {
      await settingsAPI.update({ ownerPin: pinForm.newPin });
      setStoredPin(pinForm.newPin);
      setPinForm({ current:'', newPin:'', confirm:'' });
      setShowPins(false);
      toast.success('✅ PIN changed!');
    } catch { toast.error('Failed to change PIN'); }
    finally { setSavingPin(false); }
  };

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'12px 12px 70px', fontFamily:"'DM Sans',sans-serif", overflowY:'auto', height:'100%' }}>
      <h2 style={{ margin:'0 0 20px', color:'#3d1a00', fontSize:22, fontFamily:"'Playfair Display',Georgia,serif" }}>⚙️ Settings</h2>

      {/* ── Shop Info ── */}
      <Section title="Shop Information" emoji="🏪">
        <div style={{ display:'grid', gap:14 }}>
          {[
            { key:'cafeName', label:'SHOP NAME',  ph:"Friend's Gola" },
            { key:'address',  label:'ADDRESS',    ph:'Opposite Amigos, Jagatpur Road' },
            { key:'phone',    label:'PHONE',      ph:'+91 98765 43210' },
            { key:'tagline',  label:'TAGLINE',    ph:'Cool. Fresh. Delicious.' },
          ].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
            </div>
          ))}
        </div>
        <button onClick={saveGeneral} disabled={saving} style={{ marginTop:18, width:'100%', padding:'13px', borderRadius:12, border:'none', background:saving?'#aaa':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:15, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(193,127,60,0.35)' }}>
          {saving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
      </Section>

      {/* ── UPI Owners ── */}
      <Section title="GPay / UPI — Per Owner" emoji="📱">
        <p style={{ fontSize:12, color:'#9fa8da', marginBottom:16, margin:'0 0 16px' }}>
          Each owner has their own UPI ID. When taking online payment, pick whose QR to show.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {upiOwners.map(owner => {
            const color = OWNER_COLORS[owner.key] || '#c17f3c';
            const isEditing = editingOwner === owner.key;
            return (
              <div key={owner.key} style={{
                background: isEditing ? `${color}08` : '#faf8f5',
                border: `2px solid ${isEditing ? color : '#e8e0d5'}`,
                borderRadius:14, padding:'14px 16px',
                transition:'all 0.2s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: isEditing ? 12 : 0, wordWrap: 'break-word', wordBreak: 'break-all' }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>{owner.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'#3d1a00' }}>{owner.name}</div>
                    {!isEditing && (
                      <div style={{ fontSize:13, color: owner.upiId ? color : '#b0a090', fontFamily:'monospace', marginTop:2 }}>
                        {owner.upiId || '— no UPI ID set —'}
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setEditingOwner(owner.key)}
                      style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${color}`, background:'transparent', color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                      ✏️
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div style={{ display:'grid', gap:10 }}>
                    <div>
                      <label style={{ ...lbl, color }}>UPI ID for {owner.name}</label>
                      <input
                        style={{ ...inp, borderColor:color, fontSize:15, fontWeight:600, color:'#1a237e' }}
                        value={owner.upiId}
                        onChange={e => updateOwnerUpi(owner.key, e.target.value)}
                        placeholder="yourname@bank"
                        autoCapitalize="none"
                        autoFocus
                      />
                      <div style={{ fontSize:11, color:'#9fa8da', marginTop:5 }}>
                        e.g. pateljaya1607-2@oksbi · name@paytm · 9999999999@upi
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={saveUpiOwners}
                        disabled={savingUpi}
                        style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:savingUpi?'#aaa':`linear-gradient(135deg,${color},${color}bb)`, color:'#fff', fontSize:13, fontWeight:700, cursor:savingUpi?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        {savingUpi ? '⏳...' : '💾 Save'}
                      </button>
                      <button
                        onClick={() => setEditingOwner(null)}
                        style={{ padding:'11px 16px', borderRadius:10, border:`1.5px solid #e0d5c8`, background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── PIN ── */}
      <Section title="Security" emoji="🔐">
        <button onClick={() => setShowPins(v => !v)} style={{ width:'100%', padding:'11px', borderRadius:12, border:'2px dashed #c17f3c', background:showPins?'#fff8ef':'#f8f5f0', color:'#c17f3c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:showPins?14:0 }}>
          {showPins ? '✕ Cancel' : '🔑 Change Login PIN'}
        </button>

        {showPins && (
          <div style={{ display:'grid', gap:12 }}>
            {[
              { key:'current', label:'CURRENT PIN',     ph:'Enter current PIN' },
              { key:'newPin',  label:'NEW PIN',          ph:'4 digits' },
              { key:'confirm', label:'CONFIRM NEW PIN',  ph:'Repeat new PIN' },
            ].map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input type="password" inputMode="numeric" maxLength={4} style={inp}
                  value={pinForm[f.key]} onChange={e => setPinForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} />
              </div>
            ))}
            <button onClick={savePin} disabled={savingPin} style={{ padding:'13px', borderRadius:12, border:'none', background:savingPin?'#aaa':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:14, fontWeight:700, cursor:savingPin?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {savingPin ? '⏳ Saving...' : '🔐 Change PIN'}
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}