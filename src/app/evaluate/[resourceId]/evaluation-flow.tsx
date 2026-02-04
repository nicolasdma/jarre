'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Concept {
  id: string;
  name: string;
  canonical_definition: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface Question {
  id: string;
  type: string;
  conceptName: string;
  question: string;
}

interface EvaluationResult {
  questionIndex: number;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

interface Props {
  resource: Resource;
  concepts: Concept[];
  userId: string;
}

type Phase = 'intro' | 'loading' | 'questions' | 'submitting' | 'results';

export function EvaluationFlow({ resource, concepts, userId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    responses: EvaluationResult[];
    overallScore: number;
    summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartEvaluation = async () => {
    setPhase('loading');
    setError(null);

    try {
      const response = await fetch('/api/evaluate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceType: resource.type,
          concepts: concepts.map((c) => ({
            name: c.name,
            definition: c.canonical_definition,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setPhase('questions');
    } catch (err) {
      setError((err as Error).message);
      setPhase('intro');
    }
  };

  const handleSubmitAnswers = async () => {
    setPhase('submitting');
    setError(null);

    try {
      const response = await fetch('/api/evaluate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceTitle: resource.title,
          questions: questions.map((q, i) => ({
            ...q,
            conceptDefinition:
              concepts.find((c) => c.name === q.conceptName)?.canonical_definition || '',
            userAnswer: answers[i.toString()] || '',
          })),
          userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to evaluate answers');
      }

      const data = await response.json();
      setResults(data);
      setPhase('results');
    } catch (err) {
      setError((err as Error).message);
      setPhase('questions');
    }
  };

  const allAnswered = questions.every((_, i) => answers[i.toString()]?.trim());

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluate: {resource.title}</CardTitle>
          <CardDescription>
            Test your understanding of this {resource.type}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-stone-900">Concepts to be evaluated:</h3>
            <ul className="mt-2 space-y-1">
              {concepts.map((concept) => (
                <li key={concept.id} className="text-sm text-stone-600">
                  • {concept.name}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-stone-600">
            AI will generate 5 questions to test your understanding. Answer honestly -
            this helps identify gaps in your knowledge.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleStartEvaluation}>Start Evaluation</Button>
        </CardContent>
      </Card>
    );
  }

  // LOADING PHASE
  if (phase === 'loading') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-stone-600">Generating questions...</p>
          <p className="mt-2 text-sm text-stone-500">This may take a few seconds</p>
        </CardContent>
      </Card>
    );
  }

  // QUESTIONS PHASE
  if (phase === 'questions') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{resource.title}</h1>
          <p className="text-stone-600">Answer all questions to complete the evaluation</p>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id || index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Question {index + 1} of {questions.length}
                </CardDescription>
                <span className="text-xs text-stone-500 capitalize">{question.type}</span>
              </div>
              <CardTitle className="text-lg">{question.question}</CardTitle>
              <p className="text-sm text-stone-500">Concept: {question.conceptName}</p>
            </CardHeader>
            <CardContent>
              <Label htmlFor={`answer-${index}`} className="sr-only">
                Your answer
              </Label>
              <textarea
                id={`answer-${index}`}
                className="w-full rounded-md border border-stone-200 p-3 text-sm focus:border-stone-400 focus:outline-none"
                rows={4}
                placeholder="Type your answer here..."
                value={answers[index.toString()] || ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [index.toString()]: e.target.value }))
                }
              />
            </CardContent>
          </Card>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/library')}>
            Cancel
          </Button>
          <Button onClick={handleSubmitAnswers} disabled={!allAnswered}>
            {allAnswered ? 'Submit Answers' : `Answer all questions (${Object.keys(answers).length}/${questions.length})`}
          </Button>
        </div>
      </div>
    );
  }

  // SUBMITTING PHASE
  if (phase === 'submitting') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-stone-600">Evaluating your answers...</p>
          <p className="mt-2 text-sm text-stone-500">AI is reviewing your responses</p>
        </CardContent>
      </Card>
    );
  }

  // RESULTS PHASE
  if (phase === 'results' && results) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Complete</CardTitle>
            <CardDescription>{resource.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-stone-900">{results.overallScore}%</p>
                <p className="text-sm text-stone-500">Overall Score</p>
              </div>
              <div className="flex-1">
                <p className="text-stone-600">{results.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {results.responses.map((result, index) => {
          const question = questions[index];
          return (
            <Card
              key={index}
              className={result.isCorrect ? 'border-green-200' : 'border-amber-200'}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Question {index + 1}</CardDescription>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      result.isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {result.score}%
                  </span>
                </div>
                <CardTitle className="text-base">{question?.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-stone-500">Your answer:</p>
                  <p className="text-sm text-stone-700">{answers[index.toString()]}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Feedback:</p>
                  <p className="text-sm text-stone-700">{result.feedback}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/library')}>
            Back to Library
          </Button>
          <Button onClick={() => router.push('/dashboard')}>View Dashboard</Button>
        </div>
      </div>
    );
  }

  return null;
}
