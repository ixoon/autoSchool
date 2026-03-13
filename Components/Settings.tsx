'use client';
import React, {useState, useEffect} from 'react'
import { User, Mail, Shield, Lock, Trash2, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, Info, Settings } from 'lucide-react'
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, deleteUser, onAuthStateChanged, updatePassword } from 'firebase/auth'
import { db } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore';

const SettingsPage = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("")
    const[error, setError] = useState("");
    const[message, setMessage] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setCurrentUser({
                    email: user.email,
                    uid: user.uid,
                    fullName: user.displayName,
                })
            }
        });
        return () => unsubscribe();
    }, [])

    useEffect(() => {
    const fetchUserRole = async () => {
        if (!currentUser?.uid) return;

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setCurrentUser((prev: any) => ({
                    ...prev,
                    role: userData.role || "N/A"
                }));
            } else {
                console.log("Dokument ne postoji");
                setCurrentUser((prev: any) => ({
                    ...prev,
                    role: "N/A"
                }));
            }
        } catch (err) {
            console.error("Greška pri dohvatanju role:", err);
        }
    }
    fetchUserRole();
}, [currentUser?.uid]);

    const handlePasswordChange = async () => {
        setPasswordMessage("");
        setError("");
        setMessage("");

        if(newPassword === currentPassword) {
            setPasswordMessage("Lozinka već u upotrebi.");
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

            const credential = EmailAuthProvider.credential(
                user.email!,
                currentPassword
            );

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            
            setPasswordMessage("Lozinka uspešno promenjena!");
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
                    setError("Greška pri promeni lozinke");
            }
        }
    }

    const handleDeleteAccount = async () => {
    setError("");
    setMessage("");
    setPasswordMessage("");

    const auth = getAuth();
    const user = auth.currentUser;

    if(!deleteConfirm) {
        setError("Unesite Vašu lozinku za potvrdu brisanja");
        return;
    }

    if(!user) {
        setError("Niste ulogovani");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(
            user.email!,
            deleteConfirm
        );

        await reauthenticateWithCredential(user, credential);

        const userQuery = await getDocs(collection(db, "users"));
        const userDoc = userQuery.docs.find(doc => doc.data().email === user.email);

        if(userDoc) {
            const userData = userDoc.data();
            const userRole = userData?.role;
            const userId = userDoc.id;
            
            console.log("Brišem korisnika:", { userId, userRole, userData });

            if (userRole === "instruktor") {
                const instruktorQuery = await getDocs(
                    query(collection(db, "Instruktori"), where("email", "==", user.email))
                );
                
                if (!instruktorQuery.empty) {
                    const instruktorDoc = instruktorQuery.docs[0];
                    await deleteDoc(doc(db, "Instruktori", instruktorDoc.id));
                    console.log("Instruktor obrisan iz Instruktori kolekcije");
                } else {
                    const instruktorByUidQuery = await getDocs(
                        query(collection(db, "Instruktori"), where("userId", "==", userId))
                    );
                    if (!instruktorByUidQuery.empty) {
                        const instruktorDoc = instruktorByUidQuery.docs[0];
                        await deleteDoc(doc(db, "Instruktori", instruktorDoc.id));
                        console.log("Instruktor obrisan iz Instruktori kolekcije (po userId)");
                    }
                }
            } 
            else if (userRole === "student") {
                const studentQuery = await getDocs(
                    query(collection(db, "studenti"), where("email", "==", user.email))
                );
                
                if (!studentQuery.empty) {
                    const studentDoc = studentQuery.docs[0];
                    await deleteDoc(doc(db, "studenti", studentDoc.id));
                    console.log("Student obrisan iz studenti kolekcije");
                } else {
                    const studentByUidQuery = await getDocs(
                        query(collection(db, "studenti"), where("userId", "==", userId))
                    );
                    if (!studentByUidQuery.empty) {
                        const studentDoc = studentByUidQuery.docs[0];
                        await deleteDoc(doc(db, "studenti", studentDoc.id));
                        console.log("Student obrisan iz studenti kolekcije (po userId)");
                    }
                }
            }

            await deleteDoc(doc(db, "users", userDoc.id));
            console.log("Korisnik obrisan iz users kolekcije");
        }

        await deleteUser(user);
        
        setMessage("Nalog uspešno obrisan. Preusmeravanje...");
        setTimeout(() => window.location.href = "/login", 2000);

    } catch(error: any) {
        console.error("Greška pri brisanju:", error);
        setDeleteConfirm("");
        
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
            setError("Pogrešna lozinka");
        } else if (error.code === "auth/requires-recent-login") {
            setError("Molimo ponovo se ulogujte");
        } else {
            setError("Greška pri brisanju naloga: " + (error.message || "Nepoznata greška"));
        }
    }
};
    
    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-5 sm:mb-6 md:mb-7 lg:mb-8">
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 mb-1 xs:mb-2">
                    <div className="flex-shrink-0 p-2 sm:p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-md">
                        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 break-words">Podešavanja naloga</h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-0.5 sm:mt-1">Upravljajte vašim nalogom i sigurnosnim postavkama</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
                {/* LEVA STRANA - PROFIL */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center gap-2 mb-4 sm:mb-5 md:mb-6">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Moj profil</h2>
                    </div>

                    <div className="space-y-4 sm:space-y-5 md:space-y-6">
                        {/* Avatar i osnovni podaci */}
                        <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
                            <div className="relative group flex-shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                    <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="text-center xs:text-left w-full min-w-0">
                                <p className="font-bold text-base sm:text-lg md:text-xl text-slate-800 break-words">{currentUser?.fullName || "Korisnik"}</p>
                                <p className="text-xs sm:text-sm md:text-base text-slate-600 flex items-center gap-1.5 justify-center xs:justify-start mt-0.5 sm:mt-1 break-all">
                                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="truncate">{currentUser?.email}</span>
                                </p>
                                <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-medium rounded-full shadow-sm">
                                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                    <span className="capitalize">{currentUser?.role || "Korisnik"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Detalji profila */}
                        <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
                            <div className="flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-3.5 md:p-4 border border-slate-200 rounded-lg sm:rounded-xl hover:border-blue-200 transition-colors group gap-2 xs:gap-0">
                                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0 p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-slate-500">Email adresa</p>
                                        <p className="text-xs sm:text-sm md:text-base font-medium text-slate-800 truncate">{currentUser?.email}</p>
                                    </div>
                                </div>
                                <span className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">Verifikovan</span>
                            </div>

                            <div className="flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-3.5 md:p-4 border border-slate-200 rounded-lg sm:rounded-xl hover:border-blue-200 transition-colors group gap-2 xs:gap-0">
                                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0 p-1.5 sm:p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-slate-500">Uloga u sistemu</p>
                                        <p className="text-xs sm:text-sm md:text-base font-medium text-slate-800 capitalize truncate">{currentUser?.role || "N/A"}</p>
                                    </div>
                                </div>
                                <span className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">Aktivna</span>
                            </div>
                        </div>

                        {/* Info kartica */}
                        <div className="p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl border border-amber-200">
                            <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-amber-800">Sigurnosni savet</p>
                                    <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1">
                                        Redovno menjajte lozinku i ne delite je sa drugima. Koristite jake lozinke.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESNA STRANA - SIGURNOST */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 xl:space-y-8">
                    {/* PROMENA LOZINKE */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-2 mb-4 sm:mb-5 md:mb-6">
                            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Promena lozinke</h2>
                        </div>

                        <div className="space-y-4 sm:space-y-4.5 md:space-y-5">
                            {/* Trenutna lozinka */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 md:mb-2">
                                    Trenutna lozinka
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                                    </div>
                                    <input 
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="pl-8 sm:pl-10 pr-8 sm:pr-12 w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Nova lozinka */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 md:mb-2">
                                    Nova lozinka
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                                    </div>
                                    <input 
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-8 sm:pl-10 pr-8 sm:pr-12 w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Potvrda lozinke */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 md:mb-2">
                                    Potvrdite novu lozinku
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                                    </div>
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-8 sm:pl-10 pr-8 sm:pr-12 w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password strength indicator */}
                            {newPassword && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    <div className="flex gap-1 h-1">
                                        <div className={`flex-1 rounded-full transition-all duration-300 ${
                                            newPassword.length >= 6 ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                        <div className={`flex-1 rounded-full transition-all duration-300 ${
                                            /[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                        <div className={`flex-1 rounded-full transition-all duration-300 ${
                                            /[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                        <div className={`flex-1 rounded-full transition-all duration-300 ${
                                            /[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-slate-500">
                                        Koristite najmanje 6 karaktera, veliko slovo, broj i specijalni karakter
                                    </p>
                                </div>
                            )}

                            <button 
                                onClick={handlePasswordChange}
                                disabled={!currentPassword || !newPassword || !confirmPassword}
                                className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                                    currentPassword && newPassword && confirmPassword 
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Promeni lozinku</span>
                            </button>

                            {passwordMessage && (
                                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex items-start gap-1.5 sm:gap-2 ${
                                    passwordMessage.includes("uspešno") 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {passwordMessage.includes("uspešno") ? (
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    )}
                                    <p className="text-xs sm:text-sm">{passwordMessage}</p>
                                </div>
                            )}

                            <a href="/forgot-password" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition block text-center">
                                Zaboravili ste lozinku?
                            </a>
                        </div>
                    </div>

                    {/* BRISANJE NALOGA */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-red-200 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-2 mb-4 sm:mb-5 md:mb-6">
                            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg">
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Brisanje naloga</h2>
                        </div>

                        <div className="space-y-4 sm:space-y-4.5 md:space-y-5">
                            <div className="p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg sm:rounded-xl">
                                <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-red-700">⚠️ Upozorenje: Ova akcija je nepovratna</p>
                                        <p className="text-[10px] sm:text-xs text-red-600 mt-0.5 sm:mt-1">
                                            Brisanjem naloga ćete izgubiti pristup svim podacima i funkcijama sistema.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 md:mb-2">
                                    Unesite vašu lozinku za potvrdu
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                                    </div>
                                    <input 
                                        type={showDeletePassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="pl-8 sm:pl-10 pr-8 sm:pr-12 w-full border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                                    >
                                        {showDeletePassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleDeleteAccount}
                                disabled={!deleteConfirm}
                                className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                                    deleteConfirm 
                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Obriši nalog</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* GLOBALNE PORUKE */}
            {message && (
                <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3 animate-fadeIn">
                    <div className="p-0.5 sm:p-1 bg-green-100 rounded-full">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <p className="text-xs sm:text-sm text-green-700 font-medium">{message}</p>
                </div>
            )}

            {error && (
                <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3 animate-fadeIn">
                    <div className="p-0.5 sm:p-1 bg-red-100 rounded-full">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

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
                    animation: fadeIn 0.3s ease-out;
                }
                
                /* Custom breakpoint za vrlo male ekrane */
                @media (min-width: 480px) {
                    .xs\\:flex-row {
                        flex-direction: row;
                    }
                    .xs\\:items-center {
                        align-items: center;
                    }
                    .xs\\:items-start {
                        align-items: flex-start;
                    }
                    .xs\\:text-left {
                        text-align: left;
                    }
                    .xs\\:justify-start {
                        justify-content: flex-start;
                    }
                }
            `}</style>
        </div>
    )
}

export default SettingsPage;