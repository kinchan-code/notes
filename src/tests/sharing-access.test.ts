import { describe, it, expect } from 'vitest'

/**
 * Unit tests for sharing/access-control logic.
 *
 * These tests exercise the pure access-checking logic in isolation,
 * without a real database. Integration tests against Supabase can be
 * added by wiring up a test Supabase project in CI.
 */

type Role = 'owner' | 'editor' | 'viewer' | null

type Document = { id: string; owner_id: string }
type Share = { document_id: string; shared_with_user_id: string; role: 'editor' | 'viewer' }

function checkAccess(doc: Document, shares: Share[], userId: string): Role {
  if (!userId) return null
  if (doc.owner_id === userId) return 'owner'
  const share = shares.find(
    s => s.document_id === doc.id && s.shared_with_user_id === userId
  )
  if (!share) return null
  return share.role
}

function canEdit(role: Role): boolean {
  return role === 'owner' || role === 'editor'
}

function canShare(role: Role): boolean {
  return role === 'owner'
}

function canRename(role: Role): boolean {
  return role === 'owner'
}

const doc: Document = { id: 'doc-1', owner_id: 'alice' }
const shares: Share[] = [
  { document_id: 'doc-1', shared_with_user_id: 'bob-viewer', role: 'viewer' },
  { document_id: 'doc-1', shared_with_user_id: 'carol-editor', role: 'editor' },
]

describe('document access control', () => {
  it('owner can access own document', () => {
    expect(checkAccess(doc, shares, 'alice')).toBe('owner')
  })

  it('shared viewer can access document', () => {
    expect(checkAccess(doc, shares, 'bob-viewer')).toBe('viewer')
  })

  it('shared editor can access document', () => {
    expect(checkAccess(doc, shares, 'carol-editor')).toBe('editor')
  })

  it('unrelated user cannot access document', () => {
    expect(checkAccess(doc, shares, 'eve')).toBeNull()
  })

  it('viewer cannot edit document content', () => {
    const role = checkAccess(doc, shares, 'bob-viewer')
    expect(canEdit(role)).toBe(false)
  })

  it('editor can edit document content', () => {
    const role = checkAccess(doc, shares, 'carol-editor')
    expect(canEdit(role)).toBe(true)
  })

  it('only owner can rename or share', () => {
    expect(canRename(checkAccess(doc, shares, 'alice'))).toBe(true)
    expect(canShare(checkAccess(doc, shares, 'alice'))).toBe(true)

    expect(canRename(checkAccess(doc, shares, 'carol-editor'))).toBe(false)
    expect(canShare(checkAccess(doc, shares, 'carol-editor'))).toBe(false)

    expect(canRename(checkAccess(doc, shares, 'bob-viewer'))).toBe(false)
    expect(canShare(checkAccess(doc, shares, 'bob-viewer'))).toBe(false)
  })
})
