'use client';

import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Plus, Trash2, Image, CheckCircle, XCircle, Save, FileText, 
  HelpCircle, AlertCircle, Upload, Eye, ArrowLeft, ArrowRight,
  CheckSquare, Square, Layers, Edit3, Award
} from "lucide-react";

type Option = {
  text: string;
  imageUrl?: string;
  imageFile?: File | null;
  imagePreview?: string | null;
};

type Question = {
  question: string;
  imageUrl: string;
  options: Option[];
  correctOptions: number[];
  points: number;
};

const AddTest = () => {
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: osnovno, 2: pitanja

  const [questionText, setQuestionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [options, setOptions] = useState<Option[]>([
    { text: "" },
    { text: "" }
  ]);

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

  const handleOptionImageChange = (index: number, file: File | null) => {
    const newOptions = [...options];
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newOptions[index].imagePreview = reader.result as string;
        setOptions([...newOptions]);
      };
      reader.readAsDataURL(file);
    }
    
    newOptions[index].imageFile = file;
    setOptions(newOptions);
  };

  const removeOptionImage = (index: number) => {
    const newOptions = [...options];
    newOptions[index].imageFile = null;
    newOptions[index].imagePreview = null;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, { text: "" }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
    setCorrectOptions(correctOptions.filter(i => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
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

    const hasInvalidOption = options.some(opt => 
      !opt.text.trim() && !opt.imageFile
    );
    
    if (hasInvalidOption) {
      newErrors.options = "Svaka opcija mora imati tekst ILI sliku";
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

    const uploadedOptions = await Promise.all(
      options.map(async (opt) => {
        let optionImageUrl = "";
        
        if (opt.imageFile) {
          const storageRef = ref(storage, `tests/options/${Date.now()}-${opt.imageFile.name}`);
          await uploadBytes(storageRef, opt.imageFile);
          optionImageUrl = await getDownloadURL(storageRef);
        }
        
        return {
          text: opt.text,
          imageUrl: optionImageUrl
        };
      })
    );

    const newQuestion: Question = {
      question: questionText,
      imageUrl,
      options: uploadedOptions,
      correctOptions,
      points,
    };

    setQuestions([...questions, newQuestion]);

    // reset
    setQuestionText("");
    setImageFile(null);
    setImagePreview(null);
    setOptions([{ text: "" }, { text: "" }]);
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
      setCurrentStep(1);
    } catch (err) {
      console.error(err);
      alert("Greška pri čuvanju testa");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header sa progressom */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Kreiraj novi test</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">Dodajte pitanja za polaznike autoškole</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'}`} />
          <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'}`} />
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm text-slate-500">
          <span>Osnovne informacije</span>
          <span>Dodavanje pitanja</span>
        </div>
      </div>

      {/* Step 1: Osnovne informacije */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 mb-6 animate-fadeIn">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Osnovne informacije</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-600" />
                Naziv testa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="npr: Saobraćajni propisi - Test 1"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Preporučujemo jedinstven naziv za lakše snalaženje
              </p>
            </div>

            {questions.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Već ste dodali {questions.length} pitanja
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!testName.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  testName.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Dalje</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Dodavanje pitanja */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header sa navigacijom */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Nazad</span>
            </button>
            <div className="text-sm text-slate-500">
              Ukupno pitanja: <span className="font-semibold text-blue-600">{questions.length}</span>
            </div>
          </div>

          {/* Forma za dodavanje pitanja */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Dodaj novo pitanje</h2>
            </div>

            {/* Tekst pitanja */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Tekst pitanja <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Unesite tekst pitanja..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
              {errors.question && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.question}
                </p>
              )}
            </div>

            {/* Slika za pitanje (opciono) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Image className="w-4 h-4 text-blue-600" />
                Slika za pitanje (opciono)
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <label className="cursor-pointer group">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 hover:border-blue-400 px-6 py-4 rounded-xl transition-all group-hover:shadow-md">
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    <span className="text-sm text-slate-600 group-hover:text-blue-600 transition-colors">Izaberi sliku</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                
                {imagePreview && (
                  <div className="relative flex-1 max-w-xs">
                    <div className="relative group">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl border-2 border-blue-200 shadow-md" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-all hover:scale-110"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Opcije odgovora - svaka može biti tekst ILI slika */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-4 flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Opcije odgovora <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2">(svaka opcija mora imati tekst ILI sliku)</span>
              </label>
              
              <div className="space-y-4">
                {options.map((opt, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Tekst opcije */}
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          placeholder={`Tekst opcije ${i + 1} (opciono ako dodajete sliku)`}
                        />
                        
                        {/* Slika opcije */}
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer group">
                            <div className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 px-4 py-2 rounded-lg transition-all">
                              <Upload className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                              <span className="text-xs text-slate-600 group-hover:text-blue-600">Dodaj sliku za opciju</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleOptionImageChange(i, e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                          
                          {opt.imagePreview && (
                            <div className="relative">
                              <img src={opt.imagePreview} alt="Option preview" className="w-16 h-16 object-cover rounded-lg border-2 border-blue-200" />
                              <button
                                onClick={() => removeOptionImage(i)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Checkbox za tačan odgovor */}
                        <button
                          onClick={() => handleCheckboxChange(i)}
                          className={`p-2 rounded-lg transition-colors ${
                            correctOptions.includes(i)
                              ? 'bg-green-100 text-green-600'
                              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                          }`}
                        >
                          {correctOptions.includes(i) ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        {/* Dugme za brisanje opcije */}
                        {options.length > 2 && (
                          <button
                            onClick={() => removeOption(i)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {errors.options && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.options}
                </p>
              )}
              
              {errors.correct && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.correct}
                </p>
              )}

              {options.length < 4 && (
                <button
                  onClick={addOption}
                  className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group"
                >
                  <div className="p-1 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Dodaj opciju</span>
                </button>
              )}
            </div>

            {/* Bodovi */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Award className="w-4 h-4 text-blue-600" />
                Broj bodova
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setPoints(value)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                      points === value
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Dodaj pitanje */}
            <button
              onClick={handleAddQuestion}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-600/20 font-semibold text-base"
            >
              <Plus className="w-5 h-5" />
              <span>Dodaj pitanje u test</span>
            </button>
          </div>

          {/* Pregled pitanja */}
          {questions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Pregled pitanja
                  </h2>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm">
                  {questions.length} pitanja • {totalPoints} bodova
                </span>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
                {questions.map((q, i) => (
                  <div key={i} className="group border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-blue-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                          {i + 1}
                        </span>
                        <h3 className="font-semibold text-slate-800 flex-1">{q.question}</h3>
                      </div>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {q.imageUrl && (
                      <div className="ml-11 mb-3">
                        <img src={q.imageUrl} alt="Question" className="w-32 h-32 object-cover rounded-xl border-2 border-slate-200" />
                      </div>
                    )}
                    
                    <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                            q.correctOptions.includes(j)
                              ? 'bg-green-50 text-green-800 border border-green-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {opt.imageUrl ? (
                            <img src={opt.imageUrl} alt="Option" className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <span className="flex-1">{opt.text}</span>
                          )}
                          {q.correctOptions.includes(j) && (
                            <CheckCircle className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="ml-11 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <Award className="w-3 h-3" />
                        {q.points} {q.points === 1 ? 'bod' : 'boda'}
                      </span>
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
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-xl font-semibold text-lg transition-all duration-200 ${
              questions.length > 0
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:-translate-y-0.5'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-6 h-6" />
            <span>Sačuvaj test</span>
          </button>
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
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default AddTest;