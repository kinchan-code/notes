'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'

import { Button, PermissionBadge } from '@/components/ui'

import { updateDocument, renameDocument } from '@/features/documents/api/actions'
import { ShareDialog } from '@/features/sharing/components/share-dialog'
import { EditorToolbar } from '@/features/editor/components/editor-toolbar'

import type { Document, DocumentRole } from '@/features/documents/api/actions'

interface DocumentEditorProps {
  document: Document
  role: DocumentRole
}

export function DocumentEditor({ document, role }: Readonly<DocumentEditorProps>) {
  const [title, setTitle] = useState(document.title)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  const editable = role !== 'viewer'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
    ],
    content: document.content_html || '',
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  })

  const handleSave = useCallback(async () => {
    if (!editor) return
    setSaveStatus('saving')
    setSaveError(null)

    const result = await updateDocument(document.id, {
      content_html: editor.getHTML(),
      content_text: editor.getText(),
    })

    if (result.success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('error')
      setSaveError(result.error)
    }
  }, [editor, document.id])

  async function handleRename() {
    setTitleError(null)
    if (!title.trim()) {
      setTitleError('Title cannot be empty.')
      setTitle(document.title)
      return
    }
    if (title.trim() === document.title) return

    const result = await renameDocument(document.id, title)
    if (!result.success) {
      setTitleError(result.error)
      setTitle(document.title)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
          <div>
            {role === 'owner' ? (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="rounded border border-transparent px-2 py-1 text-lg font-semibold text-gray-900 hover:border-gray-300 focus:border-violet-400 focus:outline-none"
              />
            ) : (
              <span className="px-2 py-1 text-lg font-semibold text-gray-900">{title}</span>
            )}
            {titleError && <p className="text-xs text-red-600">{titleError}</p>}
          </div>
          <PermissionBadge role={role} />
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <span className="text-sm text-gray-400">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-sm text-green-600">Saved</span>}
          {saveStatus === 'error' && <span className="text-sm text-red-600">{saveError}</span>}

          {editable && (
            <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
              Save
            </Button>
          )}

          {role === 'owner' && (
            <Button variant="secondary" onClick={() => setShowShare(true)}>
              Share
            </Button>
          )}
        </div>
      </header>

      {editable && editor && <EditorToolbar editor={editor} />}

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl bg-white shadow-sm mt-6 mb-10 rounded-lg border border-gray-200">
          {!editable && (
            <div className="rounded-t-lg bg-amber-50 px-6 py-2 text-sm text-amber-700 border-b border-amber-200">
              You have view-only access to this document.
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </main>

      {showShare && (
        <ShareDialog documentId={document.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
