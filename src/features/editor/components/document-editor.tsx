'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Share2, FileText, Check, Pencil } from 'lucide-react'

import { Button, Input, Badge, Separator } from '@/components/ui'
import { AlertModal } from '@/components/shared/alert-modal'
import { renameDocument } from '@/features/documents/api/actions'
import { ShareDialog } from '@/features/sharing/components/share-dialog'
import { DocumentReader } from '@/features/editor/components/document-reader'
import {
  DocumentEditSurface,
  type DocumentEditSurfaceHandle,
} from '@/features/editor/components/document-edit-surface'

import type { Document, DocumentRole } from '@/features/documents/api/actions'

interface DocumentEditorProps {
  document: Document
  role: DocumentRole
}

const roleBadge: Record<DocumentRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  editor: 'secondary',
  viewer: 'outline',
}

export function DocumentEditor({ document, role }: Readonly<DocumentEditorProps>) {
  const router = useRouter()
  const editSurfaceRef = useRef<DocumentEditSurfaceHandle>(null)
  const canEdit = role !== 'viewer'

  const [isEditing, setIsEditing] = useState(false)
  const [viewHtml, setViewHtml] = useState(document.content_html || '')
  const [title, setTitle] = useState(document.title)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (editSurfaceRef.current?.hasUnsavedChanges()) e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEditing])

  const handleSave = useCallback(async () => {
    if (!editSurfaceRef.current) return
    setSaveStatus('saving')
    setSaveError(null)
    const result = await editSurfaceRef.current.save()
    if (result.success && result.html !== undefined) {
      setViewHtml(result.html)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('error')
      setSaveError(result.error ?? 'Failed to save.')
    }
  }, [])

  function requestExitEdit() {
    if (editSurfaceRef.current?.hasUnsavedChanges()) {
      setShowDiscardModal(true)
      return
    }
    setIsEditing(false)
    setSaveStatus('idle')
    setSaveError(null)
  }

  function confirmDiscard() {
    editSurfaceRef.current?.resetContent(viewHtml)
    setShowDiscardModal(false)
    setIsEditing(false)
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
  }

  async function handleRename() {
    if (!isEditing || role !== 'owner') return
    if (title.trim() === document.title) return
    setTitleError(null)
    if (!title.trim()) {
      setTitleError('Title cannot be empty.')
      setTitle(document.title)
      return
    }
    const result = await renameDocument(document.id, title)
    if (!result.success) {
      setTitleError(result.error)
      setTitle(document.title)
    }
  }

  function renderSaveStatus() {
    if (!isEditing) return null
    if (saveStatus === 'saving') {
      return <span className="text-xs text-muted-foreground">Saving…</span>
    }
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )
    }
    if (saveStatus === 'error') {
      return (
        <span className="max-w-32 truncate text-xs text-destructive sm:max-w-none">
          {saveError}
        </span>
      )
    }
    return null
  }

  function renderActions(compact: boolean) {
    if (isEditing) {
      return (
        <>
          {renderSaveStatus()}
          <Button size="sm" variant="outline" onClick={requestExitEdit}>
            Done
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving' || !isDirty}>
            Save
          </Button>
          {role === 'owner' && (
            compact ? (
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Share document"
                onClick={() => setShowShare(true)}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            )
          )}
        </>
      )
    }

    return (
      <>
        {canEdit && (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
        {role === 'owner' && (
          compact ? (
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Share document"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          )
        )}
      </>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="space-y-2 px-4 py-2.5 sm:space-y-0">
          <div className="flex items-center justify-between sm:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to dashboard"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5">{renderActions(true)}</div>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden shrink-0 gap-1.5 sm:inline-flex"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>

              <Separator orientation="vertical" className="hidden h-5 shrink-0 sm:block" />

              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              {isEditing && role === 'owner' ? (
                <Input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setTitleError(null) }}
                  onBlur={handleRename}
                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                  className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 font-semibold shadow-none focus-visible:border-input sm:max-w-xs sm:flex-none"
                />
              ) : (
                <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{title}</h1>
              )}
              <Badge variant={roleBadge[role]} className="shrink-0 text-[10px] capitalize sm:text-xs">
                {role}
              </Badge>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {renderActions(false)}
            </div>
          </div>

          {titleError && (
            <p className="text-xs text-destructive sm:pl-30">{titleError}</p>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-4 my-4 rounded-lg border bg-card shadow-sm sm:mx-auto sm:my-8 sm:max-w-3xl sm:rounded-xl">
          {isEditing && canEdit ? (
            <DocumentEditSurface
              ref={editSurfaceRef}
              documentId={document.id}
              contentHtml={viewHtml}
              onDirtyChange={setIsDirty}
            />
          ) : (
            <DocumentReader html={viewHtml} />
          )}
        </div>
      </main>

      {showShare && (
        <ShareDialog documentId={document.id} onClose={() => setShowShare(false)} />
      )}

      <AlertModal
        open={showDiscardModal}
        onOpenChange={open => { if (!open) setShowDiscardModal(false) }}
        title="Discard unsaved changes?"
        description="You have unsaved edits. Leave edit mode without saving?"
        confirmLabel="Discard"
        confirmVariant="destructive"
        onConfirm={confirmDiscard}
      />
    </div>
  )
}
