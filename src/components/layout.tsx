import type { ReactNode } from 'react'

export interface LayoutProps {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-full min-h-[400px] w-full min-w-[360px] flex-col items-center justify-center">
      {children}
    </div>
  )
}
