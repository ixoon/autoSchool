'use client'
import Link from "next/link"
import { useState, useEffect } from "react"
import { Car, Menu, X } from "lucide-react"
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user)
      
      if (user) {
        setLoading(true)
        try {
          // Dohvati rolu iz users kolekcije
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            setUserRole(userData.role || null)
          } else {
            setUserRole(null)
          }
        } catch (error) {
          console.error("Greška pri dohvatanju role:", error)
          setUserRole(null)
        } finally {
          setLoading(false)
        }
      } else {
        setUserRole(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Funkcija za dobijanje putanje panela na osnovu role
  const getPanelPath = () => {
    if (!userRole) return "/"
    
    switch(userRole) {
      case "superadmin":
        return "/superadmin"
      case "instruktor":
        return "/instruktor-panel"
      case "student":
        return "/student/dashboard"
      default:
        return "/"
    }
  }

  // Funkcija za dobijanje teksta dugmeta
  const getPanelText = () => {
    if (!userRole) return "Moj panel"
    
    switch(userRole) {
      case "superadmin":
        return "Admin panel"
      case "instruktor":
        return "Instruktor panel"
      case "student":
        return "Moj panel"
      default:
        return "Moj panel"
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-semibold hover:opacity-80 transition-all duration-300">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
              <Car className="h-5 w-5 text-white" size={20} />
            </div>
            <span className="text-lg sm:text-xl text-slate-800 tracking-tight">AutoŠkola Šampion</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all hover:after:w-full after:content-[''] pb-1">O Nama</Link>
            <Link href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all hover:after:w-full after:content-[''] pb-1">Cene</Link>
            <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all hover:after:w-full after:content-[''] pb-1">Kontakt</Link>
          </nav>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200">
                  Prijava
                </Link>
              </>
            ) : (
              <Link 
                href={getPanelPath()} 
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? "Učitavanje..." : getPanelText()}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button 
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-5 border-t border-slate-100 bg-white animate-fadeIn">
            <nav className="flex flex-col gap-4">
              <Link href="#features" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>O Nama</Link>
              <Link href="#pricing" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Cene</Link>
              <Link href="#contact" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Kontakt</Link>
              <div className="flex flex-col gap-3 mt-2 px-3">
                {!isLoggedIn ? (
                  <>
                    <Link href="/login" className="px-4 py-2.5 text-sm font-medium text-center text-slate-700 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>Prijava</Link>
                  </>
                ) : (
                  <Link 
                    href={getPanelPath()} 
                    className="px-5 py-3 text-sm font-semibold text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {loading ? "Učitavanje..." : getPanelText()}
                  </Link>
                )}
              </div>
            </nav>
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
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </header>
  )
}

export default Navbar