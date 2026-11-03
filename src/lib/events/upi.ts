// UPI helpers for paid events. Client-safe (no server imports).
//
// We don't run a payment gateway: students pay the event's UPI ID directly and
// submit the 12-digit UPI transaction ID (UTR) as proof, which staff verify
// against the receiver's payment history.
import type { EventRow, PaymentStatus } from '@/lib/supabase/database.types'

export const UTR_PATTERN = /^\d{12}$/

// Strip spaces/dashes a student may paste along with the UTR.
export function normalizeUtr(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}

export function isValidUtr(raw: string): boolean {
  return UTR_PATTERN.test(normalizeUtr(raw))
}

// A upi://pay intent link. Opens GPay/PhonePe/Paytm on phones with the payee,
// amount and note prefilled; the same string is what the QR code encodes.
// The note carries the student ID so payments are easy to match in history.
export function buildUpiLink(opts: {
  upiId: string
  payeeName: string | null
  amount: number
  eventTitle: string
  studentId?: string | null
}): string {
  const note = ['IEDC', opts.eventTitle, opts.studentId]
    .filter(Boolean)
    .join(' ')
    .slice(0, 60)
  const params = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.payeeName || 'IEDC',
    am: opts.amount.toFixed(2),
    cu: 'INR',
    tn: note,
  })
  // URLSearchParams encodes spaces as '+', which some UPI apps show literally.
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`
}

export function formatFee(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// Props for the register button's pay flow, or null for a free event.
export function paymentInfoFor(
  ev: Pick<EventRow, 'title' | 'fee_amount' | 'upi_id' | 'upi_payee_name'>,
  studentId: string | null,
  status?: PaymentStatus
) {
  if (ev.fee_amount <= 0 || !ev.upi_id) return null
  return {
    fee: ev.fee_amount,
    upiId: ev.upi_id,
    payeeName: ev.upi_payee_name,
    eventTitle: ev.title,
    studentId,
    status,
  }
}
