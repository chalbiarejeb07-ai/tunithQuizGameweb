import { AppLogo } from './AppLogo'
import type { Translate } from '../services/i18n'

type AppFooterProps = { t: Translate; questionCount: number; themeCount: number }

/**
 * Pied de page — il ancre visuellement les écrans courts, qui se terminaient
 * sinon par un grand vide, et rappelle en une ligne l'étendue du contenu.
 */
export function AppFooter({ t, questionCount, themeCount }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <AppLogo compact />
          <div>
            <strong>Tunisia Guess Game</strong>
            <span>{t('quizEyebrow')}</span>
          </div>
        </div>
        <ul className="app-footer-facts">
          <li><strong>{questionCount}</strong><span>{t('questionsWord')}</span></li>
          <li><strong>{themeCount}</strong><span>{t('themes')}</span></li>
          <li><strong>2</strong><span>{t('language')}</span></li>
        </ul>
      </div>
    </footer>
  )
}
