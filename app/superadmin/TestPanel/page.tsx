'use client';
import { db } from "@/config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

const TestPanel = () => {
  const [nazivTesta, setNazivTesta] = useState("");
  const [testId, setTestId] = useState("");

  const [pitanjeText, setPitanjeText] = useState("");
  const [slika, setSlika] = useState("");
  const [poeni, setPoeni] = useState(1);
  const [odgovori, setOdgovori] = useState<{text: string, isCorrect: boolean}[]>([
    { text: "", isCorrect: false }
  ]);

  const handleTestAdd = async () => {
    try {
      const docRef = await addDoc(collection(db, "testovi"), {
        nazivTesta,
        createdAt: serverTimestamp(),
      });
      setTestId(docRef.id);
      setNazivTesta("");
      alert("Test kreiran! ID: " + docRef.id);
    } catch(err) {
      console.log("Greska:", err);
    }
  };

  const handleDodajOdgovor = () => setOdgovori(prev => [...prev, { text: "", isCorrect: false }]);
  const handleOdgovorChange = (index: number, text: string, isCorrect: boolean) => {
    const updated = [...odgovori];
    updated[index] = { text, isCorrect };
    setOdgovori(updated);
  };

  const handlePitanjeAdd = async () => {
    if (!testId) return alert("Prvo kreirajte test!");
    try {
      await addDoc(collection(db, "pitanja"), {
        testId,
        text: pitanjeText,
        slika,
        poeni,
        odgovori
      });
      setPitanjeText("");
      setSlika("");
      setPoeni(1);
      setOdgovori([{ text: "", isCorrect: false }]);
      alert("Pitanje dodato!");
    } catch(err) {
      console.log("Greska:", err);
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Superadmin Test Panel</h1>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Dodaj Test</h2>
        <input value={nazivTesta} onChange={(e) => setNazivTesta(e.target.value)} placeholder="Naziv testa" className="border p-2 rounded mr-2"/>
        <button onClick={handleTestAdd} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Kreiraj Test</button>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-2">Dodaj Pitanje</h2>
        <textarea value={pitanjeText} onChange={(e) => setPitanjeText(e.target.value)} placeholder="Tekst pitanja" className="border p-2 rounded w-full mb-2"/>
        <input value={slika} onChange={(e) => setSlika(e.target.value)} placeholder="URL slike (opciono)" className="border p-2 rounded w-full mb-2"/>
        <input type="number" value={poeni} onChange={(e) => setPoeni(Number(e.target.value))} placeholder="Poeni" className="border p-2 rounded w-24 mb-2"/>

        {odgovori.map((odg, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <input value={odg.text} onChange={(e) => handleOdgovorChange(idx, e.target.value, odg.isCorrect)} placeholder={`Odgovor ${idx+1}`} className="border p-2 rounded flex-1"/>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={odg.isCorrect} onChange={(e) => handleOdgovorChange(idx, odg.text, e.target.checked)} />
              Tačan
            </label>
          </div>
        ))}
        <button onClick={handleDodajOdgovor} className="bg-gray-300 text-black p-2 rounded mb-2 hover:bg-gray-400">Dodaj odgovor</button>
        <button onClick={handlePitanjeAdd} className="bg-green-500 text-white p-2 rounded hover:bg-green-600 ml-2">Dodaj pitanje</button>
      </div>
    </div>
  );
};

export default TestPanel;
