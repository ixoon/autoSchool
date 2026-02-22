'use client'
import Link from "next/link"
import { useState, useEffect } from "react"
import { Car, Menu, X } from "lucide-react"
import { auth } from "@/config/firebase"
import { onAuthStateChanged } from "firebase/auth"

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
              <Car className="h-5 w-5 text-white" size={20} />
            </div>
            <span className="text-lg">AutoŠkola Šampion</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">O Nama</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Cene</Link>
            <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Kontakt</Link>
          </nav>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md transition-colors border border-gray-200 hover:bg-gray-100">
                  Prijava
                </Link>
                {/* Registracija dugme je uklonjeno */}
              </>
            ) : (
              <Link href="/student" className="px-4 py-2 text-sm font-bold bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors">
                Moj panel
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button 
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t bg-white shadow-sm">
            <nav className="flex flex-col gap-4">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>O Nama</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Cene</Link>
              <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Kontakt</Link>
              <div className="flex flex-col gap-3 mt-2">
                {!isLoggedIn ? (
                  <>
                    <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>Prijava</Link>
                    {/* Registracija dugme je uklonjeno */}
                  </>
                ) : (
                  <Link href="/student" className="px-4 py-2 text-sm font-bold bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>Moj panel</Link>
                )}
              </div>
            </nav>
          </div>
        )}

      </div>
    </header>
  )
}

export default Navbar