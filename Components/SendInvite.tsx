'use client';

import { useEffect, useState } from 'react';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, User, School, Users, Calendar, Link as LinkIcon, Send, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

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
    setError(''); setMessage(''); setInviteData(null); setLoading(true); setCopied(false);

    if (!email) { setError('Unesite email'); setLoading(false); return; }
    if (role === 'student' && (!autoSkolaId || !instruktorId)) { setError('Izaberite autoškolu i instruktora'); setLoading(false); return; }
    if (role === 'instruktor' && !autoSkolaId) { setError('Izaberite autoškolu'); setLoading(false); return; }

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
  setCopied(true);
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
      if (response.ok) { 
        setMessage('✅ Mejl je uspešno poslat!'); 
        setInviteData(null); 
      }
      else setError(data.error || `Greška ${response.status}`);
    } catch (err: any) { setError('Greška pri slanju mejla: ' + err.message); }
    finally { setSendingEmail(false); }
  };

  const handleCopyLink = () => {
    if (inviteData?.inviteLink) {
      navigator.clipboard.writeText(inviteData.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Kreiraj pozivnicu</h2>
            <p className="text-sm text-slate-500">Pošaljite pozivnicu novom korisniku</p>
          </div>
        </div>

        {/* Forma */}
        <div className="space-y-4">
          {/* Email polje */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Mail className="w-4 h-4 text-blue-600" />
              Email adresa
            </label>
            <input 
              type="email" 
              placeholder="primer@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Role select */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <User className="w-4 h-4 text-blue-600" />
              Uloga
            </label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as Role)} 
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
            >
              <option value="student">Student</option>
              <option value="instruktor">Instruktor</option>
            </select>
          </div>

          {/* Autoškola select */}
          {(role === 'student' || role === 'instruktor') && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <School className="w-4 h-4 text-blue-600" />
                Autoškola
              </label>
              <select 
                value={autoSkolaId} 
                onChange={e => setAutoSkolaId(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
              >
                <option value="">Izaberi autoškolu</option>
                {autoSkole.map(a => (
                  <option key={a.id} value={a.id}>{a.naziv} - {a.mesto}</option>
                ))}
              </select>
            </div>
          )}

          {/* Instruktor select */}
          {role === 'student' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-600" />
                Instruktor
              </label>
              <select 
                value={instruktorId} 
                onChange={e => setInstruktorId(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                disabled={!autoSkolaId}
              >
                <option value="">Izaberi instruktora</option>
                {filteredInstruktori.map(i => (
                  <option key={i.id} value={i.id}>{i.fullName || i.ime}</option>
                ))}
              </select>
              {!autoSkolaId && (
                <p className="text-xs text-amber-600 mt-1">Prvo izaberite autoškolu</p>
              )}
            </div>
          )}

          {/* Ime i prezime */}
          {(role === 'student' || role === 'instruktor') && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <User className="w-4 h-4 text-blue-600" />
                Ime i prezime
              </label>
              <input 
                placeholder="Marko Marković" 
                value={imePrezime} 
                onChange={e => setImePrezime(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}

          {/* Godine */}
          {role === 'instruktor' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                Godine
              </label>
              <input 
                type="number" 
                placeholder="30" 
                value={godine} 
                onChange={e => setGodine(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}

          {/* Create button */}
          <button 
            onClick={handleCreateInvite} 
            disabled={loading} 
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kreiram...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Kreiraj pozivnicu
              </>
            )}
          </button>
        </div>

        {/* Invite Data Display */}
        {inviteData && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Pozivnica kreirana</h3>
            </div>
            
            <div className="space-y-3">
              {/* Link sa kopiranjem */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-green-200 rounded-lg p-2.5 text-sm font-mono truncate">
                  {inviteData.inviteLink}
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="p-2.5 bg-white border border-green-200 rounded-lg hover:bg-green-100 transition-colors group relative"
                  title="Kopiraj link"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Email button */}
              <button 
                onClick={handleSendEmail} 
                disabled={sendingEmail} 
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Šaljem mejl...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Pošalji mejl
                  </>
                )}
              </button>

              {/* Info o pozivnici */}
              <div className="mt-3 text-xs text-green-700 bg-green-100/50 p-2 rounded-lg">
                <p>📧 {inviteData.email}</p>
                <p>👤 Uloga: {inviteData.role === 'student' ? 'Student' : inviteData.role === 'instruktor' ? 'Instruktor' : 'Super Admin'}</p>
                {inviteData.imePrezime && <p>👤 Ime: {inviteData.imePrezime}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 font-medium">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}