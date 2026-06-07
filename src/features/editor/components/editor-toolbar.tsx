'use client'

import type { Editor } from '@tiptap/react'

interface ToolbarButtonProps {
  onClick: () => void
  active: boolean
  label: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, label, children }: Readonly<ToolbarButtonProps>) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      aria-label={label}
      title={label}
      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
        active ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor }: Readonly<{ editor: Editor }>) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-white px-3 py-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        label="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <div className="mx-1 w-px bg-gray-200" />

      {([1, 2, 3] as const).map(level => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive('heading', { level })}
          label={`Heading ${level}`}
        >
          H{level}
        </ToolbarButton>
      ))}

      <div className="mx-1 w-px bg-gray-200" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label="Bullet list"
      >
        • List
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label="Numbered list"
      >
        1. List
      </ToolbarButton>
    </div>
  )
}
