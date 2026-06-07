'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui'

export function BackToDashboardLink() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-6 gap-1.5"
      onClick={() => router.push('/dashboard')}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back to dashboard</span>
      <span className="sm:hidden">Dashboard</span>
    </Button>
  )
}
