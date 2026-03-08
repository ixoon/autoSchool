'use client';

import Protected from "../../Components/Protected";
import { deleteUser, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { addDoc, collection, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { 
  CarFront, Settings, Users, Car, School, UsersRound, User, Lock, Trash2, 
  Mail, Shield, KeyRound, LogOut, LayoutDashboard, FileText, PlusCircle, 
  ChevronRight, Menu, X, Bell, Home, Award, BookOpen 
} from "lucide-react";
import { useEffect, useState } from "react";
import TestCreator from "../../Components/TestCreator";
import { useRouter } from "next/navigation";
import SendInvite from "../../Components/SendInvite";
import TestsList from "../../Components/TestsList";
import StudentsManager from "@/Components/StudentsManager";

const Page = () => {
    const router = useRouter();

    // ========== STATE VARIJABLE ==========
    // Autoškole
    const [nazivSkole, setNazivSkole] = useState("");
    const [mesto, setMesto] = useState("");
    const [autoSkole, setAutoSkole] = useState<{id: string, naziv: string, mesto: string}[]>([]);

    // Instruktori
    const [instruktori, setInstruktori] = useState<{id: string, fullName: string, email: string, godine: number, autoSkolaId: string}[]>([]);

    // Studenti
    const [studenti, setStudenti] = useState<any[]>([]);
    const [studentError, setStudentError] = useState("");

    // Korisnici
    const [users, setUsers] = useState<{id: string, fullName: string, email: string, role: string, instruktorID: string}[]>([]);
    const [userError, setUserError] = useState("");

    // UI State
    const [activeSection, setActiveSection] = useState<"Glavna" | "Testovi" | "Podesavanja">("Glavna");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    
    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    // Delete Account State
    const [deleteConfirm, setDeleteConfirm] = useState("");

    // Current User
    const [currentUser, setCurrentUser] = useState<any>(null);

    // ========== USE EFFECTS ==========
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setCurrentUser({
                    email: user.email,
                    uid: user.uid,
                    fullName: user.displayName
                });
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchAutoSkole = async () => {
            try {
                const snapshot = await getDocs(collection(db, "AutoSkole"));
                setAutoSkole(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as {id: string, naziv: string, mesto: string}[]);
            } catch(err) {
                console.log("Greska pri ucitavanju autoskola:", err);
            }
        };
        fetchAutoSkole();
    }, []);

    useEffect(() => {
        const fetchInstruktori = async () => {
            try {
                const snapshot = await getDocs(collection(db, "Instruktori"));
                const instruktoriData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as { fullName: string; email: string; godine: number; autoSkolaId: string })
                }));
                setInstruktori(instruktoriData);
            } catch(err) {
                setError("Greska pri ucitavanju instruktora: " + err);
            }
        };
        fetchInstruktori();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const snapshot = await getDocs(collection(db, "studenti"));
                const studentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudenti(studentsData);
            } catch(err) {
                setStudentError("Greska pri ucitavanju studenata:" + err);
            }
        };
        fetchStudents();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, "users"));
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as {fullName: string, email: string, role: string, instruktorID: string})
                }));
                setUsers(users);
            } catch (err) {
                setUserError("Greska prilikom ucitavanja korisnika" + err);
            }
        };
        fetchUsers();
    }, []);

    // ========== HELPER FUNKCIJE ==========
    const getAutoSkolaNaziv = (id: string) => {
        const skola = autoSkole.find(s => s.id === id);
        return skola ? skola.naziv : "Nepoznato";
    };

    const getInstruktorIme = (id: string) => {
        const instruktor = instruktori.find(i => i.id === id);
        return instruktor ? instruktor.fullName : "Nepoznato";
    };

    // ========== HANDLER FUNKCIJE ==========
    const handleAutoSkolaAdd = async () => {
        try {
            const docRef = await addDoc(collection(db, "AutoSkole"), {
                naziv: nazivSkole,
                mesto: mesto,
                createdAt: serverTimestamp()
            });
            setMessage("Uspešno ste dodali novu autoškolu!");
            setNazivSkole("");
            setMesto("");   
            setAutoSkole(prev => [...prev, {id: docRef.id, naziv: nazivSkole, mesto}]);
        } catch(error) {
            setError("Greska prilikom dodavanja autoskole. Pokušajte ponovo. " + error);
        }
    };

    const handlePasswordChange = async () => {
        if(newPassword == currentPassword) {
            setPasswordMessage("Lozinka vec u upotrebi.");
            return;
        }
        if(newPassword !== confirmPassword) {
            setPasswordMessage("Lozinke se ne poklapaju");
            return;
        }
        if(newPassword.length < 6) {
            setPasswordMessage("Lozinka mora imati najmanje 6 karaktera");
            return;
        }

        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if(!user) {
                setError("Niste ulogovani");
                return;
            }
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setPasswordMessage("Lozinka uspesno promenjena!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch(error: any) {
            console.error(error);
            switch(error.code) {
                case "auth/wrong-password":
                    setError("Trenutna lozinka nije tačna");
                    break;
                case "auth/weak-password":
                    setError("Lozinka je previše slaba. Koristite najmanje 6 karaktera");
                    break;
                case "auth/requires-recent-login":
                    setError("Molimo vas da se ponovo ulogujete pre promene lozinke");
                    break;
                default:
                    setError("Greška pri promeni lozinke: " + error.message);
            }
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setError("");
            setMessage("");
            const auth = getAuth();
            const user = auth.currentUser!;
            if(!deleteConfirm) {
                setError("Unesite Vasu lozinku za potvrdu brisanja");
                return;
            }
            const credential = EmailAuthProvider.credential(user.email!, deleteConfirm);
            await reauthenticateWithCredential(user, credential);
            const userQuery = await getDocs(collection(db, "users"));
            const userDoc = userQuery.docs.find(doc => doc.data().email === user.email);
            if(userDoc){
                await deleteDoc(doc(db, "users", userDoc.id));
            }
            await deleteUser(user);
            setMessage("Nalog uspesno obrisan. Preusmeravanje...");
            setTimeout(() => window.location.href = "/login", 2000);
        } catch(error: any) {
            console.error(error);
            setDeleteConfirm("");
            if (error.code === "auth/invalid-credential") {
                setError("Pogrešna lozinka");
            } else if (error.code === "auth/requires-recent-login") {
                setError("Molimo ponovo se ulogujte");
            } else {
                setError("Greška pri brisanju naloga" + error);
            }
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // ========== RENDER FUNKCIJE ==========
    const renderStatsCards = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-4 sm:mt-6 lg:mt-10">
            <div className="bg-white shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700">Ukupno autoškola</h1>
                    <School className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white" />
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3 lg:mt-4 text-slate-800">{autoSkole.length}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">Aktivne autoškole</p>
            </div>
            <div className="bg-white shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-green-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700">Ukupno studenata</h1>
                    <UsersRound className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white" />
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3 lg:mt-4 text-slate-800">{studenti.length}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">Aktivni studenti</p>
            </div>
            <div className="bg-white shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-purple-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700">Ukupno instruktora</h1>
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white" />
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3 lg:mt-4 text-slate-800">{instruktori.length}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">Aktivni instruktori</p>
            </div>
            <div className="bg-white shadow-lg border border-slate-200 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-amber-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700">Ukupno korisnika</h1>
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white" />
                </div>
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl mt-2 sm:mt-3 lg:mt-4 text-slate-800">{users.length}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">Registrovani korisnici</p>
            </div>
        </div>
    );

    const renderAutoSkoleSection = () => (
        <div className="mt-8 sm:mt-10 lg:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Autoškole</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Sve autoškole</h2>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit">
                            {autoSkole.length} autoškola
                        </span>
                    </div>
                    {autoSkole.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 lg:py-10">
                            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <School className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                            </div>
                            <p className="text-base sm:text-lg text-slate-500">Nema unetih autoškola</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">Dodajte prvu autoškolu</p>
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
                            {autoSkole.map((skola, index) => (
                                <div key={skola.id} className="group flex items-center justify-between border border-slate-200 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base shadow-md">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-700">{skola.naziv}</p>
                                            <p className="text-xs sm:text-sm text-slate-600">{skola.mesto}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Dodaj novu autoškolu</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Unesite podatke o novoj autoškoli</p>
                    <div className="space-y-3 sm:space-y-4">
                        <input type="text" placeholder="Unesite naziv autoškole" value={nazivSkole} onChange={(e) => setNazivSkole(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"/>
                        <input type="text" placeholder="Unesite mesto" value={mesto} onChange={(e) => setMesto(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"/>
                        <button onClick={handleAutoSkolaAdd} disabled={!nazivSkole.trim() || !mesto.trim()} className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${nazivSkole.trim() && mesto.trim() ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            Dodaj autoškolu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInstruktoriSection = () => (
        <div className="mt-8 sm:mt-10 lg:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Instruktori</h2>
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Svi instruktori</h2>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit">
                        {instruktori.length} instruktora
                    </span>
                </div>
                {instruktori.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 lg:py-10">
                        <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-slate-400 mb-4" />
                        <p className="text-base sm:text-lg text-slate-500">Nema unetih instruktora</p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
                        {instruktori.map((instruktor, index) => (
                            <div key={instruktor.id} className="border border-slate-200 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center font-semibold text-sm sm:text-base shadow-md">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm sm:text-base text-slate-800 truncate">{instruktor.fullName}</p>
                                        <p className="text-xs sm:text-sm text-slate-600 truncate">{instruktor.email} • {instruktor.godine} god.</p>
                                        <span className="text-[10px] sm:text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {getAutoSkolaNaziv(instruktor.autoSkolaId)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStudentiSection = () => (
        <div className="mt-8 sm:mt-10 lg:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Studenti</h2>
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Svi studenti</h2>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full w-fit">
                        {studenti.length} studenata
                    </span>
                </div>
                {studenti.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 lg:py-10">
                        <UsersRound className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-slate-400 mb-4" />
                        <p className="text-base sm:text-lg text-slate-500">Nema unetih studenata</p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
                        {studenti.map((student, index) => (
                            <div key={student.id} className="border border-slate-200 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center font-semibold text-sm sm:text-base shadow-md">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm sm:text-base text-slate-800 truncate">{student.fullName}</p>
                                        <p className="text-xs sm:text-sm text-slate-600 truncate">{student.email}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className="text-[10px] sm:text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                {getAutoSkolaNaziv(student.autoSkolaId)}
                                            </span>
                                            <span className="text-[10px] sm:text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full">
                                                {getInstruktorIme(student.instruktorId)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderMessages = () => (
        <>
            {message && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl">
                    <p className="text-sm sm:text-base text-green-700 font-medium">{message}</p>
                </div>
            )}
            {error && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg sm:rounded-xl">
                    <p className="text-sm sm:text-base text-red-700 font-medium">{error}</p>
                </div>
            )}
        </>
    );

    const renderContent = () => {
        switch(activeSection) {
            case "Glavna":
                return (
                    <div>
                        
                        <div className="mb-4 sm:mb-6 lg:mb-8">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Super Admin Panel</h1>
                            <p className="text-base sm:text-lg lg:text-xl text-slate-500 mt-1">Upravljajte svim autoškolama u sistemu</p>
                        </div>
                        {renderStatsCards()}
                        
                            <div>
                                <StudentsManager />
                            </div>
                        <div className="mt-6 sm:mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                                <SendInvite/>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                                <TestsList />
                            </div>
                        </div>
                        
                        {renderAutoSkoleSection()}
                        {renderInstruktoriSection()}
                        {renderStudentiSection()}
                    </div>
                );
            case "Testovi":
                return (
                    <div>
                        <div className="mb-4 sm:mb-6 lg:mb-8">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Kreiranje testova</h1>
                            <p className="text-base sm:text-lg lg:text-xl text-slate-500 mt-1">Napravite nove testove za polaznike</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                            <TestCreator/>
                        </div>
                    </div>
                );
            case "Podesavanja":
                return (
                    <div>
                        <div className="mb-4 sm:mb-6 lg:mb-8">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Podešavanja naloga</h1>
                            <p className="text-base sm:text-lg lg:text-xl text-slate-500 mt-1">Upravljajte vašim nalogom i sigurnosnim postavkama</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Moj profil</h2>
                                    <User className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white" />
                                </div>
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="font-semibold text-base sm:text-lg lg:text-xl text-slate-800">{currentUser?.fullName || 'Admin'}</p>
                                            <p className="text-xs sm:text-sm text-slate-600 break-all">{currentUser?.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 border border-slate-200 rounded-lg sm:rounded-xl gap-2 sm:gap-0">
                                            <div className="flex items-center gap-2 sm:w-1/3">
                                                <Mail className="w-4 h-4 text-blue-600" />
                                                <p className="text-xs sm:text-sm text-slate-500">Email</p>
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-slate-800 sm:w-2/3 break-all">{currentUser?.email}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 border border-slate-200 rounded-lg sm:rounded-xl gap-2 sm:gap-0">
                                            <div className="flex items-center gap-2 sm:w-1/3">
                                                <Shield className="w-4 h-4 text-purple-600" />
                                                <p className="text-xs sm:text-sm text-slate-500">Uloga</p>
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-slate-800 sm:w-2/3">Super Admin</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                                <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Promena lozinke</h2>
                                        <Lock className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white" />
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <input type="password" placeholder="Trenutna lozinka" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"/>
                                        <input type="password" placeholder="Nova lozinka" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"/>
                                        <input type="password" placeholder="Potvrdite novu lozinku" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"/>
                                        <button onClick={handlePasswordChange} disabled={!currentPassword || !newPassword || !confirmPassword} className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${currentPassword && newPassword && confirmPassword ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                                            Promeni lozinku
                                        </button>
                                        {passwordMessage && <p className="text-green-600 text-xs sm:text-sm mt-2">{passwordMessage}</p>}
                                    </div>
                                </div>

                                <div className="bg-white border border-red-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Brisanje naloga</h2>
                                        <Trash2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white" />
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg sm:rounded-xl">
                                            <p className="text-red-700 font-medium text-xs sm:text-sm">⚠️ Upozorenje: Ova akcija je nepovratna</p>
                                        </div>
                                        <input type="password" placeholder="Unesite lozinku za potvrdu" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full border border-slate-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"/>
                                        <button onClick={handleDeleteAccount} disabled={!deleteConfirm} className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${deleteConfirm ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                                            Obriši nalog
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {renderMessages()}
                    </div>
                );
        }
    };

    // ========== GLAVNI RETURN ==========
    return (
        <Protected allowedRoles={["superadmin"]}>
            <div className="min-h-screen bg-slate-50">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b border-slate-200 p-3 sm:p-4 sticky top-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h1 className="font-bold text-base sm:text-lg text-slate-800">AutoŠkola Šampion</h1>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                        <div className="absolute left-0 top-0 h-full w-64 sm:w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                                        <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h1 className="font-bold text-sm sm:text-base text-slate-800">AutoŠkola Šampion</h1>
                                </div>
                                
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium uppercase">Super Admin</p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{currentUser?.email}</p>
                                </div>
                                
                                <nav className="space-y-1 sm:space-y-2">
                                    <button onClick={() => { setActiveSection("Glavna"); setMobileMenuOpen(false); }} className={`flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200 ${activeSection === 'Glavna' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}>
                                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Početna</span>
                                    </button>
                                    
                                    <button onClick={() => { setActiveSection("Testovi"); setMobileMenuOpen(false); }} className={`flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200 ${activeSection === 'Testovi' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}>
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Novi Test</span>
                                    </button>
                                    
                                    <button onClick={() => { setActiveSection("Podesavanja"); setMobileMenuOpen(false); }} className={`flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200 ${activeSection === 'Podesavanja' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}>
                                        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Podešavanja</span>
                                    </button>
                                    
                                    <div className="border-t border-slate-200 my-3 sm:my-4"></div>
                                    
                                    <button onClick={logout} className='flex items-center gap-2 sm:gap-3 w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200'>
                                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Odjavite se</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Sidebar */}
                <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 xl:w-72 bg-white border-r border-slate-200 shadow-lg">
                    <div className="p-5 xl:p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 xl:gap-3 mb-5 xl:mb-6">
                            <div className="flex h-10 w-10 xl:h-12 xl:w-12 items-center justify-center rounded-lg xl:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                                <Car className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
                            </div>
                            <h1 className="font-bold text-base xl:text-xl text-slate-800">AutoŠkola Šampion</h1>
                        </div>
                        
                        <div className="p-3 xl:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg xl:rounded-xl mb-5 xl:mb-6 border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium uppercase">Super Admin</p>
                            <p className="text-xs xl:text-sm font-semibold text-slate-800 truncate">{currentUser?.email}</p>
                        </div>
                        
                        <nav className="flex-1 space-y-1 xl:space-y-2">
                            <button onClick={() => setActiveSection("Glavna")} className={`flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base transition-all duration-200 ${activeSection === 'Glavna' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50'}`}>
                                <LayoutDashboard className="w-4 h-4 xl:w-5 xl:h-5" />
                                <span className="font-medium">Početna</span>
                            </button>
                            
                            <button onClick={() => setActiveSection("Testovi")} className={`flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base transition-all duration-200 ${activeSection === 'Testovi' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50'}`}>
                                <FileText className="w-4 h-4 xl:w-5 xl:h-5" />
                                <span className="font-medium">Novi Test</span>
                            </button>
                            
                            <button onClick={() => setActiveSection("Podesavanja")} className={`flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base transition-all duration-200 ${activeSection === 'Podesavanja' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50'}`}>
                                <Settings className="w-4 h-4 xl:w-5 xl:h-5" />
                                <span className="font-medium">Podešavanja</span>
                            </button>
                            
                            <div className="border-t border-slate-200 my-3 xl:my-4"></div>
                            
                            <button onClick={logout} className='flex items-center gap-2 xl:gap-3 w-full text-left p-2 xl:p-3 rounded-lg xl:rounded-xl text-sm xl:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg'>
                                <LogOut className="w-4 h-4 xl:w-5 xl:h-5" />
                                <span className="font-medium">Odjavite se</span>
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:ml-64 xl:ml-72">
                    <div className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Stil za skrolbar */}
            <style jsx global>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                @media (min-width: 640px) {
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }
                }
            `}</style>
        </Protected>
    );
};

export default Page;