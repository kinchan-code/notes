import type { DocumentRole } from '@/features/documents'

const styles: Record<DocumentRole, string> = {
  owner: 'bg-violet-100 text-violet-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const labels: Record<DocumentRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
}

export function PermissionBadge({ role }: Readonly<{ role: DocumentRole }>) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role]}`}>
      {labels[role]}
    </span>
  )
}
