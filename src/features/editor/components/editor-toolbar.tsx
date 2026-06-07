'use client'

import { useEditorState, type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react'

import { Button, Separator } from '@/components/ui'

interface ToolbarButtonProps {
  onClick: () => void
  active: boolean
  label: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, label, children }: Readonly<ToolbarButtonProps>) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      aria-label={label}
      aria-pressed={active}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  )
}

export function EditorToolbar({ editor }: Readonly<{ editor: Editor }>) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive('bold'),
      italic: currentEditor.isActive('italic'),
      underline: currentEditor.isActive('underline'),
      h1: currentEditor.isActive('heading', { level: 1 }),
      h2: currentEditor.isActive('heading', { level: 2 }),
      h3: currentEditor.isActive('heading', { level: 3 }),
      bulletList: currentEditor.isActive('bulletList'),
      orderedList: currentEditor.isActive('orderedList'),
    }),
  })

  if (!state) return null

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex w-max min-w-full items-center gap-0.5 sm:w-auto sm:flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
          active={state.bold}
        label="Bold"
      >
          <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
          active={state.italic}
        label="Italic"
      >
          <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={state.underline}
        label="Underline"
      >
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={state.h1}
          label="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
      </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={state.h2}
          label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={state.h3}
          label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={state.bulletList}
        label="Bullet list"
      >
          <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={state.orderedList}
        label="Numbered list"
      >
          <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      </div>
    </div>
  )
}
