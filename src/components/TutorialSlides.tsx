import { useState } from 'react'
import { useApp } from '../context/AppContext'

const SLIDES = [
  { icon: '📿', titleKey: 'onboard.slide1.title', bodyKey: 'onboard.slide1.body' },
  { icon: '👨‍👩‍👧‍👦', titleKey: 'onboard.slide2.title', bodyKey: 'onboard.slide2.body' },
  { icon: '🤝', titleKey: 'onboard.slide4.title', bodyKey: 'onboard.slide4.body' },
  { icon: '📈', titleKey: 'onboard.slide3.title', bodyKey: 'onboard.slide3.body' },
] as const

export function TutorialSlides({ onDone }: { onDone: () => void }) {
  const { t } = useApp()
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  return (
    <div className="stack" style={{ padding: '24px 8px' }}>
      <div className="center" style={{ fontSize: '5em', lineHeight: 1 }}>
        {slide.icon}
      </div>
      <h2 className="center" style={{ fontSize: '1.5em', margin: '8px 0' }}>
        {t(slide.titleKey)}
      </h2>
      <p className="center muted" style={{ fontSize: '1.15em', minHeight: '3.5em' }}>
        {t(slide.bodyKey)}
      </p>
      <div className="center" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: idx === i ? 'var(--primary)' : 'var(--border)',
            }}
          />
        ))}
      </div>
      <button className="btn" onClick={() => (last ? onDone() : setI(i + 1))}>
        {last ? t('common.done') : t('common.next')}
      </button>
    </div>
  )
}
