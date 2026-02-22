'use client';

import { auth } from '../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react'

const page = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const handleForgotPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Poslali smo link za reset lozinke na Vas email, proverite spam.")
            setEmail("")
        } catch(error) {
            setError("Greska, doslo je do greske.")
        }
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Zaboravljena lozinka</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Unesite email povezan sa Vasim nalogom, i poslacemo Vam link za reset lozinke.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Adresa"
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleForgotPassword}
          className="w-full py-2 mb-4 bg-linear-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-semibold rounded-lg transition"
        >
          Posalji link
        </button>

        {message && (
          <p className="text-center text-green-600 text-sm mb-2">{message}</p>
        )}
        {error && (
          <p className="text-center text-red-600 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}

export default page