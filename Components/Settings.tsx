'use client';
import React, {useState, useEffect} from 'react'
import { User, Mail, Shield, Lock, Trash2, KeyRound } from 'lucide-react'
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, deleteUser, onAuthStateChanged, updatePassword } from 'firebase/auth'
import { db } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("")
    const[error, setError] = useState("");
    const[message, setMessage] = useState("");

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setCurrentUser({
                    email: user.email,
                    uid: user.uid,
                    fullName: user.displayName
                })
            }
        });
        return () => unsubscribe();
    }, [])

    const handlePasswordChange = async () => {
        // Resetuj SVE poruke
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
        // Resetuj SVE poruke
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

            if(userDoc){
                await deleteDoc(doc(db, "users", userDoc.id));
            }

            await deleteUser(user);
            setMessage("Nalog uspešno obrisan. Preusmeravanje...");
            setTimeout(() => window.location.href = "/login", 2000);

        } catch(error: any) {
            console.error(error);
            setDeleteConfirm("");
            
            if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
                setError("Pogrešna lozinka");
            } else if (error.code === "auth/requires-recent-login") {
                setError("Molimo ponovo se ulogujte");
            } else {
                setError("Greška pri brisanju naloga");
            }
        }
    };
    
    return (
        <div>
            <div>
                <h1 className="text-3xl font-bold">Podešavanja naloga</h1>
                <p className="text-xl text-gray-500 mt-1">Upravljajte vašim nalogom i sigurnosnim postavkama</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                {/* LEVA STRANA - PROFIL */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Moj profil</h2>
                        <User className="h-10 w-10 p-2 rounded-lg bg-blue-100 text-blue-600" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-lg">{currentUser?.fullName || "Korisnik"}</p>
                                <p className="text-gray-600">{currentUser?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email adresa</p>
                                        <p className="font-medium">{currentUser?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Shield className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Uloga</p>
                                        <div className="flex items-center space-x-2">
                                            <p className="font-medium">Instruktor</p>
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Instruktor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESNA STRANA - SIGURNOST */}
                <div className="space-y-8">
                    {/* PROMENA LOZINKE */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Promena lozinke</h2>
                            <Lock className="h-10 w-10 p-2 rounded-lg bg-green-100 text-green-600" />
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Trenutna lozinka</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="Unesite trenutnu lozinku" 
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nova lozinka</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="Unesite novu lozinku" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Potvrdite novu lozinku</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="Ponovite novu lozinku" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handlePasswordChange}
                                disabled={!currentPassword || !newPassword || !confirmPassword}
                                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${
                                    currentPassword && newPassword && confirmPassword 
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Lock className="w-5 h-5" />
                                <span>Promeni lozinku</span>
                            </button>

                            {passwordMessage && (
                                <div className={`text-sm p-3 rounded-lg ${
                                    passwordMessage.includes("uspešno") 
                                        ? 'text-green-600 bg-green-50' 
                                        : 'text-red-600 bg-red-50'
                                }`}>
                                    {passwordMessage}
                                </div>
                            )}

                            <a href="/forgot-password" className="text-md text-blue-600 hover:text-blue-800 underline underline-offset-2 transition block mt-2">
                                Zaboravili ste lozinku?
                            </a>
                        </div>
                    </div>

                    {/* BRISANJE NALOGA */}
                    <div className="bg-white border border-red-200 rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Brisanje naloga</h2>
                            <Trash2 className="h-10 w-10 p-2 rounded-lg bg-red-100 text-red-600" />
                        </div>

                        <div className="space-y-5">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 font-medium">⚠️ Upozorenje: Ova akcija je nepovratna</p>
                                <p className="text-red-600 text-sm mt-1">
                                    Brisanjem naloga ćete izgubiti pristup svim podacima i funkcijama sistema.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unesite vašu lozinku za: <span className="font-bold">{currentUser?.email}</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="Unesite lozinku"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleDeleteAccount}
                                disabled={!deleteConfirm}
                                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${
                                    deleteConfirm 
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Obriši nalog</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* GLOBALNE PORUKE - SAMO ZA BRISANJE NALOGA */}
            {message && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-green-700 font-medium">{message}</p>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}
        </div>
    )
}

export default Settings;