// App-level certificate identity: the issuing org and the default signatory.
// These are placeholders you'll customize once real logos/signatures are ready.
// `logoUrl` and signature images can point at files in /public (see below) or a
// public storage bucket. Keeping them here means one edit updates every cert.
//
// To add assets: drop files in public/certificates/ and reference them as
// '/certificates/logo.svg' etc. (Next serves /public at the site root.)

export const CERT_ORG = {
  name: 'IEDC Hub',
  tagline: 'Innovation & Entrepreneurship',
  // e.g. '/certificates/logo.svg' — null renders the lettermark fallback.
  logoUrl: null as string | null,
}

export const CERT_SIGNATORY = {
  name: 'Dr. Meera Nair',
  role: 'Nodal Officer, IEDC',
  // e.g. '/certificates/signature.png' — null renders a ruled signature line.
  signatureUrl: null as string | null,
}
