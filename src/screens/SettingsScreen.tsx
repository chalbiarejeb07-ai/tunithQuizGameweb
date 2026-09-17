import { playVictorySound, type SoundPreferences, type VictorySoundId } from '../services/soundService'
import type { Language, Translate, TranslationKey } from '../services/i18n'

type SettingsScreenProps = {
  t: Translate
  language: Language
  sound: SoundPreferences
  onLanguageChange: (language: Language) => void
  onSoundChange: (sound: SoundPreferences) => void
}

const soundOptions: { id: VictorySoundId; key: TranslationKey }[] = [
  { id: 'fanfare', key: 'fanfare' },
  { id: 'mezoued', key: 'mezoued' },
  { id: 'stadium', key: 'stadium' },
]

export function SettingsScreen({ t, language, sound, onLanguageChange, onSoundChange }: SettingsScreenProps) {
  return (
    <div className="page settings-page">
      <header className="page-head">
        <div className="eyebrow">{t('preferences')}</div>
        <h1>{t('ambiance')}</h1>
      </header>

      <section className="panel">
        <h2 className="panel-title">{t('displaySection')}</h2>
        <div className="setting-row">
          <div className="setting-label-group">
            <strong>{t('language')}</strong>
            <span>{language === 'fr' ? t('french') : t('arabic')}</span>
          </div>
          <div className="language-switch" role="group" aria-label={t('language')}>
            <button className={language === 'fr' ? 'active' : ''} aria-pressed={language === 'fr'} onClick={() => onLanguageChange('fr')}>FR</button>
            <button className={language === 'ar' ? 'active' : ''} aria-pressed={language === 'ar'} onClick={() => onLanguageChange('ar')}>ع</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t('soundSection')}</h2>

        <div className="setting-row">
          <div className="setting-label-group">
            <strong>{t('soundEffects')}</strong>
            <span>{t('goodAnswer')} · {t('wrongAnswer')}</span>
          </div>
          <button
            className={`toggle ${sound.effects ? 'on' : ''}`}
            role="switch"
            aria-checked={sound.effects}
            aria-label={t('soundEffects')}
            onClick={() => onSoundChange({ ...sound, effects: !sound.effects })}
          ><span /></button>
        </div>

        <div className="setting-row">
          <div className="setting-label-group">
            <strong>{t('victorySound')}</strong>
            <span>{t('results')}</span>
          </div>
          <button
            className={`toggle ${sound.enabled ? 'on' : ''}`}
            role="switch"
            aria-checked={sound.enabled}
            aria-label={t('victorySound')}
            onClick={() => onSoundChange({ ...sound, enabled: !sound.enabled })}
          ><span /></button>
        </div>

        {/* Les réglages fins disparaissent quand le son de victoire est coupé :
            afficher un volume inopérant serait trompeur. */}
        {sound.enabled && (
          <div className="sound-detail">
            <div className="setting-label">
              <span>{t('victoryVolume')}</span>
              <strong>{Math.round(sound.volume * 100)}%</strong>
            </div>
            <input
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              aria-label={t('victoryVolume')}
              value={sound.volume}
              onChange={(event) => onSoundChange({ ...sound, volume: Number(event.target.value) })}
            />
            <div className="sound-options">
              {soundOptions.map((option) => (
                <div
                  className={`sound-option ${sound.soundId === option.id ? 'selected' : ''}`}
                  key={option.id}
                  role="radio"
                  aria-checked={sound.soundId === option.id}
                  tabIndex={0}
                  onClick={() => onSoundChange({ ...sound, soundId: option.id })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSoundChange({ ...sound, soundId: option.id })
                    }
                  }}
                >
                  <span>{t(option.key)}</span>
                  <button
                    type="button"
                    className="preview-button"
                    aria-label={`${t('preview')} ${t(option.key)}`}
                    onClick={(event) => { event.stopPropagation(); playVictorySound({ ...sound, enabled: true, soundId: option.id }) }}
                  >▶</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
