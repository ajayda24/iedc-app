'use client'

// Admin roster tools: a manual add-student form and an Excel/CSV importer.
// Parsing happens here in the browser via SheetJS; the parsed rows are handed to
// a server action that RE-VALIDATES everything (the client is never trusted).
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { read, utils } from 'xlsx'
import {
  addStudentAction,
  importStudentsAction,
} from '@/lib/queries/roster-actions'
import { Card } from './ui'
import { yearLabel } from './format'
import Icon from '@/components/landing/Icon'
import type { Department } from '@/lib/supabase/database.types'

const DEPARTMENTS: Department[] = ['CS', 'IT', 'EC', 'EEE', 'ME', 'PT', 'EP']

type Tab = 'add' | 'import'

// Header aliases → our canonical field. Lets the sheet use natural column names
// ("Student ID", "Roll No", "Dept", "Year of study", …).
const FIELD_ALIASES: Record<string, string[]> = {
  student_id: ['student_id', 'studentid', 'student id', 'roll', 'roll no', 'rollno', 'id', 'reg no', 'register number'],
  name: ['name', 'student name', 'full name'],
  email: ['email', 'e-mail', 'mail', 'email id'],
  department: ['department', 'dept', 'branch'],
  year: ['year', 'study year', 'current year', 'year of study'],
}

function normHeader(h: string): string | null {
  const key = h.trim().toLowerCase()
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(key)) return field
  }
  return null
}

export default function RosterManager() {
  const [tab, setTab] = useState<Tab>('add')
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex border-b border-black/5">
        <TabButton active={tab === 'add'} onClick={() => setTab('add')}>
          <Icon name="plus" className="w-4 h-4" />
          Add student
        </TabButton>
        <TabButton active={tab === 'import'} onClick={() => setTab('import')}>
          <Icon name="upload" className="w-4 h-4" />
          Import Excel
        </TabButton>
      </div>
      <div className="p-5">
        {tab === 'add' ? <AddForm /> : <ImportPanel />}
      </div>
    </Card>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-semibold transition-colors ${
        active
          ? 'text-indigo border-b-2 border-indigo -mb-px'
          : 'text-muted hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

// --- Manual entry -----------------------------------------------------------
function AddForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setOk(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addStudentAction({
        student_id: String(fd.get('student_id') ?? ''),
        name: String(fd.get('name') ?? ''),
        email: String(fd.get('email') ?? ''),
        department: String(fd.get('department') ?? ''),
        year: Number(fd.get('year')),
      })
      if (res.ok) {
        setOk(true)
        formRef.current?.reset()
        router.refresh()
      } else {
        setError(res.error ?? 'Could not save.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Student ID" name="student_id" placeholder="IEAXEIT000" required />
        <Field label="Name" name="name" placeholder="Akash Rajeev" required />
        <Field label="Email" name="email" type="email" placeholder="akash@example.com" required />
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1.5">
            Department
          </label>
          <select
            name="department"
            required
            defaultValue=""
            className="w-full rounded-xl bg-white/70 border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
          >
            <option value="" disabled>
              Select…
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1.5">
            Year
          </label>
          <select
            name="year"
            required
            defaultValue=""
            className="w-full rounded-xl bg-white/70 border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
          >
            <option value="" disabled>
              Select…
            </option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {yearLabel(y)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-peach">{error}</p>}
      {ok && (
        <p className="text-sm text-mint font-medium">Student saved to roster.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
      >
        <Icon name="plus" className="w-4 h-4" />
        {pending ? 'Saving…' : 'Add to roster'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-soft mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl bg-white/70 border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
      />
    </div>
  )
}

// --- Excel / CSV import -----------------------------------------------------
type ParsedRow = {
  student_id?: string
  name?: string
  email?: string
  department?: string
  year?: number
}

function ImportPanel() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setResult(null)
    setRows(null)
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const wb = read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) {
        setError('The file has no sheets.')
        return
      }
      // Read as a matrix so we can map headers by alias regardless of order.
      const matrix = utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
      if (matrix.length < 2) {
        setError('The sheet needs a header row and at least one student.')
        return
      }
      const headerRow = (matrix[0] as unknown[]).map((c) => String(c ?? ''))
      const fieldByCol = headerRow.map(normHeader)

      const missing = ['student_id', 'name', 'email', 'department', 'year'].filter(
        (f) => !fieldByCol.includes(f)
      )
      if (missing.length > 0) {
        setError(
          `Missing column(s): ${missing.join(', ')}. Expected headers: Student ID, Name, Email, Department, Year.`
        )
        return
      }

      const parsed: ParsedRow[] = []
      for (let i = 1; i < matrix.length; i++) {
        const cells = matrix[i] as unknown[]
        const row: ParsedRow = {}
        fieldByCol.forEach((field, col) => {
          if (!field) return
          const val = cells[col]
          if (field === 'year') {
            row.year = val === '' || val == null ? undefined : Number(val)
          } else {
            const s = String(val ?? '').trim()
            ;(row as Record<string, unknown>)[field] = s
          }
        })
        parsed.push(row)
      }
      setRows(parsed)
    } catch {
      setError('Could not read the file. Is it a valid .xlsx / .csv?')
    }
  }

  function doImport() {
    if (!rows) return
    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await importStudentsAction(rows)
      if (res.ok) {
        setResult(`Imported ${res.imported} student(s).`)
        setRows(null)
        setFileName(null)
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      } else {
        setError(res.error ?? 'Import failed.')
      }
    })
  }

  // How many parsed rows actually carry data (for the preview count).
  const dataRows = rows?.filter(
    (r) => r.student_id || r.name || r.email || r.department || r.year != null
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Upload an .xlsx or .csv with columns{' '}
        <span className="font-semibold text-ink-soft">
          Student ID, Name, Email, Department, Year
        </span>
        . Existing student IDs are updated; column order doesn&apos;t matter.
      </p>

      <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 bg-white/40 px-4 py-8 text-center cursor-pointer hover:border-indigo/40 transition-colors">
        <Icon name="upload" className="w-6 h-6 text-indigo" />
        <span className="text-sm font-semibold text-ink-soft">
          {fileName ?? 'Choose a spreadsheet'}
        </span>
        <span className="text-xs text-muted">.xlsx, .xls or .csv</span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="hidden"
        />
      </label>

      {error && <p className="text-sm text-peach">{error}</p>}
      {result && <p className="text-sm text-mint font-medium">{result}</p>}

      {dataRows && dataRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            {dataRows.length} row(s) ready to import.
          </p>
          <button
            type="button"
            onClick={doImport}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
          >
            <Icon name="check" className="w-4 h-4" />
            {pending ? 'Importing…' : `Import ${dataRows.length}`}
          </button>
        </div>
      )}
    </div>
  )
}
