import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }

export function PrimaryButton({ children, className = '', ...props }: ButtonProps) {
  return <button className={`primary-button ${className}`} {...props}>{children}</button>
}

export function SecondaryButton({ children, className = '', ...props }: ButtonProps) {
  return <button className={`secondary-button ${className}`} {...props}>{children}</button>
}
