import React from 'react'
import { Car, MapPin, Phone, Mail, ArrowRight } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gradient-to-b from-slate-50 to-white border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Glavni grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand - wider on desktop */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">AutoŠkola Šampion</h1>
            </div>
            <p className="text-slate-600 mt-4 leading-relaxed">
              Vaš pouzdan partner na putu do vozačke dozvole od 2010. godine. 
              Preko 5000 zadovoljnih polaznika.
            </p>
            
            {/* Social media ili dodatni CTA */}
            <div className="mt-6">
              <button className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group">
                Više o nama
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Brzi linkovi */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Brzi linkovi</h2>
            <ul className="space-y-3">
              {["Prijava", "Registracija", "Cenovnik", "O nama", "Kontakt"].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-slate-600 hover:text-blue-600 transition-colors duration-200 inline-block"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kategorije */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Kategorije</h2>
            <ul className="space-y-3">
              {[
                { name: "B kategorija – Automobil", badge: "Najtraženija" },
                { name: "A kategorija – Motocikl", badge: null },
                { name: "C kategorija – Kamion", badge: "Profesionalno" },
                { name: "D kategorija – Autobus", badge: null },
              ].map((item) => (
                <li key={item.name} className="flex items-center gap-2">
                  <a 
                    href="#" 
                    className="text-slate-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Kontakt</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="hover:text-blue-600 transition-colors">Gora, Dragaš, Kosovo</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <a href="tel:+3810691211015" className="hover:text-blue-600 transition-colors">
                  +381 069 1211 015
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <a href="mailto:support@autoskolasampion.com" className="hover:text-blue-600 transition-colors">
                  support@autoskolasampion.com
                </a>
              </li>
            </ul>
            
            {/* Radno vreme */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-medium text-blue-800">Radno vreme:</p>
              <p className="text-sm text-blue-600 mt-1">Ponedeljak - Petak: 08:00 - 20:00</p>
              <p className="text-sm text-blue-600">Subota: 09:00 - 15:00</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
               {currentYear} AutoŠkola Šampion.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
                Politika privatnosti
              </a>
              <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
                Uslovi korišćenja
              </a>
              <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer