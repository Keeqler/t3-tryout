import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import cx from 'classnames'

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: 'solid' | 'ghost'
}

export function Button({ className, variant = 'solid', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'flex h-12 flex-row items-center justify-center rounded-xl px-4 text-center font-bold outline-none ring-0 transition-all',
        variant === 'solid' &&
          'border-2 border-white/40 bg-gradient-to-r from-gradient-100 to-gradient-200 bg-[length:100%100%] hover:bg-[length:200%100%] focus:border-neutral-100 focus:bg-[length:200%100%]',
        variant === 'ghost' &&
          'border-2 border-transparent text-primary hover:bg-neutral-600 focus:border-primary focus:bg-neutral-600',
        className,
      )}
      {...props}
    />
  )
}
