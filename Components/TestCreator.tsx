'use client';

import { useState } from "react";
import { db, storage } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Image, CheckCircle, XCircle, Save, FileText, HelpCircle, AlertCircle } from "lucide-react";

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

  const [questionText, setQuestionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [points, setPoints] = useState<number>(3);

  const [errors, setErrors] = useState({
    question: "",
    options: "",
    correct: ""
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
    setCorrectOptions(correctOptions.filter(i => i !== index));
  };

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

  const validateQuestion = () => {
    const newErrors = { question: "", options: "", correct: "" };
    let isValid = true;

    if (!questionText.trim()) {
      newErrors.question = "Unesite tekst pitanja";
      isValid = false;
    }

    if (options.some(o => !o.trim())) {
      newErrors.options = "Sve opcije moraju biti popunjene";
      isValid = false;
    }

    if (correctOptions.length === 0) {
      newErrors.correct = "Izaberite barem jedan tačan odgovor";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddQuestion = async () => {
    if (!validateQuestion()) return;

    let imageUrl = "";
    if (imageFile) {
      const storageRef = ref(storage, `tests/${Date.now()}-${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const newQuestion: Question = {
      question: questionText,
      imageUrl,
      options,
      correctOptions,
      points,
    };

    setQuestions([...questions, newQuestion]);

    // reset
    setQuestionText("");
    setImageFile(null);
    setImagePreview(null);
    setOptions(["", ""]);
    setCorrectOptions([]);
    setPoints(3);
    setErrors({ question: "", options: "", correct: "" });
  };

  const handleSaveTest = async () => {
    if (!testName.trim()) {
      alert("Unesite naziv testa!");
      return;
    }
    if (questions.length === 0) {
      alert("Dodajte barem jedno pitanje!");
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
      console.error(err);
      alert("Greška pri čuvanju testa");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dodaj novi test</h1>
        <p className="text-gray-500 mt-1">Kreirajte test za polaznike autoškole</p>
      </div>

      {/* Naziv testa */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Osnovne informacije</h2>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Unesite naziv testa"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 pl-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">Primer: "Saobraćajni propisi - Test 1"</p>
      </div>

      {/* Dodavanje pitanja */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Dodaj novo pitanje</h2>
        </div>

        {/* Tekst pitanja */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tekst pitanja <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Unesite tekst pitanja..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          {errors.question && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.question}
            </p>
          )}
        </div>

        {/* Slika */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slika (opciono)
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors">
                <Image className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Izaberi sliku</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Opcije */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opcije odgovora <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 pl-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={`Opcija ${i + 1}`}
                  />
                  {correctOptions.includes(i) && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`correct-${i}`}
                    checked={correctOptions.includes(i)}
                    onChange={() => handleCheckboxChange(i)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`correct-${i}`} className="text-sm text-gray-600">
                    Tačno
                  </label>
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {errors.options && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.options}
            </p>
          )}
          
          {errors.correct && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.correct}
            </p>
          )}

          {options.length < 4 && (
            <button
              onClick={addOption}
              className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Dodaj opciju</span>
            </button>
          )}
        </div>

        {/* Bodovi */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Broj bodova
          </label>
          <select
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full md:w-48 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            <option value={3}>3 boda</option>
            <option value={4}>4 boda</option>
          </select>
        </div>

        {/* Dodaj pitanje */}
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg shadow-green-600/20"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Dodaj pitanje</span>
        </button>
      </div>

      {/* Pregled pitanja */}
      {questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Pregled pitanja ({questions.length})
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-lg flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    {q.question}
                  </h3>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Question" className="w-32 h-32 object-cover rounded-lg mb-3" />
                )}
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`p-2 rounded-lg text-sm ${
                        q.correctOptions.includes(j)
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {opt}
                      {q.correctOptions.includes(j) && (
                        <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Bodovi: {q.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sačuvaj test */}
      <button
        onClick={handleSaveTest}
        disabled={questions.length === 0}
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all duration-200 ${
          questions.length > 0
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Save className="w-5 h-5" />
        <span>Sačuvaj test</span>
      </button>
    </div>
  );
};

export default AddTest;