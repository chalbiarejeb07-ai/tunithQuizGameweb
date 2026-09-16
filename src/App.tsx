import { useEffect, useMemo, useState } from 'react'
import { Avatar } from './components/Avatar'
import { AppLogo } from './components/AppLogo'
import { Badge } from './components/Badge'
import { PrimaryButton, SecondaryButton } from './components/Buttons'
import { PageHeader } from './components/PageHeader'
import { Slider } from './components/Slider'
import { StatCard } from './components/StatCard'
import { AdminDashboard } from './components/AdminDashboard'
import { isCurrentUserAdmin } from './services/adminService'
import { createMissingUserProfile, firebaseErrorMessage } from './services/authService'
import { useAuth } from './context/AuthContext'
import { loadVictorySoundPreferences, playVictorySound, saveVictorySoundPreferences, syncVictorySoundPreferences, type VictorySoundId, type VictorySoundPreferences } from './services/victorySoundPreferences'
import { loadLanguage, saveLanguage, syncLanguage, translate, type Language } from './services/i18n'
import './App.css'

  type Screen = 'splash' | 'menu' | 'setup' | 'game' | 'results' | 'settings' | 'profile' | 'login' | 'signup' | 'admin'
  type Answer = { suggestion: string; value: number }

  const questions = [
    { theme: 'Patrimoine', question: 'Quel monument emblématique se trouve au centre de Tunis ?', answers: [{ suggestion: 'La médina de Tunis', value: 40 }, { suggestion: 'Le Colisée d’El Jem', value: 25 }, { suggestion: 'Sidi Bou Saïd', value: 15 }, { suggestion: 'Le musée du Bardo', value: 10 }] },
    { theme: 'Cuisine', question: 'Quels ingrédients retrouve-t-on dans une salade méchouia ?', answers: [{ suggestion: 'Poivrons grillés', value: 40 }, { suggestion: 'Tomates', value: 30 }, { suggestion: 'Ail', value: 20 }, { suggestion: 'Thon', value: 10 }] },
    { theme: 'Géographie', question: 'Quelle est la plus grande île de Tunisie ?', answers: [{ suggestion: 'Djerba', value: 40 }, { suggestion: 'Kerkennah', value: 25 }, { suggestion: 'Zembra', value: 15 }, { suggestion: 'La Galite', value: 10 }] },
  ]

  function App() {
    const { user, loading: authLoading, profile, profileLoading, profileExists, profileError, login, loginWithEmail, signupWithEmail, logout } = useAuth()
    const [screen, setScreen] = useState<Screen>('splash')
    const [teams, setTeams] = useState(3)
    const [rounds, setRounds] = useState(5)
    const [teamIndex, setTeamIndex] = useState(0)
    const [round, setRound] = useState(1)
    const [timeLeft, setTimeLeft] = useState(60)
    const [running, setRunning] = useState(false)
    const [finishedTurn, setFinishedTurn] = useState(false)
    const [selected, setSelected] = useState<number[]>([])
    const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0])
    const [sound, setSound] = useState(true)
    const [music, setMusic] = useState(true)
    const [victorySound, setVictorySound] = useState<VictorySoundPreferences>(() => loadVictorySoundPreferences())
    const [language, setLanguage] = useState<Language>(() => loadLanguage())
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => { const splash = window.setTimeout(() => setScreen('menu'), 1800); return () => window.clearTimeout(splash) }, [])
    const question = questions[(round - 1) % questions.length]
    const turnScore = useMemo(() => selected.reduce((sum, index) => sum + question.answers[index].value, 0), [selected, question])
    useEffect(() => { if (!running || timeLeft <= 0) return; const timer = window.setInterval(() => setTimeLeft((time) => time - 1), 1000); return () => window.clearInterval(timer) }, [running, timeLeft])
    useEffect(() => { if (timeLeft === 0 && running) finishTurn() }, [timeLeft, running])
    useEffect(() => { saveVictorySoundPreferences(victorySound); void syncVictorySoundPreferences(victorySound) }, [victorySound])
    useEffect(() => { saveLanguage(language); void syncLanguage(language) }, [language])
    useEffect(() => { if (screen === 'results') playVictorySound(victorySound) }, [screen, victorySound])
    useEffect(() => { if (screen === 'admin' && !isAdmin) setScreen('login') }, [screen, isAdmin])
    useEffect(() => { void isCurrentUserAdmin().then(setIsAdmin).catch(() => setIsAdmin(false)) }, [screen, user?.uid])

    function resetTurn() { setTimeLeft(60); setRunning(false); setFinishedTurn(false); setSelected([]) }
    function startGame() { setScores(Array(teams).fill(0)); setTeamIndex(0); setRound(1); resetTurn(); setScreen('game') }
    function finishTurn() { setRunning(false); setFinishedTurn(true); setScores((current) => current.map((score, index) => index === teamIndex ? score + turnScore : score)) }
    function nextTurn() { if (teamIndex + 1 < teams) { setTeamIndex(teamIndex + 1); resetTurn() } else if (round < rounds) { setRound(round + 1); setTeamIndex(0); resetTurn() } else setScreen('results') }

    if (screen === 'splash') return <main className="splash"><AppLogo /><span>Le quiz qui rassemble</span></main>

      const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
        const displayName = profile?.displayName || user?.displayName || 'Ahmed Ben Ali'
      const pageTitles: Record<Exclude<Screen, 'splash'>, string> = { menu: 'Tunisia Guess Game', setup: t('setup'), game: t('game'), results: t('results'), settings: t('settings'), profile: t('profile'), login: t('login'), signup: t('signup'), admin: 'Admin Dashboard' }
      return <div className="app-shell" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageHeader title={pageTitles[screen]} onBack={screen === 'menu' ? undefined : () => setScreen('menu')} rightAction={user ? <button className="header-avatar-button" onClick={() => setScreen('profile')}><Avatar name={displayName} /></button> : <button className="header-signin" onClick={() => setScreen('login')}>{t('signIn')}</button>} />
      {screen === 'menu' && <section className="menu-page page"><div className="eyebrow">{t('quizEyebrow')}</div><h1>{t('menuTitle')}</h1><p className="lead">{t('menuLead')}</p><div className="menu-grid"><button className="primary-card" onClick={() => setScreen('setup')}><span className="card-number">01</span><strong>{t('localPlay')}</strong><span>{t('localPlayDescription')} <b>→</b></span></button><button className="secondary-card" onClick={() => { if (user) return; setScreen('login') }}><span className="card-number">02</span><strong>{t('onlinePlay')}</strong><span>{user ? t('comingSoon') : t('signIn')} <b>↗</b></span></button></div><div className="menu-footer"><button onClick={() => setScreen('settings')}>◐ <span>{t('settings')}</span></button><button onClick={() => user ? setScreen('profile') : setScreen('login')}>◎ <span>{user ? t('myProfile') : t('signIn')}</span></button>{isAdmin && <button onClick={() => setScreen('admin')}>▦ <span>Admin</span></button>}{import.meta.env.DEV && user && <button onClick={() => window.alert(`uid: ${user.uid}\nemail: ${user.email ?? 'inconnu'}\nrole: ${profile?.role ?? 'profil absent'}`)}>ⓘ <span>Vérifier mon statut</span></button>}{user ? <button onClick={() => void logout()}>↪ <span>Se déconnecter</span></button> : <button onClick={() => setScreen('login')}>↗ <span>{t('signIn')}</span></button>}<span className="guest-label">{user?.email ?? t('guestMode')}</span></div></section>}
      {screen === 'admin' && isAdmin && <AdminDashboard onBack={() => setScreen('menu')} onLogout={() => void logout()} />}
      {screen === 'setup' && <section className="page compact-page"><div className="eyebrow">{t('preparation')}</div><h2>{t('setupTitle')}</h2><p className="lead">{t('setupLead')}</p><div className="setup-layout"><div className="setup-controls"><Slider label={t('teams')} value={teams} min={2} max={6} suffix={t('teamSuffix')} onChange={setTeams} /><Slider label={t('rounds')} value={rounds} min={1} max={15} suffix={t('roundSuffix')} onChange={setRounds} /><PrimaryButton onClick={startGame}>{t('startGame')} <span>→</span></PrimaryButton></div><div className="theme-panel"><div className="panel-heading"><span>{t('themes')}</span><Badge>3 {t('selected')}</Badge></div>{['Patrimoine', 'Cuisine', 'Géographie', 'Histoire'].map((theme, index) => <label className="theme-option" key={theme}><input type="checkbox" defaultChecked={index < 3} /><span>{theme}</span><i>0{index + 1}</i></label>)}<label className="select-all"><input type="checkbox" defaultChecked /><span>{t('selectAll')}</span></label></div></div></section>}
      {screen === 'game' && <section className="page game-page"><div className="game-head"><div><div className="eyebrow">{t('roundLabel')} {round} / {rounds}</div><h2>{t('teams')} {teamIndex + 1}<span className="muted"> · {t('yourTurn')}</span></h2></div><div className={`timer ${timeLeft <= 10 ? 'urgent' : ''}`}><span>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span><button onClick={() => setRunning(!running)} disabled={finishedTurn}>{running ? t('pause') : t('go')}</button></div></div><div className="question-board"><span className="theme-tag">{question.theme}</span><h3>{question.question}</h3><div className="answer-grid">{question.answers.map((answer: Answer, index) => <button className={`answer ${selected.includes(index) ? 'picked' : ''}`} key={answer.suggestion} onClick={() => !finishedTurn && setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])}><span>{String(index + 1).padStart(2, '0')}</span><strong>{answer.suggestion}</strong><b>{selected.includes(index) ? '✓' : `+${answer.value}`}</b></button>)}</div></div><div className="score-strip"><span>{t('turnScore')} <strong>{turnScore} pts</strong></span>{finishedTurn ? <button className="next-button" onClick={nextTurn}>{round === rounds && teamIndex === teams - 1 ? t('seeResults') : t('nextTeam')} →</button> : <button className="finish-button" onClick={finishTurn}>{t('finishTurn')}</button>}</div></section>}
      {screen === 'results' && <section className="page results-page"><div className="result-banner"><span className="trophy">🏆</span><div className="eyebrow">{t('gameFinished')}</div><h2>{t('wellPlayed')}</h2><p className="lead">{t('resultsLead')}</p></div><div className="ranking">{scores.slice(0, teams).sort((a, b) => b - a).map((score, index) => <div className={`rank-row ${index === 0 ? 'winner' : ''}`} key={`${score}-${index}`}><span className="rank">0{index + 1}</span><strong>{t('teams')} {index + 1}</strong><span>{score} pts</span></div>)}</div><div className="result-actions"><PrimaryButton onClick={() => setScreen('setup')}>{t('replay')} <span>↻</span></PrimaryButton><SecondaryButton onClick={() => setScreen('menu')}>{t('backToMenu')}</SecondaryButton></div></section>}
      {screen === 'settings' && <section className="page compact-page"><div className="eyebrow">{t('preferences')}</div><h2>{t('ambiance')}</h2><div className="settings-list"><div className="language-setting"><span>{t('language')}</span><div className="language-switch"><button className={language === 'fr' ? 'active' : ''} onClick={() => setLanguage('fr')}>FR</button><button className={language === 'ar' ? 'active' : ''} onClick={() => setLanguage('ar')}>ع</button></div></div><label>{t('backgroundMusic')} <button className={`toggle ${music ? 'on' : ''}`} onClick={() => setMusic(!music)}><span /></button></label><label>{t('soundEffects')} <button className={`toggle ${sound ? 'on' : ''}`} onClick={() => setSound(!sound)}><span /></button></label><label>{t('victorySound')} <button className={`toggle ${victorySound.enabled ? 'on' : ''}`} onClick={() => setVictorySound((current) => ({ ...current, enabled: !current.enabled }))}><span /></button></label><div className="victory-sound-controls"><div className="setting-label"><span>{t('victoryVolume')}</span><strong>{Math.round(victorySound.volume * 100)}%</strong></div><input className="volume-slider" type="range" min="0" max="1" step="0.05" value={victorySound.volume} onChange={(event) => setVictorySound((current) => ({ ...current, volume: Number(event.target.value) }))} /><div className="sound-options">{([{ id: 'fanfare', key: 'fanfare' }, { id: 'mezoued', key: 'mezoued' }, { id: 'stadium', key: 'stadium' }] as { id: VictorySoundId; key: 'fanfare' | 'mezoued' | 'stadium' }[]).map((option) => <div className={`sound-option ${victorySound.soundId === option.id ? 'selected' : ''}`} key={option.id} role="button" tabIndex={0} onClick={() => setVictorySound((current) => ({ ...current, soundId: option.id }))}><span>{t(option.key)}</span><button type="button" className="preview-button" aria-label={`${t('preview')} ${t(option.key)}`} onClick={(event) => { event.stopPropagation(); playVictorySound({ ...victorySound, soundId: option.id }) }}>▶</button></div>)}</div></div></div></section>}
      {screen === 'profile' && <section className="page compact-page">{authLoading ? <p role="status">Chargement de la session...</p> : <><div className="profile-hero"><Avatar name={displayName} size="large" /><div><h2>{profile?.displayName ?? user?.displayName ?? 'Joueur invité'}</h2><Badge tone={user ? 'success' : 'warning'}>{user ? 'Connecté' : 'Mode invité'}</Badge><p>{profile?.email ?? user?.email ?? 'Connectez-vous pour sauvegarder vos statistiques.'}</p></div></div>{user && profileLoading && <p role="status">Chargement du profil Firestore...</p>}{user && profileError && <p className="auth-error" role="alert">{firebaseErrorMessage(profileError, 'Impossible de charger le profil, réessaie.')}</p>}{user && !profileLoading && !profileError && !profileExists && <div className="auth-error" role="status"><p>Profil en cours de création...</p><SecondaryButton onClick={() => void createMissingUserProfile(user)}>Créer mon profil</SecondaryButton></div>}{user ? <SecondaryButton className="google-button" onClick={() => void logout()}>↪ <span>Se déconnecter</span></SecondaryButton> : <SecondaryButton className="google-button" onClick={() => setScreen('login')}>G <span>{t('continueGoogle')}</span> ↗</SecondaryButton>}<div className="stats"><StatCard icon="🎮" label="Parties" value="0" detail={user ? 'Statistiques Firestore' : 'Connexion requise'} tone="rose" /><StatCard icon="🏆" label="Victoires" value="—" detail={user ? 'Statistiques Firestore' : 'Connexion requise'} tone="gold" /><StatCard icon="★" label="Score total" value="—" detail={user ? 'Statistiques Firestore' : 'Connexion requise'} tone="green" /></div></>}</section>}
      {screen === 'login' && <AuthScreen mode="login" language={language} onLogin={login} onEmailLogin={loginWithEmail} onEmailSignup={signupWithEmail} onNavigate={setScreen} />}
      {screen === 'signup' && <AuthScreen mode="signup" language={language} onLogin={login} onEmailLogin={loginWithEmail} onEmailSignup={signupWithEmail} onNavigate={setScreen} />}
    </div>
  }

  function AuthScreen({ mode, language, onLogin, onEmailLogin, onEmailSignup, onNavigate }: { mode: 'login' | 'signup'; language: Language; onLogin: () => Promise<unknown>; onEmailLogin: (email: string, password: string) => Promise<unknown>; onEmailSignup: (displayName: string, email: string, username: string, password: string) => Promise<unknown>; onNavigate: (screen: Screen) => void }) {
    const t = (key: Parameters<typeof translate>[1]) => translate(language, key)
    const isLogin = mode === 'login'
    const [error, setError] = useState('')
    return <section className="auth-page page">
      <div className="auth-card">
        <AppLogo />
        <div className="auth-copy"><div className="eyebrow">{isLogin ? t('welcome') : t('newPlayer')}</div><h2>{isLogin ? t('loginTitle') : t('signupTitle')}</h2><p>{isLogin ? t('loginLead') : t('signupLead')}</p></div>
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const displayName = String(form.get('displayName') ?? ''); const email = String(form.get('email') ?? ''); const username = String(form.get('username') ?? ''); const password = String(form.get('password') ?? ''); if (password !== String(form.get('confirmPassword') ?? password)) { setError('Les mots de passe ne correspondent pas.'); return } void (isLogin ? onEmailLogin(email, password) : onEmailSignup(displayName, email, username, password)).then(() => onNavigate('menu')).catch((error) => { console.error('[auth] formulaire échoué', error); setError(firebaseErrorMessage(error, 'Impossible de se connecter avec ces informations.')) }) }}>
          {!isLogin && <label><span>♙ {t('fullName')}</span><input name="displayName" type="text" placeholder="Ahmed Ben Ali" required /></label>}
          {!isLogin && <label><span>♙ Nom d’utilisateur</span><input name="username" type="text" placeholder="ahmed-ben-ali" required /></label>}
          <label><span>✉ {t('email')}</span><input name="email" type="email" placeholder="vous@exemple.com" required /></label>
          <label><span>⌑ {t('password')}</span><input name="password" type="password" placeholder="••••••••" minLength={6} required /></label>
          {!isLogin && <label><span>⌑ {t('confirmPassword')}</span><input name="confirmPassword" type="password" placeholder="••••••••" minLength={6} required /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <PrimaryButton type="submit">{isLogin ? t('signIn') : t('createAccount')} <span>→</span></PrimaryButton>
        </form>
        <div className="auth-divider"><span>{t('or')}</span></div>
        <SecondaryButton className="google-auth-button" onClick={() => void onLogin().then(() => onNavigate('menu')).catch(() => undefined)}>G <span>{t('continueGoogle')}</span></SecondaryButton>
        <p className="auth-switch">{isLogin ? t('noAccount') : t('hasAccount')} <button onClick={() => onNavigate(isLogin ? 'signup' : 'login')}>{isLogin ? t('createAccountLink') : t('signIn')}</button></p>
      </div>
    </section>
  }

  export default App
