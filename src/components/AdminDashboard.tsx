import { useEffect, useState, type FormEvent } from 'react'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { StatCard } from './StatCard'
import { AdminPromotionPanel } from './AdminPromotionPanel'
import { createAdminQuestion, createAdminUser, deleteAdminQuestion, deleteAdminUser, loadAdminData, type AdminQuestion, type AdminStats, type AdminUser, type QuizSuggestion, updateAdminQuestion, updateAdminUser } from '../services/adminService'
import { firebaseErrorMessage } from '../services/authService'

type AdminDashboardProps = { onBack: () => void; onLogout: () => void }

const emptyQuestion: Omit<AdminQuestion, 'id'> = { main_theme: '', question: '', documents: [{ suggestion: '', value: 10 }], status: 'Active' }

export function AdminDashboard({ onBack, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [stats, setStats] = useState<AdminStats>({ users: 0, questions: 0, categories: 0, games: 0 })
  const [connected, setConnected] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [questionFormOpen, setQuestionFormOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ displayName: '', email: '', password: '', status: 'Active' as AdminUser['status'] })
  const [newQuestion, setNewQuestion] = useState(emptyQuestion)
  const [error, setError] = useState('')

  async function refresh() {
    try {
      setError('')
      const data = await loadAdminData()
      setUsers(data.users); setQuestions(data.questions); setStats(data.stats); setConnected(data.connected)
    } catch (reason) {
      setError(firebaseErrorMessage(reason, 'Impossible de charger les données administrateur.'))
    }
  }

  useEffect(() => { void refresh() }, [])

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault(); try { setError(''); await createAdminUser(newUser, newUser.password); setUserFormOpen(false); setNewUser({ displayName: '', email: '', password: '', status: 'Active' }); await refresh() } catch (reason) { setError(firebaseErrorMessage(reason, 'Impossible de créer cet utilisateur.')) }
  }

  async function handleCreateQuestion(event: FormEvent) {
    event.preventDefault(); try { setError(''); if (editingQuestionId) { const original = questions.find((item) => item.id === editingQuestionId); if (original) await updateAdminQuestion({ ...original, ...newQuestion }) } else await createAdminQuestion(newQuestion); setQuestionFormOpen(false); setEditingQuestionId(null); setNewQuestion(emptyQuestion); await refresh() } catch (reason) { setError(firebaseErrorMessage(reason, 'Impossible d’enregistrer cette question.')) }
  }

  function updateSuggestion(index: number, patch: Partial<QuizSuggestion>) {
    setNewQuestion((current) => ({ ...current, documents: current.documents.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }))
  }

  function editQuestion(question: AdminQuestion) {
    setEditingQuestionId(question.id); setNewQuestion({ main_theme: question.main_theme, question: question.question, documents: question.documents, status: question.status }); setQuestionFormOpen(true)
  }

  return <section className="admin-page page">{error && <p className="auth-error" role="alert">{error}</p>}<AdminPromotionPanel users={users} onPromoted={refresh} />
    <div className="admin-heading"><div><div className="eyebrow">ADMINISTRATION</div><h2>Dashboard</h2><p className="lead">Pilotez les joueurs, les questions et les parties.</p></div><div className="admin-heading-actions"><Badge tone={connected ? 'success' : 'warning'}>{connected ? 'Firestore connecté' : 'Mode démo'}</Badge><button className="admin-menu-button" aria-label="Ouvrir le menu admin">☰</button><SecondaryButton onClick={onBack}>← Retour au jeu</SecondaryButton><SecondaryButton onClick={onLogout}>↪ Déconnexion</SecondaryButton></div></div>
    <div className="admin-stats"><StatCard icon="♙" label="Utilisateurs" value={String(stats.users)} detail="Comptes inscrits" tone="rose" /><StatCard icon="?" label="Questions" value={String(stats.questions)} detail="Questions disponibles" tone="blue" /><StatCard icon="▦" label="Catégories" value={String(stats.categories)} detail="Thèmes actifs" tone="gold" /><StatCard icon="★" label="Parties" value={String(stats.games)} detail="Parties jouées" tone="green" /></div>
  <section className="admin-panel"><div className="admin-panel-heading"><div><div className="eyebrow">COMPTES</div><h3>User Management</h3></div><PrimaryButton onClick={() => setUserFormOpen(!userFormOpen)}>+ Créer un utilisateur</PrimaryButton></div>{userFormOpen && <form className="admin-inline-form" onSubmit={handleCreateUser}><input placeholder="Nom complet" value={newUser.displayName} onChange={(event) => setNewUser({ ...newUser, displayName: event.target.value })} required /><input type="email" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required /><input type="password" minLength={6} placeholder="Mot de passe" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required /><select value={newUser.status} onChange={(event) => setNewUser({ ...newUser, status: event.target.value as AdminUser['status'] })}><option>Active</option><option>Inactive</option><option>Banned</option></select><PrimaryButton type="submit">Ajouter</PrimaryButton></form>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilisateur</th><th>Email</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="table-user"><Avatar name={user.displayName} /><strong>{user.displayName}</strong></span></td><td>{user.email}</td><td><Badge tone={user.status === 'Active' ? 'success' : user.status === 'Banned' ? 'danger' : 'warning'}>{user.status}</Badge></td><td><button className="table-action" title="Modifier" onClick={() => void updateAdminUser({ ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }).then(refresh)}>✎</button><button className="table-action danger-action" title="Supprimer" onClick={() => void deleteAdminUser(user.id).then(refresh)}>⌫</button></td></tr>)}</tbody></table></div></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><div className="eyebrow">CONTENU</div><h3>Question Management</h3></div><PrimaryButton onClick={() => { setEditingQuestionId(null); setNewQuestion(emptyQuestion); setQuestionFormOpen(!questionFormOpen) }}>Add New +</PrimaryButton></div>{questionFormOpen && <form className="question-form" onSubmit={handleCreateQuestion}><input placeholder="Thème" value={newQuestion.main_theme} onChange={(event) => setNewQuestion({ ...newQuestion, main_theme: event.target.value })} required /><textarea placeholder="Question" value={newQuestion.question} onChange={(event) => setNewQuestion({ ...newQuestion, question: event.target.value })} required /><div className="suggestion-editor">{newQuestion.documents.map((item, index) => <div className="suggestion-row" key={index}><input placeholder={`Suggestion ${index + 1}`} value={item.suggestion} onChange={(event) => updateSuggestion(index, { suggestion: event.target.value })} required /><input type="number" min="0" placeholder="Points" value={item.value} onChange={(event) => updateSuggestion(index, { value: Number(event.target.value) })} required /><button type="button" className="table-action danger-action" onClick={() => setNewQuestion((current) => ({ ...current, documents: current.documents.filter((_, itemIndex) => itemIndex !== index) }))}>⌫</button></div>)}<SecondaryButton type="button" onClick={() => setNewQuestion((current) => ({ ...current, documents: [...current.documents, { suggestion: '', value: 10 }] }))}>+ Ajouter une suggestion</SecondaryButton></div><select value={newQuestion.status} onChange={(event) => setNewQuestion({ ...newQuestion, status: event.target.value as AdminQuestion['status'] })}><option>Active</option><option>Inactive</option></select><PrimaryButton type="submit">{editingQuestionId ? 'Mettre à jour' : 'Enregistrer la question'}</PrimaryButton></form>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Question</th><th>Thème</th><th>Réponses</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{questions.map((item) => <tr key={item.id}><td className="question-cell">{item.question}</td><td>{item.main_theme}</td><td>{item.documents.length}</td><td><Badge tone={item.status === 'Active' ? 'success' : 'warning'}>{item.status}</Badge></td><td><button className="table-action" title="Modifier" onClick={() => editQuestion(item)}>✎</button><button className="table-action danger-action" title="Supprimer" onClick={() => void deleteAdminQuestion(item).then(refresh)}>⌫</button></td></tr>)}</tbody></table></div></section>
  </section>
}
