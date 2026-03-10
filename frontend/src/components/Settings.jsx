// import { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { settingsAPI } from '../services/api';

// // When defined inside, React recreates them on every render → input loses focus on each keystroke
// const inputStyle = {
//   width:'100%', padding:'11px 14px', borderRadius:11,
//   border:'1.5px solid #e0d5c8', fontSize:14, outline:'none',
//   boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif",
//   color:'#3d1a00', background:'#fff',
// };

// function Section({ title, children }) {
//   return (
//     <div style={{ background:'#fff', borderRadius:18, padding:'clamp(18px,4vw,26px)', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
//       <h3 style={{ margin:'0 0 18px', color:'#3d1a00', fontSize:15, letterSpacing:1, paddingBottom:12, borderBottom:'2px solid #f0ebe4', fontFamily:"'Playfair Display',Georgia,serif" }}>{title}</h3>
//       {children}
//     </div>
//   );
// }

// function Field({ label, value, onChange, type='text', placeholder='' }) {
//   return (
//     <div style={{ marginBottom:16 }}>
//       <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, letterSpacing:0.5, fontWeight:600 }}>{label}</label>
//       <input
//         type={type}
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         placeholder={placeholder}
//         style={inputStyle}
//       />
//     </div>
//   );
// }

// export default function Settings() {
//   const [cafeName, setCafeName] = useState('');
//   const [address,  setAddress]  = useState('');
//   const [phone,    setPhone]    = useState('');
//   const [tagline,  setTagline]  = useState('');
//   const [ownerPin, setOwnerPin] = useState('');
//   const [loading,  setLoading]  = useState(true);
//   const [saving,   setSaving]   = useState(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await settingsAPI.getFull();
//         const d = res.data.data;
//         setCafeName(d.cafeName || '');
//         setAddress(d.address   || '');
//         setPhone(d.phone       || '');
//         setTagline(d.tagline   || '');
//         setOwnerPin(d.ownerPin || '');
//       } catch {
//         toast.error('Failed to load settings');
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const save = async () => {
//     if (!cafeName.trim()) return toast.error('Café name is required');
//     if (ownerPin && ownerPin.length !== 4) return toast.error('PIN must be exactly 4 digits');
//     setSaving(true);
//     try {
//       await settingsAPI.update({ cafeName, address, phone, tagline, ownerPin, gstEnabled: false, gstRate: 0 });
//       toast.success('✅ Settings saved!');
//     } catch {
//       toast.error('Failed to save settings');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <div style={{ textAlign:'center', paddingTop:80, color:'#c9a96e', fontSize:32 }}>⏳</div>;

//   return (
//     <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)' }}>
//       <h2 style={{ margin:'0 0 16px', color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(18px,4vw,24px)' }}>
//         ⚙️ Settings
//       </h2>

//       <div style={{ maxWidth:560 }}>

//         <Section title="🍨 Café Information">
//           <Field label="CAFÉ NAME *"          value={cafeName} onChange={setCafeName} />
//           <Field label="ADDRESS"              value={address}  onChange={setAddress}  placeholder="Near Main Square, City" />
//           <Field label="PHONE"                value={phone}    onChange={setPhone}    placeholder="+91 98765 43210" />
//           <Field label="TAGLINE (on receipt)" value={tagline}  onChange={setTagline}  placeholder="Sip. Smile. Repeat." />
//         </Section>

//         <Section title="🔐 Security">
//           <Field label="OWNER PIN (4 digits)" value={ownerPin} onChange={setOwnerPin} type="password" placeholder="****" />
//           <p style={{ fontSize:12, color:'#b0a090', marginTop:-8, marginBottom:0 }}>
//             You'll need this PIN on your next login.
//           </p>
//         </Section>

//         <button onClick={save} disabled={saving} style={{
//           width:'100%', padding:'16px', borderRadius:14, border:'none',
//           background: saving ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)',
//           color:'#fff', fontSize:16, fontWeight:700,
//           cursor: saving ? 'not-allowed' : 'pointer',
//           fontFamily:"'DM Sans',sans-serif",
//           boxShadow:'0 6px 20px rgba(193,127,60,0.4)',
//           marginBottom:60,
//         }}>
//           {saving ? '⏳ Saving...' : '💾 Save Settings'}
//         </button>
//       </div>
//     </div>
//   );
// }


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

export default function Settings() {
  const [form, setForm] = useState({
    cafeName:'', address:'', phone:'', tagline:'',
    gstEnabled:false, gstRate:5, upiId:'',
  });
  const [pinForm,   setPinForm]   = useState({ current:'', newPin:'', confirm:'' });
  const [upiForm,   setUpiForm]   = useState({ newUpi:'' });
  const [saving,    setSaving]    = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [showPins,  setShowPins]  = useState(false);
  const [showUpi,   setShowUpi]   = useState(false);
  const [storedPin, setStoredPin] = useState('');

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
          upiId:      s.upiId      || '',
        });
        setStoredPin(s.ownerPin || '');
        setUpiForm({ newUpi: s.upiId || '' });
      } catch { toast.error('Failed to load settings'); }
    })();
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

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

  // ── Change UPI ID ─────────────────────────────────────────────────────────
  const saveUpi = async () => {
    const upi = upiForm.newUpi.trim();
    if (!upi) return toast.error('UPI ID cannot be empty');
    if (!/^[\w.\-]+@[\w]+$/.test(upi)) return toast.error('Invalid UPI ID (e.g. name@bank)');
    setSavingUpi(true);
    try {
      await settingsAPI.update({ upiId: upi });
      setForm(p => ({ ...p, upiId: upi }));
      setShowUpi(false);
      toast.success('✅ UPI ID updated!');
    } catch { toast.error('Failed to update UPI ID'); }
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

      {/* ── UPI / GPay ── */}
      <Section title="GPay / UPI Payment" emoji="📱">
        {/* Current UPI display */}
        <div style={{ background:'#f0f0ff', border:'1.5px solid #9fa8da', borderRadius:12, padding:'14px 18px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:'#5c6bc0', fontWeight:700, marginBottom:4 }}>CURRENT UPI ID</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#1a237e' }}>{form.upiId || '—'}</div>
          </div>
          <div style={{ fontSize:32 }}>💳</div>
        </div>

        {/* Toggle */}
        <button onClick={() => setShowUpi(v => !v)} style={{ width:'100%', padding:'11px', borderRadius:12, border:'2px dashed #5c6bc0', background:showUpi?'#e8eaf6':'#f8f5f0', color:'#1a237e', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:showUpi?14:0 }}>
          {showUpi ? '✕ Cancel' : '✏️ Change UPI ID'}
        </button>

        {showUpi && (
          <div style={{ display:'grid', gap:12 }}>
            <div>
              <label style={lbl}>NEW UPI ID</label>
              <input
                style={{ ...inp, borderColor:'#9fa8da', fontSize:15, fontWeight:600, color:'#1a237e' }}
                value={upiForm.newUpi}
                onChange={e => setUpiForm({ newUpi: e.target.value })}
                placeholder="yourname@bank"
                autoCapitalize="none"
              />
              <div style={{ fontSize:11, color:'#9fa8da', marginTop:5 }}>
                Examples: pateljaya1607-2@oksbi · name@paytm · 9999999999@upi
              </div>
            </div>
            <button onClick={saveUpi} disabled={savingUpi} style={{ padding:'13px', borderRadius:12, border:'none', background:savingUpi?'#aaa':'linear-gradient(135deg,#3949ab,#5c6bc0)', color:'#fff', fontSize:14, fontWeight:700, cursor:savingUpi?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(57,73,171,0.35)' }}>
              {savingUpi ? '⏳ Saving...' : '📱 Update UPI ID'}
            </button>
          </div>
        )}
      </Section>

      {/* ── GST ── */}
      {/* <Section title="Tax / GST" emoji="🧾">
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:form.gstEnabled?14:0 }}>
          <div onClick={() => set('gstEnabled', !form.gstEnabled)} style={{ width:48, height:26, borderRadius:13, background:form.gstEnabled?'#c17f3c':'#ddd', position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0 }}>
            <div style={{ position:'absolute', top:3, left:form.gstEnabled?24:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontSize:14, color:'#3d1a00', fontWeight:600 }}>Enable GST</span>
        </div>
        {form.gstEnabled && (
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>GST RATE (%)</label>
            <input type="number" min="0" max="28" style={inp} value={form.gstRate} onChange={e => set('gstRate', e.target.value)} />
          </div>
        )}
        <button onClick={saveGeneral} disabled={saving} style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background:saving?'#aaa':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {saving ? '⏳ Saving...' : '💾 Save GST Settings'}
        </button>
      </Section> */}

      {/* ── PIN ── */}
      <Section title="Security" emoji="🔐">
        <button onClick={() => setShowPins(v => !v)} style={{ width:'100%', padding:'11px', borderRadius:12, border:'2px dashed #c17f3c', background:showPins?'#fff8ef':'#f8f5f0', color:'#c17f3c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:showPins?14:0 }}>
          {showPins ? '✕ Cancel' : '🔑 Change Login PIN'}
        </button>

        {showPins && (
          <div style={{ display:'grid', gap:12 }}>
            {[
              { key:'current', label:'CURRENT PIN',     ph:'Enter current PIN' },
              { key:'newPin',  label:'NEW PIN',          ph:'4–6 digits' },
              { key:'confirm', label:'CONFIRM NEW PIN',  ph:'Repeat new PIN' },
            ].map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input type="password" inputMode="numeric" maxLength={6} style={inp}
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