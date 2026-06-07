'use client'

import { useState, useEffect, useTransition } from 'react'
import { UserPlus, X } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { shareDocument, removeShare, getDocumentShares } from '@/features/sharing/api/actions'

import type { ShareRecord } from '@/features/sharing/api/actions'

interface ShareDialogProps {
  documentId: string
  onClose: () => void
}

const roleBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
  editor: 'secondary',
  viewer: 'outline',
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
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Share document
          </DialogTitle>
          <DialogDescription>
            Invite a teammate by email and choose their access level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="share-email">Email address</Label>
            <Input
              id="share-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              aria-invalid={!!error}
              onKeyDown={e => e.key === 'Enter' && email.trim() && handleShare()}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={role} onValueChange={v => setRole(v as 'viewer' | 'editor')}>
              <SelectTrigger className="w-full sm:flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer — can read</SelectItem>
                <SelectItem value="editor">Editor — can edit</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleShare}
              disabled={isPending || !email.trim()}
              className="w-full sm:w-auto"
            >
              Share
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-muted-foreground">{success}</p>}
        </div>

        {shares.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                People with access
              </p>
              <ul className="space-y-2">
                {shares.map(s => {
                  const shareEmail = s.profiles?.email ?? 'Unknown'
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-2 rounded-lg border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback className="text-xs">
                            {shareEmail.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{shareEmail}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:ml-2">
                        <Badge variant={roleBadge[s.role]} className="capitalize text-xs">
                          {s.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(s.id)}
                          disabled={isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
