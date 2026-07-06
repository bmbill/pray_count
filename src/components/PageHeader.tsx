import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  back,
  right,
}: {
  title: string
  back?: boolean
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="page-header">
      {back && (
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="back">
          ‹
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  )
}
