'use client';

import { db } from '../../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';

const Page = () => {
  const [imePrezime, setImePrezime] = useState('');
  const [email, setEmail] = useState('');
  const [zahtev, setZahtev] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await addDoc(collection(db, 'AccessRequests'), {
        fullName: imePrezime,
        email,
        requestedRole: zahtev,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setMessage('Zahtev uspešno poslat! Očekujte odgovor na email.');
      setImePrezime('');
      setEmail('');
      setZahtev('');
    } catch (err) {
      setError('Greška prilikom podnošenja zahteva.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Zahtev za upis u autoškolu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={imePrezime}
            onChange={(e) => setImePrezime(e.target.value)}
            type="text"
            placeholder="Ime i prezime"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            value={zahtev}
            onChange={(e) => setZahtev(e.target.value)}
            type="text"
            placeholder="Podnosim zahtev za…"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Podnesi zahtev
          </button>
        </form>

        {message && (
          <p className="mt-4 text-green-600 text-center font-medium">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-red-600 text-center font-medium">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Page;
