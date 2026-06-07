'use client'

import { useState, useEffect, useTransition } from 'react'

import { Button, Input, Modal, Select } from '@/components/ui'

import { shareDocument, removeShare, getDocumentShares } from '@/features/sharing/api/actions'

import type { ShareRecord } from '@/features/sharing/api/actions'

interface ShareDialogProps {
  documentId: string
  onClose: () => void
}

export function ShareDialog({ documentId, onClose }: Readonly<ShareDialogProps>) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer')
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getDocumentShares(documentId).then(setShares)
  }, [documentId])

  function handleShare() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await shareDocument(documentId, email, role)
      if (result.success) {
        setSuccess(`Shared with ${email} as ${role}.`)
        setEmail('')
        const updated = await getDocumentShares(documentId)
        setShares(updated)
      } else {
        setError(result.error)
      }
    })
  }

  function handleRemove(shareId: string) {
    startTransition(async () => {
      await removeShare(shareId, documentId)
      const updated = await getDocumentShares(documentId)
      setShares(updated)
    })
  }

  return (
    <Modal title="Share document" onClose={onClose}>
      <div className="mb-4 space-y-2">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={!!error}
        />
        <div className="flex gap-2">
          <Select
            value={role}
            onChange={e => setRole(e.target.value as 'viewer' | 'editor')}
            className="flex-1"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </Select>
          <Button onClick={handleShare} disabled={isPending || !email.trim()}>
            Share
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </div>

      {shares.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Currently shared with</p>
          <ul className="space-y-2">
            {shares.map(s => (
              <li key={s.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-700">{s.profiles?.email ?? 'Unknown'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 capitalize">{s.role}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(s.id)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
