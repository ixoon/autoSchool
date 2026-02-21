'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Protected from '@/Components/Protected';

type Question = {
  question: string;
  imageUrl?: string;
  options: string[];
  correctOptions: number[]; // indexi tacnih odgovora
  points: number;
};

type Test = {
  name: string;
  questions: Question[];
};

export default function TestRunner() {
  const { testId } = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      const snap = await getDoc(doc(db, 'tests', testId as string));
      if (snap.exists()) {
        const data = snap.data() as Test;
        setTest(data);
        setAnswers(Array(data.questions.length).fill([]));
      }
    };
    fetchTest();
  }, [testId]);

  if (!test) return <p className="p-6">Učitavanje testa...</p>;

  const question = test.questions[current];

  const toggleOption = (index: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      if (copy[current].includes(index)) {
        copy[current] = copy[current].filter((i) => i !== index);
      } else {
        copy[current] = [...copy[current], index];
      }
      return copy;
    });
  };

  const nextQuestion = () => {
    if (current < test.questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    let total = 0;

    test.questions.forEach((q, i) => {
      const selected = answers[i].sort().join(',');
      const correct = q.correctOptions.sort().join(',');
      if (selected === correct) {
        total += q.points;
      }
    });

    setScore(total);
    setFinished(true);
  };

  if (finished) {
    const maxPoints = test.questions.reduce((sum, q) => sum + q.points, 0);
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Rezultat</h1>
        <p className="text-xl">
          Osvojili ste <b>{score}</b> / {maxPoints} bodova
        </p>
      </div>
    );
  }

  return (
    <Protected allowedRoles={['superadmin','instruktor', 'student']}>
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{test.name}</h1>

      <div className="mb-4 text-sm text-gray-500">
        Pitanje {current + 1} / {test.questions.length} • {question.points} boda
      </div>

      <h2 className="text-xl font-semibold mb-4">{question.question}</h2>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="question"
          className="mb-4 rounded-lg max-h-64 object-contain"
        />
      )}

      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={`block border rounded-lg p-3 cursor-pointer transition ${
              answers[current].includes(i)
                ? 'bg-blue-100 border-blue-400'
                : 'bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={answers[current].includes(i)}
              onChange={() => toggleOption(i)}
              className="mr-2"
            />
            {opt}
          </label>
        ))}
      </div>

      <button
        onClick={nextQuestion}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        {current === test.questions.length - 1
          ? 'Završi test'
          : 'Sledeće pitanje'}
      </button>
    </div>
    </Protected>
  );
}
