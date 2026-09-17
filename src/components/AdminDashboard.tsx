import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { ActivityChart, BreakdownChart } from './Charts'
import { AdminPromotionPanel } from './AdminPromotionPanel'
import { QuestionEditor, emptyDraft, toDraft, type QuestionDraft } from './QuestionEditor'
import {
  createAdminUser, deleteAdminUser, isDemoId, loadAdminData, updateAdminUser,
  type AdminData, type AdminUser,
} from '../services/adminService'
import { createQuestion, deleteQuestion, updateQuestion } from '../services/quizService'
import { gamesPerDay } from '../services/gameHistoryService'
import { firebaseErrorMessage } from '../services/authService'
import { themeLabel, type QuizQuestion } from '../data/questionBank'
import type { Language, Translate, TranslationKey } from '../services/i18n'

type AdminDashboardProps = { t: Translate; language: Language; onBack: () => void; onLogout: () => void }
type Tab = 'overview' | 'users' | 'questions' | 'access'

const emptyUser = { displayName: '', email: '', password: '', status: 'Active' as AdminUser['status'] }
const tabs: { id: Tab; key: TranslationKey }[] = [
  { id: 'overview', key: 'overview' },
  { id: 'users', key: 'adminUsersLabel' },
  { id: 'questions', key: 'adminQuestionsLabel' },
  { id: 'access', key: 'access' },
]

export function AdminDashboard({ t, language, onBack, onLogout }: AdminDashboardProps) {
  const [data, setData] = useState<AdminData | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [newUser, setNewUser] = useState(emptyUser)
  const [editing, setEditing] = useState<QuizQuestion | null>(null)
  const [questionFormOpen, setQuestionFormOpen] = useState(false)
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    try {
      setError('')
      setData(await loadAdminData())
    } catch (reason) {
      setError(firebaseErrorMessage(reason, t('profileLoadError')))
    }
  }, [t])

  useEffect(() => { void refresh() }, [refresh])

  /** Enveloppe les écritures : rafraîchit la vue, affiche l'erreur éventuelle. */
  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      setError('')
      await action()
      await refresh()
    } catch (reason) {
      setError(firebaseErrorMessage(reason, t('profileLoadError')))
    }
  }, [refresh, t])

  const activity = useMemo(() => gamesPerDay(data?.games ?? [], 14), [data?.games])
  const perTheme = useMemo(() => {
    const counts = new Map<string, number>()
    for (const question of data?.questions ?? []) counts.set(question.themeId, (counts.get(question.themeId) ?? 0) + 1)
    return [...counts].map(([themeId, value]) => ({ label: themeLabel(themeId, language), value }))
  }, [data?.questions, language])
  const topScores = useMemo(
    () => (data?.games ?? [])
      .slice()
      .sort((left, right) => right.topScore - left.topScore)
      .slice(0, 5)
      .map((record) => ({ label: record.teamNames[record.winnerIndex] || record.hostName, value: record.topScore })),
    [data?.games],
  )

  // Recherche appliquée à l'onglet courant : au-delà de quelques dizaines de
  // lignes, parcourir un tableau à l'œil devient impraticable.
  const needle = search.trim().toLowerCase()
  const visibleUsers = useMemo(
    () => (data?.users ?? []).filter((user) => !needle || `${user.displayName} ${user.email}`.toLowerCase().includes(needle)),
    [data?.users, needle],
  )
  const visibleQuestions = useMemo(
    () => (data?.questions ?? []).filter((question) => !needle || question.prompt[language].toLowerCase().includes(needle)),
    [data?.questions, needle, language],
  )

  async function submitUser(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await createAdminUser(newUser, newUser.password)
      setUserFormOpen(false)
      setNewUser(emptyUser)
    })
  }

  async function submitQuestion(draft: QuestionDraft) {
    await run(async () => {
      if (editing) await updateQuestion({ ...draft, id: editing.id })
      else await createQuestion(draft)
      setQuestionFormOpen(false)
      setEditing(null)
    })
  }

  const canEditQuestions = data?.questionSource === 'firestore'

  if (!data) {
    return (
      <div className="page admin-page">
        <div className="panel skeleton-panel" role="status" aria-label={t('loading')}>
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
        </div>
      </div>
    )
  }

  return (
    <div className="page admin-page">
      <header className="admin-heading">
        <div>
          <div className="eyebrow">{t('adminEyebrow')}</div>
          <h1>{t('adminTitle')}</h1>
          <p className="lead">{t('adminLead')}</p>
        </div>
        <div className="admin-heading-actions">
          <Badge tone={data.connected ? 'success' : 'warning'}>{data.connected ? t('firestoreConnected') : t('demoMode')}</Badge>
          <SecondaryButton onClick={onBack}>{t('backToGame')}</SecondaryButton>
          <SecondaryButton onClick={onLogout}>{t('signOut')}</SecondaryButton>
        </div>
      </header>

      {error && <p className="auth-error admin-error" role="alert">{error}</p>}

      <div className="admin-stats">
        <article className="stat-card">
          <span className="stat-icon stat-rose" aria-hidden="true">♙</span>
          <div><strong>{data.stats.users}</strong><h3>{t('adminUsersLabel')}</h3><p>{t('adminUsersDetail')}</p></div>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-blue" aria-hidden="true">?</span>
          <div><strong>{data.stats.questions}</strong><h3>{t('adminQuestionsLabel')}</h3><p>{t('adminQuestionsDetail')}</p></div>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-gold" aria-hidden="true">▦</span>
          <div><strong>{data.stats.categories}</strong><h3>{t('adminCategoriesLabel')}</h3><p>{t('adminCategoriesDetail')}</p></div>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-green" aria-hidden="true">★</span>
          <div><strong>{data.stats.games}</strong><h3>{t('adminGamesLabel')}</h3><p>{t('adminGamesDetail')}</p></div>
        </article>
      </div>

      {/* Onglets : le tableau de bord empilait six blocs sur une page
          interminable. On ne montre qu'une section à la fois. */}
      <div className="admin-tabs" role="tablist" aria-label={t('manageSection')}>
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-current' : ''}
            onClick={() => { setTab(item.id); setSearch('') }}
          >
            {t(item.key)}
          </button>
        ))}
        {(tab === 'users' || tab === 'questions') && (
          <input
            className="admin-search"
            type="search"
            value={search}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
      </div>

      {tab === 'overview' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><div className="eyebrow">{t('analytics')}</div><h3>{t('overview')}</h3></div>
          </div>
          <div className="chart-grid-layout">
            <ActivityChart data={activity} caption={t('activityChart')} />
            <BreakdownChart data={perTheme} caption={t('themeChart')} emptyLabel={t('noData')} />
            <BreakdownChart data={topScores} caption={t('scoreChart')} emptyLabel={t('noData')} />
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><div className="eyebrow">{t('accounts')}</div><h3>{t('userManagement')}</h3></div>
            <PrimaryButton onClick={() => setUserFormOpen(!userFormOpen)} disabled={!data.connected}>{t('createUserButton')}</PrimaryButton>
          </div>

          {userFormOpen && (
            <form className="admin-inline-form" onSubmit={submitUser}>
              <input placeholder={t('fullName')} value={newUser.displayName} onChange={(event) => setNewUser({ ...newUser, displayName: event.target.value })} required />
              <input type="email" placeholder={t('email')} value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required />
              <input type="password" minLength={6} placeholder={t('password')} value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required />
              <select value={newUser.status} onChange={(event) => setNewUser({ ...newUser, status: event.target.value as AdminUser['status'] })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Banned">Banned</option>
              </select>
              <PrimaryButton type="submit">{t('add')}</PrimaryButton>
            </form>
          )}

          {visibleUsers.length === 0
            ? <div className="empty-state"><span aria-hidden="true">◈</span><p>{t('noData')}</p></div>
            : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>{t('tableUser')}</th><th>{t('email')}</th><th>{t('tableStatus')}</th><th>{t('tableActions')}</th></tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((user) => (
                      <tr key={user.id}>
                        <td><span className="table-user"><Avatar name={user.displayName} /><strong>{user.displayName}</strong></span></td>
                        <td>{user.email}</td>
                        <td><Badge tone={user.status === 'Active' ? 'success' : user.status === 'Banned' ? 'danger' : 'warning'}>{user.status}</Badge></td>
                        <td>
                          <button
                            className="table-action"
                            title={t('edit')}
                            disabled={isDemoId(user.id)}
                            onClick={() => void run(() => updateAdminUser({ ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }))}
                          >✎</button>
                          <button
                            className="table-action danger-action"
                            title={t('delete')}
                            disabled={isDemoId(user.id)}
                            onClick={() => { if (window.confirm(t('deleteConfirm'))) void run(() => deleteAdminUser(user.id)) }}
                          >⌫</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}

      {tab === 'questions' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><div className="eyebrow">{t('content')}</div><h3>{t('questionManagement')}</h3></div>
            <PrimaryButton
              disabled={!canEditQuestions}
              onClick={() => { setEditing(null); setQuestionFormOpen(!questionFormOpen) }}
            >{t('addQuestionButton')}</PrimaryButton>
          </div>

          {!canEditQuestions && <p className="chart-empty" role="status">{t('adminOnlyLocal')}</p>}

          {questionFormOpen && canEditQuestions && (
            <QuestionEditor
              t={t}
              language={language}
              editing={editing !== null}
              initial={editing ? toDraft(editing) : emptyDraft}
              onSubmit={submitQuestion}
              onCancel={() => { setQuestionFormOpen(false); setEditing(null) }}
            />
          )}

          {visibleQuestions.length === 0
            ? <div className="empty-state"><span aria-hidden="true">◈</span><p>{t('noData')}</p></div>
            : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>{t('tableQuestion')}</th><th>{t('tableTheme')}</th><th>{t('tableAnswers')}</th><th>{t('tableActions')}</th></tr>
                  </thead>
                  <tbody>
                    {visibleQuestions.map((question) => (
                      <tr key={question.id}>
                        <td className="question-cell">{question.prompt[language]}</td>
                        <td>{themeLabel(question.themeId, language)}</td>
                        <td>{question.answers.filter((answer) => answer.correct).length} / {question.answers.length}</td>
                        <td>
                          <button
                            className="table-action"
                            title={t('edit')}
                            disabled={!canEditQuestions}
                            onClick={() => { setEditing(question); setQuestionFormOpen(true) }}
                          >✎</button>
                          <button
                            className="table-action danger-action"
                            title={t('delete')}
                            disabled={!canEditQuestions}
                            onClick={() => { if (window.confirm(t('deleteConfirm'))) void run(() => deleteQuestion(question.id)) }}
                          >⌫</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}

      {tab === 'access' && <AdminPromotionPanel t={t} users={data.users} onPromoted={refresh} />}
    </div>
  )
}
