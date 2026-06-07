import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-violet-500',
  danger:    'border border-red-300 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500',
  ghost:     'text-gray-500 hover:bg-gray-100 focus:ring-gray-400',
}

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
