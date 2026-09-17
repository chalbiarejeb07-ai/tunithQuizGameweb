import { PrimaryButton } from '../components/Buttons'
import { Slider } from '../components/Slider'
import { themes, type ThemeId } from '../data/questionBank'
import type { Language, Translate } from '../services/i18n'

type SetupScreenProps = {
  t: Translate
  language: Language
  teams: number
  rounds: number
  teamNames: string[]
  selectedThemes: ThemeId[]
  availableCount: number
  onTeamsChange: (value: number) => void
  onRoundsChange: (value: number) => void
  onTeamNameChange: (index: number, name: string) => void
  onThemesChange: (themes: ThemeId[]) => void
  onStart: () => void
}

export function SetupScreen({
  t, language, teams, rounds, teamNames, selectedThemes, availableCount,
  onTeamsChange, onRoundsChange, onTeamNameChange, onThemesChange, onStart,
}: SetupScreenProps) {
  const allSelected = selectedThemes.length === themes.length
  const totalQuestions = teams * rounds
  // Un tour dure au plus 60 s ; avec les transitions, on compte une minute.
  const estimatedMinutes = Math.max(1, Math.round(totalQuestions * 1.1))
  const ready = selectedThemes.length > 0

  function toggleTheme(id: ThemeId) {
    onThemesChange(selectedThemes.includes(id) ? selectedThemes.filter((item) => item !== id) : [...selectedThemes, id])
  }

  return (
    <div className="page setup-page">
      <header className="page-head">
        <div className="eyebrow">{t('preparation')}</div>
        <h1>{t('setupTitle')}</h1>
        <p className="lead">{t('setupLead')}</p>
      </header>

      <div className="setup-grid">
        <section className="panel">
          <h2 className="panel-title">{t('yourSetup')}</h2>
          <div className="setup-sliders">
            <Slider label={t('teams')} value={teams} min={2} max={6} suffix={t('teamSuffix')} onChange={onTeamsChange} />
            <Slider label={t('rounds')} value={rounds} min={1} max={10} suffix={t('roundSuffix')} onChange={onRoundsChange} />
          </div>

          {/* Traduit les curseurs en conséquences concrètes : combien de
              questions, combien de temps. Sans cela, « 5 manches » ne dit rien. */}
          <p className="setup-summary">
            <strong>{rounds}</strong> {t('summaryRounds')}
            <span aria-hidden="true"> × </span>
            <strong>{teams}</strong> {t('summaryTeams')}
            <span aria-hidden="true"> = </span>
            <strong>{totalQuestions}</strong> {t('questionsWord')}
            <span className="setup-summary-time">{t('aboutWord')} {estimatedMinutes} {t('minutesWord')}</span>
          </p>
        </section>

        <section className="panel">
          <h2 className="panel-title">{t('teamNamesSection')}</h2>
          <div className="team-names">
            {Array.from({ length: teams }, (_, index) => (
              <label className="team-name-row" key={index}>
                <span className="team-name-index">{String(index + 1).padStart(2, '0')}</span>
                <input
                  value={teamNames[index] ?? ''}
                  maxLength={22}
                  placeholder={`${t('team')} ${index + 1}`}
                  onChange={(event) => onTeamNameChange(index, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="panel setup-themes">
          <div className="panel-title-row">
            <h2 className="panel-title">{t('themes')}</h2>
            <button className="link-button" onClick={() => onThemesChange(allSelected ? [] : themes.map((theme) => theme.id))}>
              {allSelected ? t('deselectAll') : t('selectAll')}
            </button>
          </div>

          {/* Pastilles plutôt qu'une liste de cases : on voit la sélection d'un
              coup d'œil et chaque cible est assez large pour le tactile. */}
          <div className="theme-chips">
            {themes.map((theme) => {
              const active = selectedThemes.includes(theme.id)
              return (
                <button
                  key={theme.id}
                  className={`theme-chip ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleTheme(theme.id)}
                >
                  <span className="theme-chip-check" aria-hidden="true">{active ? '✓' : '+'}</span>
                  {theme.label[language]}
                </button>
              )
            })}
          </div>

          <p className={`theme-count ${ready ? '' : 'is-warning'}`}>
            {ready
              ? <><strong>{availableCount}</strong> {t('questionsAvailable')}</>
              : t('pickOneTheme')}
          </p>
        </section>
      </div>

      {/* Barre d'action fixe : le bouton de lancement reste atteignable quelle
          que soit la position dans la page, y compris sur mobile. */}
      <div className="setup-actions">
        <p>
          <strong>{totalQuestions}</strong> {t('questionsWord')}
          <span aria-hidden="true"> · </span>
          <strong>{teams}</strong> {t('summaryTeams')}
        </p>
        <PrimaryButton onClick={onStart} disabled={!ready}>{t('startGame')} <span>→</span></PrimaryButton>
      </div>
    </div>
  )
}
