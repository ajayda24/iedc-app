import type { CertificateTemplate } from '@/components/certificates/types'
import Aurora from './Aurora'
import Meridian from './Meridian'
import Laurel from './Laurel'

// Registry of code certificate templates. Add new templates here; the id is what
// events store in `certificate_template` and what template-map.ts resolves to.
export const TEMPLATE_REGISTRY: Record<string, CertificateTemplate> = {
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    description: 'Pastel glass house style. Works for every certificate type.',
    Component: Aurora,
  },
  meridian: {
    id: 'meridian',
    label: 'Meridian',
    description:
      'Formal centered layout with a ruled frame and metallic corners. High contrast at every type.',
    Component: Meridian,
  },
  laurel: {
    id: 'laurel',
    label: 'Laurel',
    description:
      'Split layout with a deep side panel, embossed seal, and credential facts. The most premium option.',
    Component: Laurel,
  },
}

// Resolve a template by id, falling back to Aurora for unknown ids so a stale
// or mistyped `certificate_template` never breaks rendering.
export function getTemplate(id: string | null | undefined): CertificateTemplate {
  return (id && TEMPLATE_REGISTRY[id]) || TEMPLATE_REGISTRY.aurora
}

export const TEMPLATE_LIST = Object.values(TEMPLATE_REGISTRY)
