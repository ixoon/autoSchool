'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';

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

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Ucitavanje autoskola i instruktora
  useEffect(() => {
    const fetchData = async () => {
      const autoSnap = await getDocs(collection(db, 'AutoSkole'));
      const instrSnap = await getDocs(collection(db, 'Instruktori'));

      setAutoSkole(autoSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInstruktori(instrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchData();
  }, []);

  // filtriranje instruktora po autoskoli
  useEffect(() => {
    if (!autoSkolaId) {
      setFilteredInstruktori([]);
      return;
    }

    const filtered = instruktori.filter(
      (i) => i.autoSkolaId === autoSkolaId
    );
    setFilteredInstruktori(filtered);
  }, [autoSkolaId, instruktori]);

  const generateToken = () =>
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);

  const handleSendInvite = async () => {
  try {
    setError('');
    setMessage('');

    if (!email) return setError('Unesite email');

    if (role === 'student' && (!autoSkolaId || !instruktorId)) {
      return setError('Izaberite autoskolu i instruktora');
    }

    if (role === 'instruktor' && !autoSkolaId) {
      return setError('Izaberite autoskolu');
    }

    const token = generateToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await addDoc(collection(db, 'invites'), {
      email,
      role,
      token,
      used: false,
      expiresAt: expires,
      createdAt: serverTimestamp(),
      autoSkolaId: autoSkolaId || null,
      instruktorId: instruktorId || null,
    });

    const link = `${window.location.origin}/register?token=${token}`;

    // kopiraj u clipboard
    await navigator.clipboard.writeText(link);

    setMessage(`Link kopiran: ${link}`);

  } catch (err: any) {
    setError('Greška: ' + err.message);
  }
};

  return (
    <div className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
      >
        <option value="student">Student</option>
        <option value="instruktor">Instruktor</option>
        <option value="superadmin">Superadmin</option>
      </select>

      {(role === 'student' || role === 'instruktor') && (
        <select
          className="w-full border p-2 rounded"
          value={autoSkolaId}
          onChange={(e) => setAutoSkolaId(e.target.value)}
        >
          <option value="">Izaberi autoskolu</option>
          {autoSkole.map((a) => (
            <option key={a.id} value={a.id}>
              {a.naziv} - {a.mesto}
            </option>
          ))}
        </select>
      )}

      {role === 'student' && (
        <select
          className="w-full border p-2 rounded"
          value={instruktorId}
          onChange={(e) => setInstruktorId(e.target.value)}
          disabled={!autoSkolaId}
        >
          <option value="">Izaberi instruktora</option>
          {filteredInstruktori.map((i) => (
            <option key={i.id} value={i.id}>
              {i.fullName}
            </option>
          ))}
        </select>
      )}

      {(role === 'student' || role === 'instruktor') && (
        <>
          <input
            type="text"
            placeholder="Ime i prezime"
            className="w-full border p-2 rounded"
            value={imePrezime}
            onChange={(e) => setImePrezime(e.target.value)}
          />

          {role === 'instruktor' && (
            <input
              type="number"
              placeholder="Godine"
              className="w-full border p-2 rounded"
              value={godine}
              onChange={(e) => setGodine(e.target.value)}
            />
          )}
        </>
      )}

      <button
        onClick={handleSendInvite}
        className="w-full bg-blue-600 text-white py-2 rounded-lg"
      >
        Pošalji pozivnicu
      </button>

      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}