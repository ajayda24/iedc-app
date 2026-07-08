'use client'

import { useCallback, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { CERT_WIDTH, CERT_HEIGHT } from './types'
import Icon from '@/components/landing/Icon'

// Download / share controls for a rendered certificate. Captures the fixed-size
// [data-cert-node] element (rendered by CertificateCanvas) at 2× for crisp
// print, then offers PNG or A4-landscape PDF. jsPDF is imported lazily so it
// only loads when the user actually exports.
//
// `scopeSelector` optionally scopes the node lookup (defaults to document) so
// multiple certificates on one page don't clash; pass a wrapper's id.
export default function CertificateActions({
  serial,
  verifyUrl,
  recipientName,
}: {
  serial: string
  verifyUrl: string
  recipientName: string
}) {
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // The certificate node lives in a sibling subtree (the canvas). Find the
  // nearest one in the document; there's one per certificate page.
  const findNode = useCallback((): HTMLElement | null => {
    return document.querySelector<HTMLElement>('[data-cert-node]')
  }, [])

  const capture = useCallback(async (): Promise<string | null> => {
    const node = findNode()
    if (!node) return null
    // Render at 2× device pixels for print sharpness. `html-to-image` inlines
    // computed styles, so the CSS-var accents and gradients are captured.
    return toPng(node, {
      width: CERT_WIDTH,
      height: CERT_HEIGHT,
      pixelRatio: 2,
      cacheBust: true,
      // Keep the node at its natural (unscaled) transform during capture.
      style: { transform: 'none', margin: '0' },
    })
  }, [findNode])

  const fileBase = `${recipientName.replace(/\s+/g, '-')}-${serial}`.toLowerCase()

  const downloadPng = useCallback(async () => {
    setBusy('png')
    try {
      const dataUrl = await capture()
      if (!dataUrl) return
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${fileBase}.png`
      a.click()
    } finally {
      setBusy(null)
    }
  }, [capture, fileBase])

  const downloadPdf = useCallback(async () => {
    setBusy('pdf')
    try {
      const dataUrl = await capture()
      if (!dataUrl) return
      const { jsPDF } = await import('jspdf')
      // A4 landscape in points (pt): 842 × 595. Fit the image to the page.
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      // The certificate ratio (1123/794) ≈ A4 landscape ratio (842/595), so it
      // fills the page with negligible letterboxing.
      pdf.addImage(dataUrl, 'PNG', 0, 0, pw, ph, undefined, 'FAST')
      pdf.save(`${fileBase}.pdf`)
    } finally {
      setBusy(null)
    }
  }, [capture, fileBase])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked (insecure context / permission) — no-op
    }
  }, [verifyUrl])

  return (
    <div ref={rootRef} className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy !== null}
        className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        <Icon name="image" className="w-4 h-4" />
        {busy === 'png' ? 'Rendering…' : 'PNG'}
      </button>

      <button
        type="button"
        onClick={downloadPdf}
        disabled={busy !== null}
        className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        <Icon name="download" className="w-4 h-4" />
        {busy === 'pdf' ? 'Building…' : 'PDF'}
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
      >
        <Icon name={copied ? 'check' : 'link'} className="w-4 h-4" />
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
