import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppLogo } from './components/AppLogo'
import { AppNav } from './components/AppNav'
import { AppFooter } from './components/AppFooter'
import { PrimaryButton } from './components/Buttons'
import { AdminDashboard } from './components/AdminDashboard'
import { MenuScreen } from './screens/MenuScreen'
import { SetupScreen } from './screens/SetupScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { AuthScreen } from './screens/AuthScreen'
import { OnlineScreen } from './screens/OnlineScreen'
import { useGameEngine } from './game/useGameEngine'
import { useRoom } from './game/useRoom'
import { useRouter } from './navigation/useRouter'
import { questionBank, themeIds, themes, type ThemeId } from './data/questionBank'
import { isCurrentUserAdmin } from './services/adminService'
import { createMissingUserProfile } from './services/authService'
import { useAuth } from './context/AuthContext'
import { getMissingFirebaseConfigKeys } from './services/firebase'
import { loadPlayerStats, saveGameResult, type PlayerStats } from './services/gameHistoryService'
import { loadQuestions, type QuestionSource } from './services/quizService'
import { loadSoundPreferences, playVictorySound, saveSoundPreferences, syncSoundPreferences, type SoundPreferences } from './services/soundService'
import { loadLanguage, saveLanguage, syncLanguage, translator, type Language } from './services/i18n'
import './App.css'

const MAX_TEAMS = 6
const SPLASH_KEY = 'tunifith-splash-seen'

function App() {
  const { user, loading: authLoading, profile, profileLoading, profileExists, profileError, login, loginWithEmail, signupWithEmail, logout } = useAuth()
  const { screen, navigate } = useRouter()

  const [language, setLanguage] = useState<Language>(() => loadLanguage())
  const [sound, setSound] = useState<SoundPreferences>(() => loadSoundPreferences())
  /**
   * Vérification du rôle administrateur.
   *
   * Le résultat porte l'identifiant sur lequel il a été calculé. Sans cela, le
   * verdict obtenu pour « personne connectée » restait considéré comme valide à
   * l'instant où la session se rétablissait, et la garde de route renvoyait un
   * administrateur légitime à l'accueil lorsqu'il ouvrait /admin directement.
   */
  const [adminCheck, setAdminCheck] = useState<{ uid: string | null; isAdmin: boolean } | null>(null)

  // L'écran d'accueil animé ne s'affiche qu'une fois par session, et reste
  // interruptible : le faire subir à chaque navigation serait une punition.
  const [splash, setSplash] = useState(() => {
    try { return window.sessionStorage.getItem(SPLASH_KEY) === null } catch { return true }
  })

  const [questions, setQuestions] = useState(questionBank)
  const [source, setSource] = useState<QuestionSource>('local')

  const [teams, setTeams] = useState(3)
  const [rounds, setRounds] = useState(5)
  const [teamNames, setTeamNames] = useState<string[]>(() => Array(MAX_TEAMS).fill(''))
  const [selectedThemes, setSelectedThemes] = useState<ThemeId[]>(themeIds)

  const [stats, setStats] = useState<PlayerStats | null>(null)

  const t = useMemo(() => translator(language), [language])
  const firebaseReady = useMemo(() => getMissingFirebaseConfigKeys().length === 0, [])
  const game = useGameEngine(questions, sound)
  const savedGame = useRef(false)

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || t('guestShort')
  const roomUser = useMemo(() => (user ? { uid: user.uid, name: displayName } : null), [user, displayName])
  const room = useRoom(roomUser, sound)

  // ── Écran d'accueil ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!splash) return
    const dismiss = () => {
      setSplash(false)
      try { window.sessionStorage.setItem(SPLASH_KEY, '1') } catch { /* stockage indisponible */ }
    }
    const timer = window.setTimeout(dismiss, 1900)
    window.addEventListener('keydown', dismiss)
    window.addEventListener('pointerdown', dismiss)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('pointerdown', dismiss)
    }
  }, [splash])

  // ── Chargement du contenu ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    void loadQuestions().then(({ questions: loaded, source: loadedSource }) => {
      if (!active) return
      setQuestions(loaded)
      setSource(loadedSource)
    })
    return () => { active = false }
  }, [user?.uid])

  useEffect(() => { saveLanguage(language); void syncLanguage(language) }, [language])
  useEffect(() => { saveSoundPreferences(sound); void syncSoundPreferences(sound) }, [sound])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  // ── Droits d'accès ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const uid = user?.uid ?? null
    void isCurrentUserAdmin()
      .then((result) => { if (active) setAdminCheck({ uid, isAdmin: result }) })
      .catch(() => { if (active) setAdminCheck({ uid, isAdmin: false }) })
    return () => { active = false }
  }, [user?.uid])

  // Le verdict n'est exploitable que s'il porte sur la session courante.
  const adminReady = !authLoading && adminCheck !== null && adminCheck.uid === (user?.uid ?? null)
  const isAdmin = adminReady && adminCheck.isAdmin

  // Garde de route : /admin sans les droits renvoie à l'accueil (ou à la
  // connexion), sans laisser d'entrée d'historique vers une page interdite.
  useEffect(() => {
    if (screen !== 'admin' || !adminReady) return
    if (!user) navigate('login', { replace: true })
    else if (!isAdmin) navigate('menu', { replace: true })
  }, [screen, isAdmin, adminReady, user, navigate])

  // ── Statistiques ──────────────────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    void loadPlayerStats(user?.uid ?? null).then(setStats)
  }, [user?.uid])

  useEffect(() => { refreshStats() }, [refreshStats, screen === 'profile', screen === 'menu'])

  // ── Fin de partie ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (game.phase !== 'finished' || savedGame.current || !game.config) return
    savedGame.current = true

    const topScore = Math.max(...game.scores, 0)
    void saveGameResult({
      uid: user?.uid ?? null,
      hostName: displayName,
      teamNames: game.config.teamNames,
      scores: game.scores,
      rounds: game.config.rounds,
      themes: game.config.themes,
      winnerIndex: game.scores.indexOf(topScore),
      topScore,
      totalPoints: game.scores.reduce((total, score) => total + score, 0),
    }).then(refreshStats)

    playVictorySound(sound)
    navigate('results', { replace: true })
  }, [game.phase, game.config, game.scores, user, displayName, sound, refreshStats, navigate])

  // ── Actions ───────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (selectedThemes.length === 0) return
    savedGame.current = false
    game.start({
      teams,
      rounds,
      themes: selectedThemes,
      teamNames: Array.from({ length: teams }, (_, index) => teamNames[index]?.trim() || `${t('team')} ${index + 1}`),
    })
    navigate('game')
  }, [selectedThemes, teams, rounds, teamNames, game, navigate, t])

  function updateTeamName(index: number, name: string) {
    setTeamNames((current) => current.map((item, itemIndex) => (itemIndex === index ? name : item)))
  }

  const goHome = useCallback(() => {
    if (room.inRoom) void room.leave()
    game.reset()
    navigate('menu')
  }, [game, room, navigate])

  const availableCount = useMemo(
    () => questions.filter((question) => selectedThemes.includes(question.themeId)).length,
    [questions, selectedThemes],
  )

  if (splash) {
    return (
      <main className="splash" role="status" aria-label="Tunisia Guess Game">
        <AppLogo />
        <span>{t('quizEyebrow')}</span>
        <button className="splash-skip">{t('skip')}</button>
      </main>
    )
  }

  return (
    <div className="app-shell" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppNav
        t={t}
        language={language}
        screen={screen}
        user={user}
        displayName={displayName}
        isAdmin={isAdmin}
        onNavigate={(next) => { if (next === 'menu') goHome(); else navigate(next) }}
        onLanguageChange={setLanguage}
        onLogout={() => void logout()}
      />

      <main className="app-main">
        {screen === 'menu' && (
          <MenuScreen
            t={t}
            user={user}
            stats={stats}
            questionCount={questions.length}
            offline={source !== 'firestore'}
            onNavigate={navigate}
          />
        )}

        {screen === 'setup' && (
          <SetupScreen
            t={t}
            language={language}
            teams={teams}
            rounds={rounds}
            teamNames={teamNames}
            selectedThemes={selectedThemes}
            availableCount={availableCount}
            onTeamsChange={setTeams}
            onRoundsChange={setRounds}
            onTeamNameChange={updateTeamName}
            onThemesChange={setSelectedThemes}
            onStart={startGame}
          />
        )}

        {screen === 'game' && (
          game.phase === 'playing'
            ? <GameScreen t={t} language={language} game={game} />
            : <EmptyRoute t={t} onAction={() => navigate('setup')} title={t('sessionExpired')} action={t('startNewGame')} />
        )}

        {screen === 'results' && (
          game.config
            ? <ResultsScreen
                t={t}
                scores={game.scores}
                teamNames={game.config.teamNames}
                onReplay={() => { game.reset(); navigate('setup') }}
                onBackToMenu={goHome}
              />
            : <EmptyRoute t={t} onAction={() => navigate('setup')} title={t('sessionExpired')} action={t('startNewGame')} />
        )}

        {screen === 'settings' && (
          <SettingsScreen t={t} language={language} sound={sound} onLanguageChange={setLanguage} onSoundChange={setSound} />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            t={t}
            language={language}
            user={user}
            profile={profile}
            profileLoading={profileLoading}
            profileExists={profileExists}
            profileError={profileError}
            authLoading={authLoading}
            stats={stats}
            onCreateProfile={() => user && void createMissingUserProfile(user)}
            onLogout={() => void logout()}
            onSignIn={() => navigate('login')}
          />
        )}

        {(screen === 'login' || screen === 'signup') && (
          <AuthScreen
            t={t}
            mode={screen}
            disabled={!firebaseReady}
            disabledNotice={t('offlineNotice')}
            onLogin={login}
            onEmailLogin={loginWithEmail}
            onEmailSignup={signupWithEmail}
            onNavigate={navigate}
          />
        )}

        {screen === 'online' && (
          <OnlineScreen
            t={t}
            language={language}
            room={room}
            signedIn={Boolean(user)}
            firebaseReady={firebaseReady}
            onSignIn={() => navigate('login')}
          />
        )}

        {screen === 'admin' && (
          isAdmin
            ? <AdminDashboard t={t} language={language} onBack={goHome} onLogout={() => void logout()} />
            : (
              // Pendant la vérification du rôle : un squelette, pas un écran vide.
              <div className="page">
                <div className="panel skeleton-panel" role="status" aria-label={t('loading')}>
                  <span className="skeleton skeleton-line" />
                  <span className="skeleton skeleton-line short" />
                </div>
              </div>
            )
        )}
      </main>

      {/* Le pied de page est masqué pendant une partie : rien ne doit détourner
          l'attention du plateau. */}
      {screen !== 'game' && (
        <AppFooter t={t} questionCount={questions.length} themeCount={themes.length} />
      )}
    </div>
  )
}

/** Route atteinte sans l'état requis (partie rechargée, lien direct périmé). */
function EmptyRoute({ t, title, action, onAction }: { t: ReturnType<typeof translator>; title: string; action: string; onAction: () => void }) {
  return (
    <section className="page empty-route">
      <div className="empty-route-card">
        <span className="empty-route-mark" aria-hidden="true">◈</span>
        <h2>{title}</h2>
        <p className="lead">{t('notFoundLead')}</p>
        <PrimaryButton onClick={onAction}>{action} <span>→</span></PrimaryButton>
      </div>
    </section>
  )
}

export default App
