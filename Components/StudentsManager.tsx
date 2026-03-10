import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore"
import { db } from "../lib/firebase"
import { 
  Users, User, Mail, Trash2, Loader2, AlertCircle, 
  School, Calendar, Search, Filter, ChevronRight, X
} from "lucide-react"
import Link from "next/link"

type Student = {
  id: string
  fullName: string
  email: string
  instruktorId?: string
  autoSkolaId?: string
  createdAt?: any
}

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "studenti"))
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[]
      setStudents(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const deleteStudent = async (student: Student) => {
    try {
      // obriši iz studenti
      await deleteDoc(doc(db, "studenti", student.id))

      // pronađi user dokument
      const q = query(
        collection(db, "users"),
        where("email", "==", student.email)
      )

      const userSnap = await getDocs(q)

      userSnap.forEach(async (userDoc) => {
        await deleteDoc(doc(db, "users", userDoc.id))
      })

      setStudents(prev => prev.filter(s => s.id !== student.id))
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
      alert("Greška pri brisanju.")
    }
  }

  // Filtriranje studenata
  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 opacity-50" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Učitavanje studenata...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Lista studenata</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Pregled i upravljanje studentima u sistemu
            </p>
          </div>
        </div>

        {/* Statistika */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Ukupno studenata</p>
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
          </div>
        </div>
      </div>

      {/* Pretraga */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Pretraži studente po imenu ili emailu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Lista studenata */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? "Nema rezultata pretrage" : "Nema studenata"}
          </h3>
          <p className="text-slate-500">
            {searchTerm 
              ? "Pokušajte sa drugim ključnim rečima" 
              : "Još uvek nema registrovanih studenata u sistemu"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Leva strana - info (klik otvara profil) */}
                  <Link
                    href={`/user/${student.id}`}
                    className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {student.fullName}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm break-all">{student.email}</span>
                        </div>
                        
                        {student.instruktorId && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <School className="w-4 h-4" />
                            <span className="text-sm">Instruktor ID: {student.instruktorId.slice(-6)}</span>
                          </div>
                        )}
                      </div>

                      {student.createdAt && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Dodat: {new Date(student.createdAt.seconds * 1000).toLocaleDateString('sr-RS')}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Desna strana - akcije */}
                  <div className="flex items-center gap-2 sm:pl-4">
                    {deleteConfirm === student.id ? (
                      <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg">
                        <button
                          onClick={() => deleteStudent(student)}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Potvrdi
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Otkaži
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(student.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors group/btn"
                      >
                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Obriši</span>
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Napomena */}
      <div className="mt-8 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              ⚠️ Važna napomena
            </p>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              Nakon brisanja studenta iz baze potrebno je ručno obrisati korisnika iz{" "}
              <span className="font-semibold">Firebase Authentication</span> panela.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}