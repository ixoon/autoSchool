'use client';

import { useState } from "react";
import { db, storage } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Question = {
  question: string;
  imageUrl: string;
  options: string[];
  correctOptions: number[];
  points: number;
};

const AddTest = () => {
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // Trenutno pitanje
  const [questionText, setQuestionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [points, setPoints] = useState(1);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCheckboxChange = (index: number) => {
    if (correctOptions.includes(index)) {
      setCorrectOptions(correctOptions.filter(i => i !== index));
    } else {
      setCorrectOptions([...correctOptions, index]);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim()) {
      alert("Unesi tekst pitanja!");
      return;
    }

    let imageUrl = "";
    if (imageFile) {
      const storageRef = ref(storage, `tests/${imageFile.name}-${Date.now()}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const newQuestion: Question = {
      question: questionText,
      imageUrl,
      options: [...options],
      correctOptions: [...correctOptions],
      points,
    };

    setQuestions([...questions, newQuestion]);

    // Reset forme za sledeće pitanje
    setQuestionText("");
    setImageFile(null);
    setOptions(["", "", "", ""]);
    setCorrectOptions([]);
    setPoints(1);
  };

  const handleSaveTest = async () => {
    if (!testName.trim()) {
      alert("Unesi naziv testa!");
      return;
    }

    if (questions.length === 0) {
      alert("Dodaj barem jedno pitanje!");
      return;
    }

    try {
      await addDoc(collection(db, "tests"), {
        name: testName,
        questions,
        createdAt: serverTimestamp(),
      });

      alert("Test uspešno sačuvan!");
      setTestName("");
      setQuestions([]);
    } catch (err) {
      console.error("Greška prilikom čuvanja testa:", err);
      alert("Došlo je do greške.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dodaj novi test</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Naziv testa:</label>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      <hr className="my-4" />

      <h2 className="text-xl font-semibold mb-2">Dodaj pitanje</h2>
      <div className="mb-2">
        <label className="block mb-1">Tekst pitanja:</label>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Slika (opciono):</label>
        <input
          type="file"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1 font-semibold">Opcije odgovora:</label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              className="border p-1 rounded flex-1"
              placeholder={`Opcija ${i + 1}`}
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={correctOptions.includes(i)}
                onChange={() => handleCheckboxChange(i)}
              />
              Tačan
            </label>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="block mb-1">Bodovi za pitanje:</label>
        <input
          type="number"
          min={1}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="border p-2 rounded w-24"
        />
      </div>

      <button
        onClick={handleAddQuestion}
        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded mb-4"
      >
        Dodaj pitanje
      </button>

      <hr className="my-4" />

      <h2 className="text-xl font-semibold mb-2">Pregled pitanja ({questions.length})</h2>
      <ul className="list-decimal ml-6 mb-4">
        {questions.map((q, i) => (
          <li key={i} className="mb-2">
            <span className="font-semibold">{q.question}</span>
            {q.imageUrl && (
              <img src={q.imageUrl} alt="question" className="mt-1 w-32 h-32 object-cover" />
            )}
            <div>
              Opcije: {q.options.join(", ")} | Tačni: {q.correctOptions.map(n => n+1).join(", ")} | Bodovi: {q.points}
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSaveTest}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
      >
        Sačuvaj test
      </button>
    </div>
  );
};

export default AddTest;
