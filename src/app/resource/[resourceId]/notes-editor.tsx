'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NoteSection, NoteSubsection } from '@/types/notes';

type Language = 'es' | 'en';

// Client-side translations
const translations = {
  'notes.title': { es: 'Notas', en: 'Notes' },
  'notes.addSection': { es: 'Agregar Sección', en: 'Add Section' },
  'notes.addSubsection': { es: 'Agregar Subsección', en: 'Add Subsection' },
  'notes.sectionTitle': { es: 'Título de la sección', en: 'Section title' },
  'notes.subsectionTitle': { es: 'Título de la subsección', en: 'Subsection title' },
  'notes.save': { es: 'Guardar', en: 'Save' },
  'notes.cancel': { es: 'Cancelar', en: 'Cancel' },
  'notes.saving': { es: 'Guardando...', en: 'Saving...' },
  'notes.saved': { es: 'Guardado', en: 'Saved' },
  'notes.empty': { es: 'No hay notas aún. ¡Agrega tu primera sección!', en: 'No notes yet. Add your first section!' },
  'notes.placeholder': { es: 'Escribe tus notas aquí...', en: 'Write your notes here...' },
  'notes.delete': { es: 'Eliminar', en: 'Delete' },
  'notes.edit': { es: 'Editar', en: 'Edit' },
} as const;

function t(key: keyof typeof translations, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}

function generateId(): string {
  return crypto.randomUUID();
}

interface NotesEditorProps {
  resourceId: string;
  initialSections: NoteSection[];
  language: Language;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function NotesEditor({ resourceId, initialSections, language }: NotesEditorProps) {
  const [sections, setSections] = useState<NoteSection[]>(initialSections);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(initialSections.map((s) => s.id))
  );
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(
    new Set(initialSections.flatMap((s) => s.subsections.map((sub) => sub.id)))
  );
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null);

  // Save sections to API
  const saveNotes = useCallback(
    async (newSections: NoteSection[]) => {
      setSaveStatus('saving');
      try {
        const response = await fetch(`/api/notes/${resourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: newSections }),
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save notes:', error);
        setSaveStatus('error');
      }
    },
    [resourceId]
  );

  // Add a new section
  const addSection = () => {
    const title = prompt(t('notes.sectionTitle', language));
    if (!title?.trim()) return;

    const newSection: NoteSection = {
      id: generateId(),
      title: title.trim(),
      order: sections.length,
      subsections: [],
    };

    const newSections = [...sections, newSection];
    setSections(newSections);
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
    saveNotes(newSections);
  };

  // Add a subsection to a section
  const addSubsection = (sectionId: string) => {
    const title = prompt(t('notes.subsectionTitle', language));
    if (!title?.trim()) return;

    const newSubsection: NoteSubsection = {
      id: generateId(),
      title: title.trim(),
      order: sections.find((s) => s.id === sectionId)?.subsections.length || 0,
      content: '',
    };

    const newSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          subsections: [...section.subsections, newSubsection],
        };
      }
      return section;
    });

    setSections(newSections);
    setExpandedSubsections((prev) => new Set([...prev, newSubsection.id]));
    setEditingSubsection(newSubsection.id);
    saveNotes(newSections);
  };

  // Update subsection content
  const updateSubsectionContent = (sectionId: string, subsectionId: string, content: string) => {
    const newSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          subsections: section.subsections.map((sub) => {
            if (sub.id === subsectionId) {
              return { ...sub, content };
            }
            return sub;
          }),
        };
      }
      return section;
    });
    setSections(newSections);
  };

  // Save on blur
  const handleSubsectionBlur = () => {
    setEditingSubsection(null);
    saveNotes(sections);
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const confirmMsg =
      language === 'es'
        ? `¿Eliminar "${section?.title}" y todas sus subsecciones?`
        : `Delete "${section?.title}" and all its subsections?`;
    if (!confirm(confirmMsg)) return;

    const newSections = sections
      .filter((s) => s.id !== sectionId)
      .map((s, idx) => ({ ...s, order: idx }));
    setSections(newSections);
    saveNotes(newSections);
  };

  // Delete subsection
  const deleteSubsection = (sectionId: string, subsectionId: string) => {
    const confirmMsg =
      language === 'es' ? '¿Eliminar esta subsección?' : 'Delete this subsection?';
    if (!confirm(confirmMsg)) return;

    const newSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          subsections: section.subsections
            .filter((sub) => sub.id !== subsectionId)
            .map((sub, idx) => ({ ...sub, order: idx })),
        };
      }
      return section;
    });
    setSections(newSections);
    saveNotes(newSections);
  };

  // Rename section
  const renameSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const newTitle = prompt(t('notes.sectionTitle', language), section?.title);
    if (!newTitle?.trim() || newTitle === section?.title) return;

    const newSections = sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, title: newTitle.trim() };
      }
      return s;
    });
    setSections(newSections);
    saveNotes(newSections);
  };

  // Rename subsection
  const renameSubsection = (sectionId: string, subsectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const subsection = section?.subsections.find((sub) => sub.id === subsectionId);
    const newTitle = prompt(t('notes.subsectionTitle', language), subsection?.title);
    if (!newTitle?.trim() || newTitle === subsection?.title) return;

    const newSections = sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          subsections: s.subsections.map((sub) => {
            if (sub.id === subsectionId) {
              return { ...sub, title: newTitle.trim() };
            }
            return sub;
          }),
        };
      }
      return s;
    });
    setSections(newSections);
    saveNotes(newSections);
  };

  // Toggle section expand
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Toggle subsection expand
  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections((prev) => {
      const next = new Set(prev);
      if (next.has(subsectionId)) {
        next.delete(subsectionId);
      } else {
        next.add(subsectionId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('notes.title', language)}</CardTitle>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <span className="text-sm text-stone-500">{t('notes.saving', language)}</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600">{t('notes.saved', language)}</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Error</span>
            )}
            <Button variant="outline" size="sm" onClick={addSection}>
              + {t('notes.addSection', language)}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="py-8 text-center text-stone-500">{t('notes.empty', language)}</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-stone-200 bg-stone-50"
              >
                {/* Section Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-3"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">
                      {expandedSections.has(section.id) ? '▼' : '▶'}
                    </span>
                    <h3 className="font-semibold text-stone-900">{section.title}</h3>
                    <span className="text-xs text-stone-400">
                      ({section.subsections.length})
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => renameSection(section.id)}
                      className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-200"
                    >
                      {t('notes.edit', language)}
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      {t('notes.delete', language)}
                    </button>
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(section.id) && (
                  <div className="border-t border-stone-200 p-3">
                    {/* Subsections */}
                    <div className="space-y-3">
                      {section.subsections.map((subsection) => (
                        <div
                          key={subsection.id}
                          className="rounded-lg border border-stone-200 bg-white"
                        >
                          {/* Subsection Header */}
                          <div
                            className="flex cursor-pointer items-center justify-between p-2"
                            onClick={() => toggleSubsection(subsection.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-400">
                                {expandedSubsections.has(subsection.id) ? '▼' : '▶'}
                              </span>
                              <h4 className="text-sm font-medium text-stone-800">
                                {subsection.title}
                              </h4>
                            </div>
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => renameSubsection(section.id, subsection.id)}
                                className="rounded px-2 py-0.5 text-xs text-stone-500 hover:bg-stone-100"
                              >
                                {t('notes.edit', language)}
                              </button>
                              <button
                                onClick={() => deleteSubsection(section.id, subsection.id)}
                                className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                              >
                                {t('notes.delete', language)}
                              </button>
                            </div>
                          </div>

                          {/* Subsection Content */}
                          {expandedSubsections.has(subsection.id) && (
                            <div className="border-t border-stone-100 p-2">
                              {editingSubsection === subsection.id ? (
                                <textarea
                                  className="w-full rounded border border-stone-200 p-2 text-sm focus:border-stone-400 focus:outline-none"
                                  rows={6}
                                  placeholder={t('notes.placeholder', language)}
                                  value={subsection.content}
                                  onChange={(e) =>
                                    updateSubsectionContent(
                                      section.id,
                                      subsection.id,
                                      e.target.value
                                    )
                                  }
                                  onBlur={handleSubsectionBlur}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="min-h-[60px] cursor-text whitespace-pre-wrap rounded bg-stone-50 p-2 text-sm text-stone-700"
                                  onClick={() => setEditingSubsection(subsection.id)}
                                >
                                  {subsection.content || (
                                    <span className="text-stone-400">
                                      {t('notes.placeholder', language)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Subsection Button */}
                    <button
                      onClick={() => addSubsection(section.id)}
                      className="mt-3 w-full rounded border border-dashed border-stone-300 py-2 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-600"
                    >
                      + {t('notes.addSubsection', language)}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
