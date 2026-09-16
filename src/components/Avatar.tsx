type AvatarProps = { name: string; size?: 'small' | 'large' }

export function Avatar({ name, size = 'small' }: AvatarProps) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <span className={`user-avatar avatar-${size}`} aria-label={name}>{initials}</span>
}
