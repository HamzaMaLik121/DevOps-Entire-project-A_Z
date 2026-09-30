import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-aka-bright/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]'
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }
  const styles = {
    primary:
      'bg-aka-deep text-white hover:bg-aka shadow-lg shadow-aka-dark/40 border border-aka/40',
    gold: 'bg-kin text-ink-950 hover:bg-kin-light shadow-lg shadow-kin/20',
    secondary:
      'bg-ink-800 text-stone-100 hover:bg-ink-700 border border-ink-600 hover:border-kin/40',
    ghost: 'text-stone-300 hover:text-white hover:bg-ink-800',
    danger: 'bg-rose-700 text-white hover:bg-rose-600 border border-rose-500/40',
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-ink-700 bg-ink-900/70 shadow-xl shadow-black/30 backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-ink-600 bg-ink-850 px-4 py-2.5 text-stone-100 placeholder:text-stone-500 focus:border-kin/60 focus:outline-none focus:ring-1 focus:ring-kin/40 transition ${className}`}
      {...props}
    />
  )
}

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-kin/30 bg-kin/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-kin-light ${className}`}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  kicker,
  title,
  className = '',
}: {
  kicker?: string
  title: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {kicker && (
        <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-kin">
          <span className="h-px w-8 bg-kin/60" />
          {kicker}
        </p>
      )}
      <h2 className="mt-2 font-mincho text-3xl font-black text-stone-50 md:text-4xl">{title}</h2>
    </div>
  )
}
