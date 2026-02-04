import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="home" />

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-stone-500">
            Deep Learning System
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-stone-900">
            Master Complex
            <br />
            Technical Knowledge
          </h2>
          <p className="mb-8 max-w-lg text-lg text-stone-600">
            Not flashcards. Not memorization. AI-powered validation of real understanding.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/library">Start Learning</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">View Progress</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16 grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resources</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Phase</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">1</p>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Mastery Levels</CardTitle>
            <CardDescription>
              Your journey from exposure to expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              {[
                { level: 0, name: 'Exposed', desc: 'Read/watched' },
                { level: 1, name: 'Understood', desc: 'Can explain' },
                { level: 2, name: 'Applied', desc: 'Used in project' },
                { level: 3, name: 'Criticized', desc: 'Know when NOT to use' },
                { level: 4, name: 'Taught', desc: 'Can teach others' },
              ].map((item) => (
                <div key={item.level} className="rounded-lg border border-stone-200 p-4">
                  <p className="mb-1 text-2xl font-bold text-stone-900">{item.level}</p>
                  <p className="mb-1 text-sm font-medium text-stone-900">{item.name}</p>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <p className="text-sm text-stone-500">
            Named after Jean-Michel Jarre — orchestrator of sound.
          </p>
        </div>
      </footer>
    </div>
  );
}
