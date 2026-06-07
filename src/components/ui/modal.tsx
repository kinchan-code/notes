'use client'

import { useEffect, useId, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ title, onClose, children, className }: Readonly<ModalProps>) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isClient = useIsClient()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return

    dialog.showModal()

    return () => {
      dialog.close()
    }
  }, [])

  if (!isClient) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-0 backdrop:bg-black/40 open:flex"
      onCancel={e => {
        e.preventDefault()
        onClose()
      }}
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className={cn('relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body,
  )
}
