'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

import { updateDocument } from '@/features/documents/api/actions'
import { EditorToolbar } from '@/features/editor/components/editor-toolbar'

export interface DocumentEditSurfaceHandle {
  save: () => Promise<{ success: boolean; html?: string; error?: string }>
  hasUnsavedChanges: () => boolean
  resetContent: (html: string) => void
}

interface DocumentEditSurfaceProps {
  documentId: string
  contentHtml: string
  onDirtyChange: (dirty: boolean) => void
}

export const DocumentEditSurface = forwardRef<
  DocumentEditSurfaceHandle,
  DocumentEditSurfaceProps
>(function DocumentEditSurface(
  { documentId, contentHtml, onDirtyChange },
  ref,
) {
  const savedContentRef = useRef(contentHtml || '')

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: contentHtml || '',
    editable: true,
    onUpdate: ({ editor: e }) => {
      const dirty = e.getHTML() !== savedContentRef.current
      onDirtyChange(dirty)
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none min-h-[60vh] px-4 py-4 text-foreground sm:min-h-[500px] sm:px-8 sm:py-6',
      },
    },
  })

  useEffect(() => {
    savedContentRef.current = contentHtml || ''
    onDirtyChange(false)
  }, [documentId, contentHtml, onDirtyChange])

  const save = useCallback(async () => {
    if (!editor) return { success: false, error: 'Editor is not ready.' }

    const result = await updateDocument(documentId, {
      content_html: editor.getHTML(),
      content_text: editor.getText(),
    })

    if (result.success) {
      const html = editor.getHTML()
      savedContentRef.current = html
      onDirtyChange(false)
      return { success: true, html }
    }

    return { success: false, error: result.error }
  }, [editor, documentId, onDirtyChange])

  useImperativeHandle(ref, () => ({
    save,
    hasUnsavedChanges: () => editor?.getHTML() !== savedContentRef.current,
    resetContent: (html: string) => {
      savedContentRef.current = html
      editor?.commands.setContent(html || '')
      onDirtyChange(false)
    },
  }), [save, editor, onDirtyChange])

  return (
    <>
      {editor && (
        <div className="border-b bg-muted/40 px-4 py-1.5">
          <EditorToolbar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} />
    </>
  )
})
