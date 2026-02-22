'use client';

import Protected from "../../Components/Protected";
import { deleteUser, EmailAuthCredential, EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signOut, updatePassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { CarFront, Settings, Users, Car, School, UsersRound, Bell, User, Lock, Trash2, Mail, Shield, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import TestCreator from "../../Components/TestCreator";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config/firebase";
import SendInvite from "../../Components/SendInvite";
import TestsList from "../../Components/TestsList";


const page = () => {
    const router = useRouter();

    const [nazivSkole, setNazivSkole] = useState("");
    const [mesto, setMesto] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [autoSkole, setAutoSkole] = useState<{id: string, naziv: string, mesto: string}[]>([]);

    const [imePrezime, setImePrezime] = useState("");
    const [email, setEmail] = useState("");
    const [godine, setGodine] = useState("");
    const [autoSkolaId, setAutoSkolaId] = useState("");
    const [instruktori, setInstruktori] = useState<{id: string, fullName: string, email: string, godine: number, autoSkolaId: string}[]>([]);

    const [studentImePrezime, setStudentImePrezime] = useState("");
    const [studentEmail, setStudentEmail] = useState("");
    const [studentAutoSkolaId, setStudentAutoSkolaId] = useState("");
    const [studentInstruktorId, setStudentInstruktorId] = useState("");
    const [studenti, setStudenti] = useState<any[]>([]);
    const [studentError, setStudentError] = useState("");

    const [users, setUsers] = useState<{id: string, fullName: string, email: string, role: string, instruktorID: string}[]>([])
    const [userError, setUserError] = useState("");

    const [activeSection, setActiveSection] = useState<"Glavna" | "Testovi" | "Podesavanja">("Glavna")
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("")

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
        }
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
                setError("Greska pri ucitavanju instruktora: " + err)
            }
        }
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
                setStudentError("Greska pri ucitavanju studenata:" + err)
            }
        }
        fetchStudents();
    }, [])

    

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, "users"));
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as {fullName: string, email: string, role: string, instruktorID: string})
            }))
            setUsers(users)

            } catch (err) {
                setUserError("Greska prilikom ucitavanja korisnika" + err)
            }
        }
        fetchUsers();
    }, [])

    const handlePasswordChange = async () => {

        if(newPassword == currentPassword) {
            setPasswordMessage("Lozinka vec u upotrebi.")
            return;
        }

        if(newPassword !== confirmPassword) {
            setPasswordMessage("Lozinke se ne poklapaju")
            return;
        }
        if(newPassword.length < 6) {
            setPasswordMessage("Lozinka mora imati najmanje 6 karaktera")
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
            )

            await reauthenticateWithCredential(user, credential)

            await updatePassword(user, newPassword);
            setPasswordMessage("Lozinka uspesno promenjena!")

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch(error: any) {
            console.error(error)
            //Specificne greske
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
    }

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
            setError("Greska prilikom dodavanja autoskole. Pokušajte ponovo. " + error)
        }
    }

    const handleInstruktorAdd = async () => {
        try {
            const docRef = await addDoc(collection(db, "Instruktori"), {
                fullName: imePrezime,
                email: email,
                godine: Number(godine),
                createdAt: serverTimestamp(),
                autoSkolaId: autoSkolaId
            });
            setMessage("Uspešno ste dodali novog instruktora!");
            setImePrezime("");
            setEmail("");
            setGodine("");
            setAutoSkolaId("");
            setInstruktori(prev => [...prev, {id: docRef.id, fullName: imePrezime, email, godine: Number(godine), autoSkolaId}]);
        } catch(error) {
            setError("Greska prilikom dodavanja instruktora. Pokušajte ponovo. " + error)
        }
    }

    const handleStudentAdd = async () => {
        try {
            const docRef = await addDoc(collection(db, "studenti"), {
                fullName: studentImePrezime,
                email: studentEmail,
                autoSkolaId: studentAutoSkolaId,
                instruktorId: studentInstruktorId,
                createdAt: serverTimestamp()
            });
            setMessage("Uspešno ste dodali novog studenta!");
            setStudentImePrezime("");
            setStudentEmail("");
            setStudentAutoSkolaId("");
            setStudentInstruktorId("");
            setStudenti(prev => [...prev, {id: docRef.id, fullName: studentImePrezime, email: studentEmail, autoSkolaId: studentAutoSkolaId, instruktorId: studentInstruktorId}]);
        } catch(error) {
            setError("Greska prilikom dodavanja studenta. Pokušajte ponovo. " + error)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            setError("");
        setMessage("");

        const auth = getAuth();
        const user = auth.currentUser!;

        if(!deleteConfirm) {
            setError("Unesite Vasu lozinku za potvrdu brisanja")
            return;
        }

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

        setMessage("Nalog uspesno obrisan. Preusmeravanje...")
         setTimeout(() => window.location.href = "/login", 2000);

        } catch(error: any) {
        console.error(error);
        setDeleteConfirm(""); // Resetuj polje za lozinku
        
        if (error.code === "auth/invalid-credential") {
            setError("Pogrešna lozinka");
        } else if (error.code === "auth/requires-recent-login") {
            setError("Molimo ponovo se ulogujte");
        } else {
            setError("Greška pri brisanju naloga" + error);
        }
    }
    };



    const getAutoSkolaNaziv = (id: string) => {
        const skola = autoSkole.find(s => s.id === id);
        return skola ? skola.naziv : "Nepoznato";
    }

    const getInstruktorIme = (id: string) => {
        const instruktor = instruktori.find(i => i.id === id);
        return instruktor ? instruktor.fullName : "Nepoznato";
    }

    const logout = async () => {
        await signOut(auth)
        router.push("/")
    }

    const renderContent = () => {
        switch(activeSection) {
            case "Glavna":
                return(
                    <div>
                        <div>
                            <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                            <p className="text-xl text-gray-500 mt-1">Upravljajte svim autoškolama u sistemu</p>
                        </div>

                        <div className="grid grid-cols-4 gap-6 mt-10">
                            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-lg font-semibold text-gray-700">Ukupno autoškola</h1>
                                    <School className="h-10 w-10 p-2 rounded-lg bg-blue-100 text-blue-600" />
                                </div>
                                <h1 className="font-bold text-3xl mt-4">{autoSkole.length}</h1>
                            </div>

                            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-lg font-semibold text-gray-700">Ukupno studenata</h1>
                                    <UsersRound className="h-10 w-10 p-2 rounded-lg bg-green-100 text-green-600" />
                                </div>
                                <h1 className="font-bold text-3xl mt-4">{studenti.length}</h1>
                            </div>

                            <div className="bg-white shadow-lg border border-gray-200 p-6 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-lg font-semibold text-gray-700">Ukupno instruktora</h1>
                                    <Users className="h-10 w-10 p-2 rounded-lg bg-purple-100 text-purple-600" />
                                </div>
                                <h1 className="font-bold text-3xl mt-4">{instruktori.length}</h1>
                            </div>

                        </div>

                        <div className="mt-10">
                            <SendInvite/>
                        </div>

                        <div>
                            <TestsList />
                        </div>


                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Autoškole</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Sve autoškole</h2>
                                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                            {autoSkole.length} autoškola
                                        </span>
                                    </div>

                                    {autoSkole.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <span className="text-2xl">🏫</span>
                                            </div>
                                            <p className="text-gray-500 text-lg">Nema unetih autoškola</p>
                                            <p className="text-gray-400 text-sm mt-1">Dodajte prvu autoškolu</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-100 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                            {autoSkole.map((skola, index) => (
                                                <div key={skola.id} className="group flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 group-hover:text-blue-700">{skola.naziv}</p>
                                                            <div className="flex items-center mt-1">
                                                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                                                </svg>
                                                                <p className="text-sm text-gray-600">{skola.mesto}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dodaj novu autoškolu</h2>
                                    <p className="text-gray-500 mb-6">Unesite podatke o novoj autoškoli</p>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Naziv autoškole</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                                    </svg>
                                                </div>
                                                <input type="text" placeholder="Unesite naziv autoškole" value={nazivSkole} onChange={(e) => setNazivSkole(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mesto</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                                    </svg>
                                                </div>
                                                <input type="text" placeholder="Unesite mesto" value={mesto} onChange={(e) => setMesto(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <button onClick={handleAutoSkolaAdd} disabled={!nazivSkole.trim() || !mesto.trim()} className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${nazivSkole.trim() && mesto.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                            </svg>
                                            <span>Dodaj autoškolu</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Instruktori</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Svi instruktori</h2>
                                        <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                                            {instruktori.length} instruktora
                                        </span>
                                    </div>

                                    {instruktori.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Users className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 text-lg">Nema unetih instruktora</p>
                                            <p className="text-gray-400 text-sm mt-1">Dodajte prvog instruktora</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-400 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                            {instruktori.map((instruktor, index) => (
                                                <div key={instruktor.id} className="group flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 cursor-pointer">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 group-hover:text-purple-700">{instruktor.fullName}</p>
                                                            <div className="flex items-center mt-1 space-x-4">
                                                                <div className="flex items-center">
                                                                    <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                                                    </svg>
                                                                    <p className="text-sm text-gray-600">{instruktor.email}</p>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                                                    </svg>
                                                                    <p className="text-sm text-gray-600">{instruktor.godine} god.</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{getAutoSkolaNaziv(instruktor.autoSkolaId)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dodaj novog instruktora</h2>
                                    <p className="text-gray-500 mb-6">Unesite podatke o novom instruktoru</p>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                                    </svg>
                                                </div>
                                                <input type="text" placeholder="Unesite ime i prezime" value={imePrezime} onChange={(e) => setImePrezime(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email adresa</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                                    </svg>
                                                </div>
                                                <input type="email" placeholder="Unesite email adresu" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Godine</label>
                                            <input type="number" placeholder="Unesite godine" value={godine} onChange={(e) => setGodine(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"/>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Autoškola</label>
                                            <select value={autoSkolaId} onChange={(e) => setAutoSkolaId(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all">
                                                <option value="">Izaberite autoškolu</option>
                                                {autoSkole.map(skola => (
                                                    <option key={skola.id} value={skola.id}>{skola.naziv} - {skola.mesto}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button onClick={handleInstruktorAdd} disabled={!imePrezime.trim() || !email.trim() || !godine || !autoSkolaId} className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${imePrezime.trim() && email.trim() && godine && autoSkolaId ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                            </svg>
                                            <span>Dodaj instruktora</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Studenti</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Svi studenti</h2>
                                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                            {studenti.length} studenata
                                        </span>
                                    </div>

                                    {studenti.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <UsersRound className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 text-lg">Nema unetih studenata</p>
                                            <p className="text-gray-400 text-sm mt-1">Dodajte prvog studenta</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-400 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                            {studenti.map((student, index) => (
                                                <div key={student.id} className="group flex items-center justify-between border border-gray-200 p-4 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all duration-200 cursor-pointer">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-800 rounded-lg font-semibold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 group-hover:text-green-700">{student.fullName}</p>
                                                            <div className="flex items-center mt-1">
                                                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                                                </svg>
                                                                <p className="text-sm text-gray-600">{student.email}</p>
                                                            </div>
                                                            <div className="flex items-center mt-2 space-x-3">
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{getAutoSkolaNaziv(student.autoSkolaId)}</span>
                                                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{getInstruktorIme(student.instruktorId)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dodaj novog studenta</h2>
                                    <p className="text-gray-500 mb-6">Unesite podatke o novom studentu</p>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                                    </svg>
                                                </div>
                                                <input type="text" placeholder="Unesite ime i prezime" value={studentImePrezime} onChange={(e) => setStudentImePrezime(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email adresa</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                                    </svg>
                                                </div>
                                                <input type="email" placeholder="Unesite email adresu" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"/>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Autoškola</label>
                                            <select value={studentAutoSkolaId} onChange={(e) => setStudentAutoSkolaId(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all">
                                                <option value="">Izaberite autoškolu</option>
                                                {autoSkole.map(skola => (
                                                    <option key={skola.id} value={skola.id}>{skola.naziv} - {skola.mesto}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Instruktor</label>
                                            <select value={studentInstruktorId} onChange={(e) => setStudentInstruktorId(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all">
                                                <option value="">Izaberite instruktora</option>
                                                {instruktori.map(instruktor => (
                                                    <option key={instruktor.id} value={instruktor.id}>{instruktor.fullName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button onClick={handleStudentAdd} disabled={!studentImePrezime.trim() || !studentEmail.trim() || !studentAutoSkolaId || !studentInstruktorId} className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${studentImePrezime.trim() && studentEmail.trim() && studentAutoSkolaId && studentInstruktorId ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                            </svg>
                                            <span>Dodaj studenta</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "Testovi":
                return <TestCreator/>
            case "Podesavanja":
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
                                            <p className="font-semibold text-gray-800 text-lg">{currentUser.fullName}</p>
                                            <p className="text-gray-600">{currentUser.email}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <Mail className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Email adresa</p>
                                                    <p className="font-medium">{currentUser.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <Shield className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Uloga</p>
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-medium">{currentUser.role}</p>
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Super Admin</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm text-gray-500">Datum pridruživanja</p>
                                                    <p className="font-medium">{currentUser.joinedDate}</p>
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
                                            className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-semibold transition-all duration-200 ${currentPassword && newPassword && confirmPassword ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <Lock className="w-5 h-5" />
                                            <span>Promeni lozinku</span>
                                        </button>
                                        <a href="/forgot-password" className="text-md text-blue-600 hover:text-blue-800 underline underline-offset-2 transition">Zaboravili ste lozinku?
                                         {passwordMessage && <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg 3xl:text-base">{passwordMessage}</div>}
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
                                                Unesite vašu lozinku za: <span className="font-bold">{currentUser.email}</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <KeyRound className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder={`Unesite password`}
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
                                                deleteConfirm ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                            <Trash2 className="w-5 h-5" />
                                            <span>Obriši nalog</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                );
        }
    }

    return (
        <Protected allowedRoles={["superadmin"]}>
            <div className="flex h-screen">
                <aside className="h-screen w-64 p-4 top-0 sticky bg-white border-r border-gray-200">
                    <h1 className="flex gap-2 font-bold text-xl"><Car className="h-7 w-7 p-1 items-center justify-center rounded-lg bg-blue-500 text-white"/>AutoŠkola Šampion</h1>
                    <hr className="w-full mt-2"/>
                    <nav className="flex flex-col gap-4 items-start mt-5">
                        <button onClick={() => setActiveSection("Glavna")} className={`flex gap-2 w-full text-left hover:bg-blue-50 p-2 rounded-lg items-center ${activeSection === 'Glavna' ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}`}><CarFront/>Pocetna</button>
                        <button onClick={() => setActiveSection("Testovi")} className={`flex gap-2 w-full text-left hover:bg-blue-50 p-2 rounded-lg items-center ${activeSection === 'Testovi' ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}`}><Users/>Novi Test</button>
                        <button onClick={() => setActiveSection("Podesavanja")} className={`flex gap-2 w-full text-left hover:bg-blue-50 rounded-lg p-2 items-center ${activeSection === 'Podesavanja' ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}`}><Settings/>Podesavanja</button>
                        <button onClick={logout} className='font-semibold bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 cursor-pointer mt-6'>Odjavite se</button>
                    </nav>
                </aside>

                <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    {renderContent()}
                </main>
            </div>
        </Protected>
    )
}

export default page;