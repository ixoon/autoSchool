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
  correctOptions: number[];
  points: number;
};

type Test = {
  name: string;
  questions: Question[];
};

type HistoryAnswer = {
  selected: number[];
};

type History = {
  testId: string;
  answers: HistoryAnswer[];
  score: number;
  maxScore: number;
};

export default function ReviewTest() {
  const { historyId } = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!historyId) return;

      const historySnap = await getDoc(doc(db, 'testHistory', historyId as string));
      if (!historySnap.exists()) return;

      const historyData = historySnap.data() as History;
      setHistory(historyData);

      const testSnap = await getDoc(doc(db, 'tests', historyData.testId));
      if (testSnap.exists()) {
        setTest(testSnap.data() as Test);
      }
    };

    fetchData();
  }, [historyId]);

  if (!test || !history) return <p className="p-6">Učitavanje...</p>;

  return (
    <Protected allowedRoles={['superadmin','instruktor','student']}>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{test.name} — Pregled</h1>
        <p className="mb-6 text-lg">
          Rezultat: <b>{history.score}</b> / {history.maxScore}
        </p>

        {test.questions.map((q, qi) => {
          const selected = history.answers?.[qi]?.selected ?? [];

          return (
            <div key={qi} className="mb-8 border rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3">
                {qi + 1}. {q.question} ({q.points} boda)
              </h2>

              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  className="mb-4 max-h-64 object-contain rounded"
                />
              )}

              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selected.includes(oi);
                  const isCorrect = q.correctOptions.includes(oi);

                  let style = 'bg-white';
                  if (isCorrect) style = 'bg-green-100 border-green-400';
                  if (isSelected && !isCorrect) style = 'bg-red-100 border-red-400';

                  return (
                    <div
                      key={oi}
                      className={`border rounded-lg p-3 ${style}`}
                    >
                      {opt}
                      {isCorrect && (
                        <span className="ml-2 text-green-700 font-semibold">
                          ✔ Tačan
                        </span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="ml-2 text-red-700 font-semibold">
                          ✖ Tvoj odgovor
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Protected>
  );
}
