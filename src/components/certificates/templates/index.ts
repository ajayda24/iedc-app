import type { CertificateTemplate } from '@/components/certificates/types'
import Aurora from './Aurora'

// Registry of code certificate templates. Add new templates here; the id is what
// events store in `certificate_template` and what template-map.ts resolves to.
export const TEMPLATE_REGISTRY: Record<string, CertificateTemplate> = {
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    description: 'Pastel glass house style. Works for every certificate type.',
    Component: Aurora,
  },
}

// Resolve a template by id, falling back to Aurora for unknown ids so a stale
// or mistyped `certificate_template` never breaks rendering.
export function getTemplate(id: string | null | undefined): CertificateTemplate {
  return (id && TEMPLATE_REGISTRY[id]) || TEMPLATE_REGISTRY.aurora
}

export const TEMPLATE_LIST = Object.values(TEMPLATE_REGISTRY)
