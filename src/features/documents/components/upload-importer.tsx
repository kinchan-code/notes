'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui'

import { importTextFile } from '@/features/documents/api/actions'

const ALLOWED_EXTENSIONS = new Set(['.txt', '.md'])
const ALLOWED_TYPES = new Set(['text/plain', 'text/markdown'])

export function UploadImporter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_TYPES.has(file.type)) {
      setError('Only .txt and .md files are supported.')
      return
    }
    setLoading(true)
    const content = await file.text()
    const result = await importTextFile(content, file.name)
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    router.push(`/documents/${result.id}`)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="gap-1.5"
        aria-label={loading ? 'Importing file' : 'Import file'}
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">{loading ? 'Importing…' : 'Import'}</span>
      </Button>
      {error && (
        <p
          role="alert"
          className="absolute top-full right-0 z-20 mt-1 w-44 rounded-md border bg-popover p-2 text-xs text-destructive shadow-sm sm:w-auto sm:whitespace-nowrap"
        >
          {error}
        </p>
      )}
    </div>
  )
}
