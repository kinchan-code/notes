'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, MoreHorizontal, Pencil, Trash2, Clock, Share2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Button,
  buttonVariants,
  Input,
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator
} from '@/components/ui'

import { createDocument, renameDocument, deleteDocument } from '@/features/documents/api/actions'
import { UploadImporter } from '@/features/documents/components/upload-importer'
import { ShareDialog } from '@/features/sharing/components/share-dialog'
import { UserMenu } from '@/features/profile/components/user-menu'
import { AlertModal } from '@/components/shared/alert-modal'

import type { Document, SharedDocument } from '@/features/documents/api/actions'
import type { Profile } from '@/features/profile/api/actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  editor: 'secondary',
  viewer: 'outline',
}

interface DocumentRowProps {
  doc: Document | SharedDocument
  role: 'owner' | 'editor' | 'viewer'
  onRename?: (id: string, current: string) => void
  onShare?: (id: string) => void
  onDelete?: (id: string) => void
}

function DocumentCard({ doc, role, onRename, onShare, onDelete }: Readonly<DocumentRowProps>) {
  return (
    <Card className="group transition-colors hover:bg-accent/50">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted sm:h-9 sm:w-9">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <a href={`/documents/${doc.id}`} className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground group-hover:underline underline-offset-4">
              {doc.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {formatDate(doc.updated_at)}
            </p>
          </a>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Badge variant={roleBadgeVariant[role]} className="shrink-0 text-[10px] capitalize sm:text-xs">
              {role}
            </Badge>

            {role === 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100'
                  )}
                  aria-label="Document options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onRename?.(doc.id, doc.title)}>
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare?.(doc.id)}>
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DocumentDashboardProps {
  owned: Document[]
  shared: SharedDocument[]
  profile: Profile
}

export function DocumentDashboard({ owned, shared, profile }: Readonly<DocumentDashboardProps>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [renameState, setRenameState] = useState<{ id: string; title: string } | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [shareDocumentId, setShareDocumentId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  function handleRename(id: string, current: string) {
    setRenameState({ id, title: current })
    setRenameError(null)
  }

  function handleDelete(id: string) {
    setDeleteTargetId(id)
  }

  function confirmDelete() {
    if (!deleteTargetId) return
    startTransition(async () => {
      await deleteDocument(deleteTargetId)
      setDeleteTargetId(null)
      router.refresh()
    })
  }

  async function submitRename() {
    if (!renameState) return
    setRenameError(null)
    const result = await renameDocument(renameState.id, renameState.title)
    if (!result.success) { setRenameError(result.error); return }
    setRenameState(null)
    router.refresh()
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span className="truncate font-semibold text-foreground">Pa Notes</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <UploadImporter />
            <form action={createDocument}>
              <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Document</span>
                <span className="sr-only sm:hidden">New document</span>
              </Button>
            </form>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <UserMenu profile={profile} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8">
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">My Documents</h2>
            <p className="text-sm text-muted-foreground">
              {owned.length} document{owned.length === 1 ? '' : 's'}
            </p>
          </div>

          {owned.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No documents yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Create your first document or import a .txt / .md file to get started.
                </p>
                <form action={createDocument} className="mt-6">
                  <Button type="submit" size="sm">
                    <Plus className="h-4 w-4" />
                    New Document
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
              <div className="space-y-2">
              {owned.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  role="owner"
                  onRename={handleRename}
                  onShare={setShareDocumentId}
                  onDelete={handleDelete}
                />
              ))}
              </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">Shared With Me</h2>
            <p className="text-sm text-muted-foreground">
              {shared.length} document{shared.length === 1 ? '' : 's'}
            </p>
          </div>

          {shared.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
                <p className="font-medium">Nothing shared yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Documents shared with you will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
              <div className="space-y-2">
              {shared.map(doc => (
                <DocumentCard key={doc.id} doc={doc} role={doc.role} />
              ))}
              </div>
          )}
        </section>
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:py-6">
        © {new Date().getFullYear()} Pa Notes
      </footer>

      {shareDocumentId && (
        <ShareDialog
          documentId={shareDocumentId}
          onClose={() => setShareDocumentId(null)}
        />
      )}

      <AlertModal
        open={!!deleteTargetId}
        onOpenChange={open => { if (!open) setDeleteTargetId(null) }}
        title="Delete document"
        description="Delete this document? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={isPending}
      />

      <Dialog open={!!renameState} onOpenChange={open => { if (!open) setRenameState(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <Input
            value={renameState?.title ?? ''}
            onChange={e => setRenameState(s => s ? { ...s, title: e.target.value } : null)}
            onKeyDown={e => e.key === 'Enter' && submitRename()}
            aria-invalid={!!renameError}
            autoFocus
          />
          {renameError && <p className="text-xs text-destructive">{renameError}</p>}
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setRenameState(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={submitRename} className="w-full sm:w-auto">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
