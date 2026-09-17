import { useState, type FormEvent } from 'react'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { themes, type QuizAnswer, type QuizQuestion, type ThemeId } from '../data/questionBank'
import type { Language, Translate } from '../services/i18n'

type Draft = Omit<QuizQuestion, 'id'>

export const emptyDraft: Draft = {
  themeId: 'patrimoine',
  prompt: { fr: '', ar: '' },
  answers: [
    { label: { fr: '', ar: '' }, points: 40, correct: true },
    { label: { fr: '', ar: '' }, points: 30, correct: true },
    { label: { fr: '', ar: '' }, points: 0, correct: false },
  ],
}

export function toDraft(question: QuizQuestion): Draft {
  return { themeId: question.themeId, prompt: { ...question.prompt }, answers: question.answers.map((answer) => ({ ...answer, label: { ...answer.label } })) }
}

type QuestionEditorProps = {
  t: Translate
  language: Language
  initial: Draft
  editing: boolean
  onSubmit: (draft: Draft) => Promise<void>
  onCancel: () => void
}

export function QuestionEditor({ t, language, initial, editing, onSubmit, onCancel }: QuestionEditorProps) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [busy, setBusy] = useState(false)

  function patchAnswer(index: number, patch: Partial<QuizAnswer>) {
    setDraft((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) => (answerIndex === index ? { ...answer, ...patch } : answer)),
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await onSubmit(draft)
    } finally {
      setBusy(false)
    }
  }

  const hasCorrect = draft.answers.some((answer) => answer.correct && answer.label.fr.trim() !== '')

  return (
    <form className="question-form" onSubmit={submit}>
      <label className="field">
        <span>{t('themeField')}</span>
        <select value={draft.themeId} onChange={(event) => setDraft({ ...draft, themeId: event.target.value as ThemeId })}>
          {themes.map((theme) => <option value={theme.id} key={theme.id}>{theme.label[language]}</option>)}
        </select>
      </label>

      <label className="field">
        <span>{t('questionFr')}</span>
        <textarea value={draft.prompt.fr} onChange={(event) => setDraft({ ...draft, prompt: { ...draft.prompt, fr: event.target.value } })} required />
      </label>

      <label className="field">
        <span>{t('questionAr')}</span>
        <textarea dir="rtl" value={draft.prompt.ar} onChange={(event) => setDraft({ ...draft, prompt: { ...draft.prompt, ar: event.target.value } })} />
      </label>

      <div className="suggestion-editor">
        {draft.answers.map((answer, index) => (
          <div className="suggestion-row" key={index}>
            <input
              placeholder={t('answerFr')}
              value={answer.label.fr}
              onChange={(event) => patchAnswer(index, { label: { ...answer.label, fr: event.target.value } })}
              required
            />
            <input
              dir="rtl"
              placeholder={t('answerAr')}
              value={answer.label.ar}
              onChange={(event) => patchAnswer(index, { label: { ...answer.label, ar: event.target.value } })}
            />
            <input
              type="number"
              min="0"
              step="5"
              aria-label={t('answerPoints')}
              value={answer.points}
              onChange={(event) => patchAnswer(index, { points: Number(event.target.value) })}
            />
            <label className="suggestion-correct" title={t('answerCorrect')}>
              <input
                type="checkbox"
                checked={answer.correct}
                onChange={(event) => patchAnswer(index, { correct: event.target.checked, points: event.target.checked ? answer.points : 0 })}
              />
              <span>✓</span>
            </label>
            <button
              type="button"
              className="table-action danger-action"
              aria-label={t('delete')}
              onClick={() => setDraft((current) => ({ ...current, answers: current.answers.filter((_, answerIndex) => answerIndex !== index) }))}
            >⌫</button>
          </div>
        ))}
        <SecondaryButton
          type="button"
          onClick={() => setDraft((current) => ({ ...current, answers: [...current.answers, { label: { fr: '', ar: '' }, points: 10, correct: true }] }))}
        >{t('addAnswer')}</SecondaryButton>
      </div>

      <div className="question-form-actions">
        <PrimaryButton type="submit" disabled={busy || !hasCorrect}>{editing ? t('update') : t('save')}</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>{t('cancel')}</SecondaryButton>
      </div>
    </form>
  )
}

export type { Draft as QuestionDraft }
