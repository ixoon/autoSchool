'use client';

import { useEffect, useState } from 'react';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Role = 'student' | 'instruktor' | 'superadmin';

export default function SendInvite() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [autoSkole, setAutoSkole] = useState<any[]>([]);
  const [instruktori, setInstruktori] = useState<any[]>([]);
  const [filteredInstruktori, setFilteredInstruktori] = useState<any[]>([]);
  const [autoSkolaId, setAutoSkolaId] = useState('');
  const [instruktorId, setInstruktorId] = useState('');
  const [imePrezime, setImePrezime] = useState('');
  const [godine, setGodine] = useState('');

  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [inviteData, setInviteData] = useState<{
    email: string;
    inviteLink: string;
    role: string;
    imePrezime?: string | null;
    godine?: number | null;
    autoSkolaId?: string | null;
    instruktorId?: string | null;
    inviteId: string;
  } | null>(null);

  // Učitavanje autoskola i instruktora
  useEffect(() => {
    const fetchData = async () => {
      const autoSnap = await getDocs(collection(db, 'AutoSkole'));
      const instrSnap = await getDocs(collection(db, 'Instruktori'));
      setAutoSkole(autoSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInstruktori(instrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoSkolaId) {
      setFilteredInstruktori([]);
      setInstruktorId('');
      return;
    }
    setFilteredInstruktori(instruktori.filter(i => i.autoSkolaId === autoSkolaId));
    setInstruktorId('');
  }, [autoSkolaId, instruktori]);

  const handleCreateInvite = async () => {
    setError(''); setMessage(''); setInviteData(null); setLoading(true);

    if (!email) { setError('Unesite email'); setLoading(false); return; }
    if (role === 'student' && (!autoSkolaId || !instruktorId)) { setError('Izaberite autoskolu i instruktora'); setLoading(false); return; }
    if (role === 'instruktor' && !autoSkolaId) { setError('Izaberite autoskolu'); setLoading(false); return; }

    try {
      const createInvite = httpsCallable(functions, 'createInvite');
      const result = await createInvite({
        email,
        role,
        autoSkolaId: autoSkolaId || null,
        instruktorId: instruktorId || null,
        imePrezime: imePrezime || null,
        godine: godine ? Number(godine) : null,
      });
     const data = (result as any).data;

// Provera da li su podaci sačuvani
console.log('Podaci iz funkcije:', data);

// kopiš link u clipboard (ako postoji)
if (data?.inviteLink) {
  await navigator.clipboard.writeText(data.inviteLink);
  setMessage('✅ Link kreiran i kopiran u clipboard!');
} else {
  setMessage('✅ Link kreiran (nije kopiran).');
}

// Postavi inviteData koristeći vrednosti iz odgovora funkcije
setInviteData({
  email: data.email,
  inviteLink: data.inviteLink,
  role: data.role,
  imePrezime: data.imePrezime ?? null,
  godine: data.godine ?? null,
  autoSkolaId: data.autoSkolaId ?? null,
  instruktorId: data.instruktorId ?? null,
  inviteId: data.inviteId,
});
      
      // Dodatna provera da li je invite sačuvan u bazi
      const token = data.inviteLink.split('token=')[1];
      if (token) {
        const invitesRef = collection(db, 'invites');
        const q = query(invitesRef, where('token', '==', token));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const inviteDoc = querySnapshot.docs[0];
          const inviteData = inviteDoc.data();
          console.log('Podaci iz baze:', inviteData);
          if (!inviteData.autoSkolaId && role !== 'superadmin') {
            console.warn('UPOZORENJE: autoSkolaId nije sačuvan u bazi!');
          }
        }
      }
      
      setEmail(''); setImePrezime(''); setGodine(''); setAutoSkolaId(''); setInstruktorId('');
    } catch (err: any) {
      setError(err.message || 'Greška pri kreiranju pozivnice');
    } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    if (!inviteData?.inviteLink) { setError('Nema linka'); return; }
    setSendingEmail(true); setError('');
    try {
      const token = inviteData.inviteLink.split('token=')[1];
      if (!token) throw new Error('Neispravan link');

      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('token', '==', token));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error('Pozivnica nije pronađena u bazi');
      
      const inviteDoc = querySnapshot.docs[0];
      const inviteDataFromDb = inviteDoc.data();
      const emailFromDb = inviteDataFromDb.email;
      
      if (!emailFromDb) throw new Error('Nema email adrese u bazi');
      
      // Provera da li invite ima autoSkolaId i instruktorId
      console.log('Slanje emaila za invite:', {
        autoSkolaId: inviteDataFromDb.autoSkolaId,
        instruktorId: inviteDataFromDb.instruktorId,
        role: inviteDataFromDb.role
      });

      const response = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailFromDb, 
          inviteLink: inviteData.inviteLink,
          // Prosledi i ove podatke ako su potrebni za email template
          autoSkolaId: inviteDataFromDb.autoSkolaId,
          instruktorId: inviteDataFromDb.instruktorId,
          role: inviteDataFromDb.role
        }),
      });
      const data = await response.json();
      if (response.ok) { setMessage('✅ Mejl je uspešno poslat!'); setInviteData(null); }
      else setError(data.error || `Greška ${response.status}`);
    } catch (err: any) { setError('Greška pri slanju mejla: ' + err.message); }
    finally { setSendingEmail(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Kreiraj pozivnicu</h1>

          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded mb-2"/>
          <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full border p-2 rounded mb-2">
            <option value="student">Student</option>
            <option value="instruktor">Instruktor</option>
          </select>

          {(role === 'student' || role === 'instruktor') && (
            <select value={autoSkolaId} onChange={e => setAutoSkolaId(e.target.value)} className="w-full border p-2 rounded mb-2">
              <option value="">Izaberi autoškolu</option>
              {autoSkole.map(a => <option key={a.id} value={a.id}>{a.naziv}</option>)}
            </select>
          )}

          {role === 'student' && (
            <select value={instruktorId} onChange={e => setInstruktorId(e.target.value)} className="w-full border p-2 rounded mb-2">
              <option value="">Izaberi instruktora</option>
              {filteredInstruktori.map(i => <option key={i.id} value={i.id}>{i.fullName || i.ime}</option>)}
            </select>
          )}

          {(role === 'student' || role === 'instruktor') && <input placeholder="Ime i prezime" value={imePrezime} onChange={e => setImePrezime(e.target.value)} className="w-full border p-2 rounded mb-2"/>}
          {role === 'instruktor' && <input type="number" placeholder="Godine" value={godine} onChange={e => setGodine(e.target.value)} className="w-full border p-2 rounded mb-2"/>}

          <button onClick={handleCreateInvite} disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded mb-2">{loading ? 'Kreiram...' : 'Kreiraj pozivnicu'}</button>

          {inviteData && (
            <div className="bg-green-50 p-4 rounded">
              <p className="break-all">{inviteData.inviteLink}</p>
              <button onClick={handleSendEmail} disabled={sendingEmail} className="w-full py-2 bg-green-600 text-white rounded mt-2">{sendingEmail ? 'Šaljem...' : 'Pošalji mejl'}</button>
            </div>
          )}

          {message && <p className="text-green-700 mt-2">{message}</p>}
          {error && <p className="text-red-700 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}