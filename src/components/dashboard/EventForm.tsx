'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createEventAction,
  updateEventAction,
  type ActionResult,
} from '@/lib/queries/manage-actions'
import { CATEGORY_LABEL } from './format'
import Icon from '@/components/landing/Icon'
import Select from './Select'
import DateTimePicker from './DateTimePicker'
import type { EventRow, EventCategory } from '@/lib/supabase/database.types'

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as EventCategory[]).map(
  (c) => ({ value: c, label: CATEGORY_LABEL[c] })
)
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STEPS = [
  { title: 'Details', hint: 'What & where' },
  { title: 'Schedule', hint: 'When & capacity' },
  { title: 'Rewards', hint: 'Points & publish' },
]

// Shared create/edit form as a 3-step stepper. All fields stay mounted (steps
// toggle with `hidden`) so a single FormData submit captures everything
// regardless of which step is active. `event` present => edit mode.
export default function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const editing = !!event

  // Required-field check for a given step, reading live values from the form.
  // Returns an error message, or null when the step is complete.
  function validateStep(target: number): string | null {
    const form = formRef.current
    if (!form) return null
    const fd = new FormData(form)
    const val = (k: string) => (fd.get(k) as string)?.trim() ?? ''
    if (target === 0) {
      if (!val('title')) return 'Please enter a title.'
      if (!val('category')) return 'Please pick a category.'
    }
    if (target === 1) {
      if (!val('start_date')) return 'Please choose a start date & time.'
    }
    return null
  }

  // Advance/jump only if every step up to (not including) `target` is valid.
  function goToStep(target: number) {
    if (target > step) {
      for (let i = step; i < target; i++) {
        const err = validateStep(i)
        if (err) {
          setError(err)
          setStep(i)
          return
        }
      }
    }
    setError(null)
    setStep(target)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Enter pressed on an earlier step should advance, not submit.
    if (step !== STEPS.length - 1) {
      goToStep(step + 1)
      return
    }
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      // On success the action redirects (throws NEXT_REDIRECT) and never
      // returns; only failures resolve to a result we can show.
      const res: ActionResult = editing
        ? await updateEventAction(event.id, fd)
        : await createEventAction(fd)
      if (res && !res.ok) {
        setError(res.error ?? 'Something went wrong.')
        // Send the user back to the step most likely holding the problem.
        if (/title|category/i.test(res.error ?? '')) setStep(0)
        else if (/date/i.test(res.error ?? '')) setStep(1)
      }
    })
  }

  const isLast = step === STEPS.length - 1

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      {/* Stepper header */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={s.title} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => goToStep(i)}
                className="flex items-center gap-2.5 text-left group"
              >
                <span
                  className={`grid place-items-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-colors ${
                    active
                      ? 'bg-indigo text-white'
                      : done
                        ? 'bg-indigo/15 text-indigo'
                        : 'bg-black/5 text-muted'
                  }`}
                >
                  {done ? <Icon name="check" className="w-4 h-4" /> : i + 1}
                </span>
                <span className="hidden sm:block">
                  <span
                    className={`block text-sm font-semibold leading-tight ${
                      active ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-xs text-muted">{s.hint}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-px flex-1 transition-colors ${
                    done ? 'bg-indigo/40' : 'bg-black/10'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Step 1 — Details */}
      <div className={step === 0 ? 'space-y-5' : 'hidden'}>
        <Field label="Title" required>
          <input
            name="title"
            defaultValue={event?.title ?? ''}
            required
            className={inputCls}
            placeholder="e.g. Intro to React Workshop"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            defaultValue={event?.description ?? ''}
            rows={4}
            className={inputCls}
            placeholder="What's this event about?"
          />
        </Field>

        <Field label="Category" required>
          <Select
            name="category"
            options={CATEGORY_OPTIONS}
            defaultValue={event?.category ?? 'workshop'}
          />
        </Field>

        <Field label="Venue">
          <input
            name="venue"
            defaultValue={event?.venue ?? ''}
            className={inputCls}
            placeholder="e.g. Seminar Hall A"
          />
        </Field>

        <Field label="Banner URL">
          <input
            name="banner"
            type="url"
            defaultValue={event?.banner ?? ''}
            className={inputCls}
            placeholder="https://…"
          />
        </Field>
      </div>

      {/* Step 2 — Schedule */}
      <div className={step === 1 ? 'space-y-5' : 'hidden'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start date & time" required>
            <DateTimePicker
              name="start_date"
              defaultValue={event?.start_date}
            />
          </Field>
          <Field label="End date & time">
            <DateTimePicker name="end_date" defaultValue={event?.end_date} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Registration deadline">
            <DateTimePicker
              name="registration_deadline"
              defaultValue={event?.registration_deadline}
            />
          </Field>
          <Field label="Max participants">
            <input
              name="max_participants"
              type="number"
              min={1}
              defaultValue={event?.max_participants ?? ''}
              className={inputCls}
              placeholder="Unlimited"
            />
          </Field>
        </div>
      </div>

      {/* Step 3 — Rewards & publish */}
      <div className={step === 2 ? 'space-y-5' : 'hidden'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Points">
            <input
              name="points"
              type="number"
              min={0}
              defaultValue={event?.points ?? 0}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <Select
              name="status"
              options={STATUS_OPTIONS}
              defaultValue={event?.status ?? 'draft'}
            />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink-soft mb-1">
            Benefits
          </legend>
          <Checkbox
            name="benefit_attendance"
            label="Counts as attendance"
            defaultChecked={event?.benefit_attendance ?? true}
          />
          <Checkbox
            name="benefit_certificate"
            label="Certificate awarded"
            defaultChecked={event?.benefit_certificate ?? false}
          />
          <Checkbox
            name="benefit_activity_points"
            label="Activity points"
            defaultChecked={event?.benefit_activity_points ?? false}
          />
        </fieldset>
      </div>

      {error && (
        <p className="text-sm text-peach bg-peach/10 rounded-2xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() =>
            step === 0 ? router.push('/dashboard/manage') : setStep(step - 1)
          }
          className="rounded-2xl border border-black/10 text-ink-soft text-sm font-semibold px-5 py-2.5 hover:bg-white/60 transition-colors"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {/* Always a type="button" — never a submit — so advancing to the last
            step can't let a freshly-swapped submit button catch the same click
            and fire the action. On the last step we submit programmatically. */}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            isLast ? formRef.current?.requestSubmit() : goToStep(step + 1)
          }
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-5 py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
        >
          {isLast ? (
            pending ? (
              'Saving…'
            ) : editing ? (
              'Save changes'
            ) : (
              'Create event'
            )
          ) : (
            <>
              Next
              <Icon name="arrow" className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-indigo/40 focus:bg-white transition-colors'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  // A <div>, not a <label>: several fields hold custom button-based controls
  // (Select, DateTimePicker) where a wrapping label would double-fire clicks.
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-peach"> *</span>}
      </span>
      {children}
    </div>
  )
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 rounded accent-indigo"
      />
      {label}
    </label>
  )
}
