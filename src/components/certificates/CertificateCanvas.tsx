'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { getTemplate } from './templates'
import { CERT_WIDTH, CERT_HEIGHT } from './types'
import type { CertificateData } from './types'

// Renders a certificate template at its fixed A4-landscape pixel size, scaled
// down to fit the parent width.
//
// The inner `[data-cert-node]` element is always exactly CERT_WIDTH×CERT_HEIGHT
// px — the export code (CertificateActions) captures THAT node, so PNG/PDF come
// out at full print resolution regardless of on-screen scale.
//
// Why JS measurement (not pure CSS): `transform: scale()` needs a UNITLESS
// number, and CSS can't divide a container-query unit (100cqw) into a ratio.
// So we measure the outer width with a ResizeObserver and set the scale factor.
export default function CertificateCanvas({
  data,
  templateId,
}: {
  data: CertificateData
  templateId?: string | null
}) {
  const { Component } = getTemplate(templateId)
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / CERT_WIDTH)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    // Outer reserves the correct height via aspect-ratio and clips the scaled
    // child. Height follows from the aspect-ratio so it tracks the scaled node.
    <div
      ref={outerRef}
      className="cert-canvas"
      style={{ aspectRatio: `${CERT_WIDTH} / ${CERT_HEIGHT}` }}
    >
      <div
        className="cert-canvas-scale"
        style={{
          transform: `scale(${scale})`,
          // Hide until measured to avoid a full-size flash on first paint.
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        <div data-cert-node style={{ width: CERT_WIDTH, height: CERT_HEIGHT }}>
          <Component data={data} />
        </div>
      </div>
    </div>
  )
}
