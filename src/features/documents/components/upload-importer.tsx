'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui'

import { importTextFile } from '@/features/documents/api/actions'

const ALLOWED_EXTENSIONS: readonly string[] = ['.txt', '.md']
const ALLOWED_TYPES: readonly string[] = ['text/plain', 'text/markdown']

export function UploadImporter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      setError('Only .txt and .md files are supported.')
      return
    }

    setLoading(true)
    const content = await file.text()
    const result = await importTextFile(content, file.name)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push(`/documents/${result.id}`)
  }

  return (
    <div>
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
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Importing…' : 'Import .txt / .md'}
      </Button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
