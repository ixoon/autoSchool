import React from 'react'

const Footer = () => {
  return (
    <footer className="border-t border-gray-300 bg-gray-100 p-5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-500 text-xl">
                🚙
              </div>
              <h1 className="text-xl font-semibold">AutoŠkola Šampion</h1>
            </div>
            <p className="text-gray-500 mt-4 max-w-sm">
              Vaš pouzdan partner na putu do vozačke dozvole od 2010. godine.
            </p>
          </div>

          {/* Links */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Brzi linkovi</h2>
            <ul className="space-y-2">
              {["Prijava", "Registracija", "Cenovnik"].map((item) => (
                <li
                  key={item}
                  className="text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Kategorije</h2>
            <ul className="space-y-2">
              {[
                "B kategorija – Automobil",
                "A kategorija – Motocikl",
                "C kategorija – Kamion",
                "D kategorija – Autobus",
              ].map((item) => (
                <li
                  key={item}
                  className="text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Kontakt</h2>
            <ul className="space-y-2 text-gray-500">
              <li className="hover:text-blue-500 transition-colors">📍 Gora, Dragaš, Kosovo</li>
              <li className="hover:text-blue-500 transition-colors">📞 +381 11 123 4567</li>
              <li className="hover:text-blue-500 transition-colors">📧 info@autoskola-sampion.rs</li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-400">
           {new Date().getFullYear()} AutoŠkola Šampion.
        </div>
      </div>
    </footer>
  )
}

export default Footer
