import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-red-400 focus:ring-red-400'
          : 'border-gray-300 focus:ring-violet-500',
        className
      )}
      {...props}
    />
  )
}
