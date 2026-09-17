import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import { firebaseErrorMessage } from '../services/authService'
import type { Translate } from '../services/i18n'
import type { Screen } from '../types'

type AuthScreenProps = {
  t: Translate
  mode: 'login' | 'signup'
  disabled: boolean
  disabledNotice: string
  onLogin: () => Promise<unknown>
  onEmailLogin: (email: string, password: string) => Promise<unknown>
  onEmailSignup: (displayName: string, email: string, username: string, password: string) => Promise<unknown>
  onNavigate: (screen: Screen) => void
}

export function AuthScreen({ t, mode, disabled, disabledNotice, onLogin, onEmailLogin, onEmailSignup, onNavigate }: AuthScreenProps) {
  const isLogin = mode === 'login'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const displayName = String(form.get('displayName') ?? '')
    const email = String(form.get('email') ?? '')
    const username = String(form.get('username') ?? '')
    const password = String(form.get('password') ?? '')
    if (!isLogin && password !== String(form.get('confirmPassword') ?? '')) {
      setError(t('passwordsMismatch'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await (isLogin ? onEmailLogin(email, password) : onEmailSignup(displayName, email, username, password))
      onNavigate('menu')
    } catch (reason) {
      console.error('[auth] formulaire échoué', reason)
      setError(firebaseErrorMessage(reason, t('profileLoadError')))
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setBusy(true)
    setError('')
    try {
      await onLogin()
      onNavigate('menu')
    } catch (reason) {
      setError(firebaseErrorMessage(reason, t('profileLoadError')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page page">
      <div className="auth-card">
        <AppLogo />
        <div className="auth-copy">
          <div className="eyebrow">{isLogin ? t('welcome') : t('newPlayer')}</div>
          <h2>{isLogin ? t('loginTitle') : t('signupTitle')}</h2>
          <p>{isLogin ? t('loginLead') : t('signupLead')}</p>
        </div>

        {disabled && <p className="auth-error" role="status">{disabledNotice}</p>}

        <form className="auth-form" onSubmit={submit}>
          {!isLogin && <label><span>♙ {t('fullName')}</span><input name="displayName" type="text" placeholder="Ahmed Ben Ali" required /></label>}
          {!isLogin && <label><span>♙ {t('username')}</span><input name="username" type="text" placeholder="ahmed-ben-ali" required /></label>}
          <label><span>✉ {t('email')}</span><input name="email" type="email" placeholder="vous@exemple.com" required /></label>
          <label><span>⌑ {t('password')}</span><input name="password" type="password" placeholder="••••••••" minLength={6} required /></label>
          {!isLogin && <label><span>⌑ {t('confirmPassword')}</span><input name="confirmPassword" type="password" placeholder="••••••••" minLength={6} required /></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <PrimaryButton type="submit" disabled={disabled || busy}>
            {isLogin ? t('signIn') : t('createAccount')} <span>→</span>
          </PrimaryButton>
        </form>

        <div className="auth-divider"><span>{t('or')}</span></div>
        <SecondaryButton className="google-auth-button" disabled={disabled || busy} onClick={() => void google()}>
          G <span>{t('continueGoogle')}</span>
        </SecondaryButton>

        <p className="auth-switch">
          {isLogin ? t('noAccount') : t('hasAccount')}{' '}
          <button onClick={() => onNavigate(isLogin ? 'signup' : 'login')}>
            {isLogin ? t('createAccountLink') : t('signIn')}
          </button>
        </p>
      </div>
    </section>
  )
}
