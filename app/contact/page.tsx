'use client';

import { useState } from 'react';
import { Send, User, Mail, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function KontaktForma() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    // Basic validacija
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: 'error',
        message: 'Sva polja su obavezna'
      });
      setLoading(false);
      return;
    }

    // Email validacija
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus({
        type: 'error',
        message: 'Unesite ispravnu email adresu'
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri slanju poruke');
      }

      // Uspešno poslato
      setStatus({
        type: 'success',
        message: 'Poruka je uspešno poslata! Odgovorićemo Vam u najkraćem mogućem roku.',
      });

      // Reset forme
      setFormData({
        name: '',
        email: '',
        message: '',
      });

    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Došlo je do greške. Pokušajte ponovo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Pošaljite nam poruku</h2>
          <p className="text-sm text-slate-500 mt-1">
            Javite nam se, tu smo za sva vaša pitanja
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ime */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ime i prezime <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ime i prezime"
                className="pl-10 w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email adresa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="primer@email.com"
                className="pl-10 w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Poruka */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Vaša poruka <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-slate-400" />
              </div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                disabled={loading}
                rows={5}
                placeholder="Unesite vašu poruku..."
                className="pl-10 w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Submit dugme */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl p-3 text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Slanje...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Pošalji poruku</span>
              </>
            )}
          </button>

          {/* Status poruka */}
          {status.type && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              status.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                status.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {status.message}
              </p>
            </div>
          )}
        </form>

        {/* Kontakt info */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Ili nas kontaktirajte direktno na{' '}
            <a 
              href="mailto:support@autoskolasampion.com" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              support@autoskolasampion.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}