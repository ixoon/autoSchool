'use client';

import { useEffect, useState } from 'react';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Role = 'student' | 'instruktor' | 'superadmin';

export default function SendInvite() {
  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [autoSkole, setAutoSkole] = useState<any[]>([]);
  const [instruktori, setInstruktori] = useState<any[]>([]);
  const [filteredInstruktori, setFilteredInstruktori] = useState<any[]>([]);
  const [autoSkolaId, setAutoSkolaId] = useState('');
  const [instruktorId, setInstruktorId] = useState('');
  const [imePrezime, setImePrezime] = useState('');
  const [godine, setGodine] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Podaci o kreiranoj pozivnici
  const [inviteData, setInviteData] = useState<{
    email: string;
    inviteLink: string;
    role: string;
    imePrezime?: string | null;
    godine?: number | null;
    inviteId: string;
  } | null>(null);

  // Ucitavanje autoskola i instruktora
  useEffect(() => {
    const fetchData = async () => {
      try {
        const autoSnap = await getDocs(collection(db, 'AutoSkole'));
        const instrSnap = await getDocs(collection(db, 'Instruktori'));

        const autoSkoleData = autoSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        }));
        
        const instruktoriData = instrSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        }));

        setAutoSkole(autoSkoleData);
        setInstruktori(instruktoriData);
        
        console.log("✅ Učitane autoškole:", autoSkoleData.length);
        console.log("✅ Učitani instruktori:", instruktoriData.length);
      } catch (err) {
        console.error("❌ Greška pri učitavanju:", err);
        setError("Greška pri učitavanju podataka");
      }
    };
    fetchData();
  }, []);

  // Filtriranje instruktora po autoskoli
  useEffect(() => {
    if (!autoSkolaId) {
      setFilteredInstruktori([]);
      setInstruktorId('');
      return;
    }
    
    const filtered = instruktori.filter(i => i.autoSkolaId === autoSkolaId);
    setFilteredInstruktori(filtered);
    setInstruktorId('');
    
    console.log(`🔍 Instruktori za autoškolu ${autoSkolaId}:`, filtered.length);
  }, [autoSkolaId, instruktori]);

  // 1. KREIRANJE POZIVNICE (cloud funkcija)
  const handleCreateInvite = async () => {
    setError('');
    setMessage('');
    setInviteData(null);
    setLoading(true);

    // Validacija
    if (!email) {
      setError('Unesite email');
      setLoading(false);
      return;
    }

    if (role === 'student' && (!autoSkolaId || !instruktorId)) {
      setError('Izaberite autoskolu i instruktora');
      setLoading(false);
      return;
    }

    if (role === 'instruktor' && !autoSkolaId) {
      setError('Izaberite autoskolu');
      setLoading(false);
      return;
    }

    try {
      console.log("📤 SLANJE PODATAKA U FUNKCIJU:", {
        email,
        role,
        autoSkolaId,
        instruktorId,
        imePrezime,
        godine
      });

      const createInvite = httpsCallable(functions, 'createInvite');
      const result = await createInvite({
        email,
        role,
        autoSkolaId: autoSkolaId || null,
        instruktorId: instruktorId || null,
        imePrezime: imePrezime || null,
        godine: godine ? Number(godine) : null,
      });

      // Firebase callable funkcije vraćaju result.data
      const data = (result as any).data;
      
      console.log("📥 ODGOVOR IZ FUNKCIJE:", data);

      // Kopiraj link u clipboard
      await navigator.clipboard.writeText(data.inviteLink);
      
      setMessage(`✅ Link kreiran i kopiran u clipboard!`);

      // Sačuvaj podatke za slanje mejla
      setInviteData({
        email: data.email,
        inviteLink: data.inviteLink,
        role: data.role,
        imePrezime: data.imePrezime,
        godine: data.godine,
        inviteId: data.inviteId
      });

      console.log("📦 inviteData sačuvan:", {
        email: data.email,
        role: data.role,
        inviteLink: data.inviteLink
      });

      // Reset forme
      setEmail('');
      setImePrezime('');
      setGodine('');
      setAutoSkolaId('');
      setInstruktorId('');
      
    } catch (err: any) {
      console.error('❌ Greška pri kreiranju:', err);
      setError(err.message || 'Greška pri kreiranju pozivnice');
    } finally {
      setLoading(false);
    }
  };

  // 2. SLANJE MEJLA (Next.js API ruta)
  const handleSendEmail = async () => {
  if (!inviteData?.inviteLink) {
    setError('Nema linka');
    return;
  }

  setSendingEmail(true);
  setError('');
  
  try {
    // Izvuci token iz linka
    const token = inviteData.inviteLink.split('token=')[1];
    
    if (!token) {
      setError('Neispravan link');
      setSendingEmail(false);
      return;
    }

    console.log("🔑 Token:", token);

    // Nadji invite u bazi po tokenu
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('token', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      setError('Pozivnica nije pronađena u bazi');
      setSendingEmail(false);
      return;
    }

    const inviteDoc = querySnapshot.docs[0];
    const inviteData_fromDb = inviteDoc.data();
    const emailFromDb = inviteData_fromDb.email;
    
    console.log("📧 Email iz baze (preko tokena):", emailFromDb);

    if (!emailFromDb) {
      setError('Nema email adrese u bazi');
      setSendingEmail(false);
      return;
    }

    // Pošalji mejl
    const response = await fetch('/api/send-invite-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailFromDb,
        inviteLink: inviteData.inviteLink
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('✅ Mejl je uspešno poslat!');
      setInviteData(null);
    } else {
      setError(data.error || `Greška ${response.status}`);
    }
  } catch (err: any) {
    console.error('❌ Greška:', err);
    setError('Greška pri slanju mejla: ' + err.message);
  } finally {
    setSendingEmail(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        {/* FORMA ZA KREIRANJE POZIVNICE */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-6">
          <h1 className="text-2xl font-bold text-center mb-6">Kreiraj pozivnicu</h1>
          
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email adresa *
              </label>
              <input
                type="email"
                placeholder="primer@email.com"
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Rola */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rola *
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="instruktor">Instruktor</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            {/* Autoškola (za student i instruktor) */}
            {(role === 'student' || role === 'instruktor') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autoškola *
                </label>
                <select
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={autoSkolaId}
                  onChange={e => setAutoSkolaId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Izaberi autoskolu</option>
                  {autoSkole.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.naziv} {a.mesto ? `- ${a.mesto}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Instruktor (samo za student) */}
            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instruktor *
                </label>
                <select
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={instruktorId}
                  onChange={e => setInstruktorId(e.target.value)}
                  disabled={!autoSkolaId || loading}
                >
                  <option value="">Izaberi instruktora</option>
                  {filteredInstruktori.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.fullName || i.ime || 'Nepoznato'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ime i prezime (za student i instruktor) */}
            {(role === 'student' || role === 'instruktor') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ime i prezime
                  </label>
                  <input
                    type="text"
                    placeholder="Pera Perić"
                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={imePrezime}
                    onChange={e => setImePrezime(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Godine (samo za instruktor) */}
                {role === 'instruktor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Godine
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={godine}
                      onChange={e => setGodine(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
              </>
            )}

            {/* Dugme za kreiranje */}
            <button
              onClick={handleCreateInvite}
              disabled={loading}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                }
              `}
            >
              {loading ? 'Kreiram link...' : 'Kreiraj pozivnicu'}
            </button>
          </div>
        </div>

        {/* PRIKAZ LINK-a I DUGME ZA SLANJE MEJLA */}
        {inviteData && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">✅ Pozivnica je kreirana!</h2>
            
            <div className="mb-4 p-3 bg-gray-50 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Link za registraciju:</p>
              <a 
                href={inviteData.inviteLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 break-all hover:underline"
              >
                {inviteData.inviteLink}
              </a>
              <p className="text-xs text-gray-500 mt-1">(kopiran u clipboard)</p>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Email:</span> {inviteData.email}<br/>
                <span className="font-bold">Rola:</span> {inviteData.role}
              </p>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                ${sendingEmail
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 transition-colors'
                }
              `}
            >
              {sendingEmail ? 'Šaljem mejl...' : 'Pošalji mejl korisniku'}
            </button>
          </div>
        )}

        {/* PORUKE */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}