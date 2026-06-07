'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button, Input, Modal, PermissionBadge } from '@/components/ui'

import { createDocument, renameDocument, deleteDocument } from '@/features/documents/api/actions'
import { UploadImporter } from '@/features/documents/components/upload-importer'

import type { Document, SharedDocument } from '@/features/documents/api/actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

interface DocumentRowProps {
  doc: Document | SharedDocument
  role: 'owner' | 'editor' | 'viewer'
  onRename?: (id: string, current: string) => void
  onDelete?: (id: string) => void
}

function DocumentRow({ doc, role, onRename, onDelete }: Readonly<DocumentRowProps>) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-violet-300 transition-colors">
      <a href={`/documents/${doc.id}`} className="flex-1 min-w-0">
        <p className="truncate font-medium text-gray-900">{doc.title}</p>
        <p className="text-xs text-gray-400">{formatDate(doc.updated_at)}</p>
      </a>
      <div className="ml-4 flex items-center gap-2">
        <PermissionBadge role={role} />
        {role === 'owner' && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onRename?.(doc.id, doc.title)}>
              Rename
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete?.(doc.id)}>
              Delete
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

interface DocumentDashboardProps {
  owned: Document[]
  shared: SharedDocument[]
}

export function DocumentDashboard({ owned, shared }: Readonly<DocumentDashboardProps>) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [renameState, setRenameState] = useState<{ id: string; title: string } | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)

  function handleRename(id: string, current: string) {
    setRenameState({ id, title: current })
    setRenameError(null)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    startTransition(async () => {
      await deleteDocument(id)
      router.refresh()
    })
  }

  async function submitRename() {
    if (!renameState) return
    setRenameError(null)
    const result = await renameDocument(renameState.id, renameState.title)
    if (!result.success) {
      setRenameError(result.error)
      return
    }
    setRenameState(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-violet-700">Pa Notes</h1>
          <form action={createDocument}>
            <Button type="submit" disabled={isPending}>+ New Document</Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">My Documents</h2>
            <UploadImporter />
          </div>
          {owned.length === 0 ? (
            <p className="text-sm text-gray-400">No documents yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {owned.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  role="owner"
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Shared With Me</h2>
          {shared.length === 0 ? (
            <p className="text-sm text-gray-400">No documents have been shared with you yet.</p>
          ) : (
            <ul className="space-y-2">
              {shared.map(doc => (
                <DocumentRow key={doc.id} doc={doc} role={doc.role} />
              ))}
            </ul>
          )}
        </section>
      </main>

      {renameState && (
        <Modal title="Rename document" onClose={() => setRenameState(null)} className="max-w-sm">
          <Input
            type="text"
            value={renameState.title}
            onChange={e => setRenameState({ ...renameState, title: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && submitRename()}
            error={!!renameError}
            autoFocus
          />
          {renameError && <p className="mt-1 text-sm text-red-600">{renameError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameState(null)}>Cancel</Button>
            <Button onClick={submitRename}>Save</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
