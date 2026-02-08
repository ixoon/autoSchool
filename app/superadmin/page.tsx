'use client';

import Protected from "@/Components/Protected";
import { db } from "@/config/firebase";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { CarFront, Settings, Users, Car } from "lucide-react";
import { useEffect, useState } from "react";

const page = () => {
    //AUTOSKOLE
    const [nazivSkole, setNazivSkole] = useState("");
    const [mesto, setMesto] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [autoSkole, setAutoSkole] = useState<{id: string, naziv: string, mesto: string}[]>([]);

    //INSTRUKTORI
    const [imePrezime, setImePrezime] = useState("");
    const [email, setEmail] = useState("");
    const [godine, setGodine] = useState("");
    const [autoSkolaId, setAutoSkolaId] = useState("");
    const [instruktori, setInstruktori] = useState<{id: string, fullName: string, email: string, godine: number, autoSkolaId: string}[]>([]);

    //STUDENT
    const [studentImePrezime, setStudentImePrezime] = useState("");
    const [studentEmail, setStudentEmail] = useState("");
    const [studentAutoSkolaId, setStudentAutoSkolaId] = useState("");
    const [studentInstruktorId, setStudentInstruktorId] = useState("");

    //REQUESTS
    const [accessName, setAccessName] = useState("");
    const [accessEmail, setAccessEmail] = useState("");
    const [accessText, setAccessText] = useState<{id: string, fullName: string, email: string, requestedRole: string, status: string}[]>([]);
    const [accessError, setAccessError] = useState("");

    //USERS
    const [users, setUsers] = useState<{id: string, fullName: string, email: string, role: string, instruktorID: string}[]>([])
    const [userError, setUserError] = useState("");


    const [activeSection, setActiveSection] = useState<"Glavna" | "Testovi" | "Podesavanja">("Glavna")

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

    useEffect(()  => {
        const fetchRequest = async () => {
            try {
                const snapshot = await getDocs(collection(db, "AccessRequests"));
                const Requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...(doc.data() as {fullName: string; email: string; requestedRole: string; status: string})
                }))
                setAccessText(Requests)
            } catch(err) {
                setAccessError("Greska prilikom obrade zahteva." + err)
            }
        }
        fetchRequest(); 
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
            await addDoc(collection(db, "Instruktori"), {
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
            setInstruktori(prev => [...prev, {id: "", fullName: imePrezime, email, godine: Number(godine), autoSkolaId}]);
        } catch(error) {
            setError("Greska prilikom dodavanja instruktora. Pokušajte ponovo. " + error)
        }
    }

    const handleStudentAdd = async () => {
        try {
            await addDoc(collection(db, "studenti"), {
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
        } catch(error) {
            setError("Greska prilikom dodavanja studenta. Pokušajte ponovo. " + error)
        }
    }

    const renderContent = () => {
        switch(activeSection) {
            case "Glavna":
                return(
                    <div>
                        glavna
                    </div>
                );
            case "Testovi":
                return(
                    <div>Polje za testove</div>
                );
            case "Podesavanja":
                return(
                    <div>
                    Podesavanja ovde
                </div>
                );
        }
    }
    return (
        <Protected>
            <div className="flex h-screen">
            <aside className="h-screen w-64 p-4 top-0 sticky">
                    <h1 className="flex gap-2 font-bold text-xl"><Car className="h-7 w-7 p-1 items-center justify-center rounded-lg bg-blue-500 text-white" />AutoŠkola Šampion</h1>
                    <hr className="w-full mt-2"></hr>
                <nav className="flex flex-col gap-4 items-start mt-5">
                        <button onClick={() => {setActiveSection("Glavna")}} className={`flex gap-2 w-full text-left hover:bg-blue-200 p-2 rounded-lg items-center ${activeSection === 'Glavna' ? 'bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700' : ''}`}><CarFront />Pocetna</button>
                        <button onClick={() => {setActiveSection("Testovi")}} className={`flex gap-2 w-full text-left hover:bg-blue-200 p-2 rounded-lg items-center ${activeSection === 'Testovi' ? 'bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700' : ''}`}><Users />Novi Test</button>
                        <button onClick={() => {setActiveSection("Podesavanja")}} className={`flex gap-2 w-full text-left hover:bg-blue-200 rounded-lg p-2 items-center ${activeSection === 'Podesavanja' ? 'bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700' : ''}`}><Settings />Podesavanja</button>

                    <h1 className="mt-30 font-semibold">Navigacioni menu</h1>
                    <a href="/">
                    <button>Glavna</button>
                    </a>
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
