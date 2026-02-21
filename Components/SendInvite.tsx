'use client';

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/config/firebase";

type Props = {
  onSuccess?: () => void;
};

const SendInvite: React.FC<Props> = ({ onSuccess }) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"student" | "instruktor" | "superadmin">("student");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const handleSendInvite = async () => {
    // Resetovanje poruka
    setMessage("");
    setError("");
    setInviteLink("");
    
    console.log("Slanje pozivnice za:", inviteEmail, "sa rolom:", inviteRole);
    
    // Validacija email-a
    if (!inviteEmail) {
      setError("Unesite email adresu.");
      return;
    }

    // Basic email validacija
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError("Unesite ispravnu email adresu.");
      return;
    }

    setSending(true);

    try {
      // Pravljenje referenca ka funkciji
      const createInvite = httpsCallable(functions, "createInvite");
      
      console.log("Pozivanje funkcije createInvite...");
      
      // Pozivanje funkcije
      const result = await createInvite({ 
        email: inviteEmail, 
        role: inviteRole 
      });
      
      console.log("Odgovor od funkcije:", result);
      
      // Tipizacija odgovora
      const responseData = result.data as {
        success: boolean;
        inviteLink: string;
        email: string;
        role: string;
        expiresAt: string;
      };
      
      // Prikazivanje uspešne poruke
      setMessage(`Pozivnica uspešno kreirana za ${responseData.email}`);
      setInviteLink(responseData.inviteLink);
      
      // Resetovanje forme
      setInviteEmail("");
      setInviteRole("student");
      
      // Pozivanje callback-a ako postoji
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error("Greška pri slanju pozivnice:");
      console.error("Code:", err.code);
      console.error("Message:", err.message);
      console.error("Details:", err.details);
      
      // Prikazivanje odgovarajuće greške
      if (err.code === "functions/unauthenticated") {
        setError("Niste ulogovani. Molimo prijavite se.");
      } else if (err.code === "functions/permission-denied") {
        setError("Nemate dozvolu za slanje pozivnica. Potrebna je superadmin rola.");
      } else if (err.code === "functions/invalid-argument") {
        setError("Neispravni podaci. Proverite email i rolu.");
      } else if (err.code === "functions/already-exists") {
        setError("Korisnik sa ovim email-om već postoji ili ima aktivnu pozivnicu.");
      } else {
        setError(err.message || "Došlo je do greške prilikom slanja pozivnice.");
      }
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Link kopiran u clipboard!");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 max-w-xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Slanje pozivnice
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email adresa
        </label>
        <input
          type="email"
          placeholder="npr. instruktor@gmail.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          disabled={sending}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rola korisnika
        </label>
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as any)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          disabled={sending}
        >
          <option value="student">Student</option>
          <option value="instruktor">Instruktor</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>

      <button
        onClick={handleSendInvite}
        disabled={sending}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {sending ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Slanje pozivnice...
          </>
        ) : "Pošalji pozivnicu"}
      </button>

      {message && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">{message}</p>
          {inviteLink && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
              />
              <button
                onClick={copyToClipboard}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
              >
                Kopiraj
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SendInvite;