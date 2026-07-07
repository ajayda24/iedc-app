// Client-side avatar image compression. Resizes to a square-ish max edge and
// re-encodes as WebP so uploads stay small (typically well under ~300KB) and
// consistent. Runs in the browser only (uses Image/canvas).

const MAX_EDGE = 512 // px — longest side after resize
const MAX_INPUT_BYTES = 2 * 1024 * 1024 // reject > 2MB before we even decode
const WEBP_QUALITY = 0.85

export class AvatarError extends Error {}

// Compress a picked File into a WebP Blob. Throws AvatarError with a
// user-facing message on invalid/oversized input or encode failure.
export async function compressAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new AvatarError('Please choose an image file.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new AvatarError('Image is too large (max 2MB). Pick a smaller one.')
  }

  const bitmap = await loadImage(file)
  const { width, height } = fit(bitmap.width, bitmap.height, MAX_EDGE)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AvatarError('Could not process the image.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  )
  if (!blob) throw new AvatarError('Could not encode the image.')
  return blob
}

// Scale (w,h) down so the longest edge is <= max, preserving aspect ratio.
function fit(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  const scale = max / Math.max(w, h)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new AvatarError('That image could not be read.'))
    }
    img.src = url
  })
}
