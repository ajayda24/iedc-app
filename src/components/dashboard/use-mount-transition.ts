'use client'

import { useState, useEffect, useRef } from 'react'

// Keeps a component mounted through its exit animation.
//
//   const { mounted, show } = useMountTransition(open)
//   if (!mounted) return null
//   <div data-show={show} className="anim-… ">
//
// `mounted` stays true until `duration` ms after `open` flips to false, so the
// exit transition can play. `show` is the animation flag: false before enter
// and during exit, true while open.
//
// `duration` must be >= the element's CSS transition. The 240ms default buffers
// the anim-* classes (180–200ms); pass more for longer ones (e.g. anim-drawer).
export function useMountTransition(open: boolean, duration = 240) {
  const [show, setShow] = useState(false)
  // `closing` extends mounting past open->false so the exit transition plays.
  const [closing, setClosing] = useState(false)
  // Previous `open`, tracked to detect transitions during render (not effects).
  const [prevOpen, setPrevOpen] = useState(open)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Adjust derived state DURING render (supported React pattern) so `mounted`
  // and `show` are correct in the very same commit `open` changes — no
  // mount/unmount blink, and the exit starts from the visible state.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setClosing(false)
    } else {
      // Entering the closing phase: keep mounted, and hide now so the exit
      // transition runs from visible -> hidden.
      setClosing(true)
      setShow(false)
    }
  }

  const mounted = open || closing

  useEffect(() => {
    clearTimeout(timer.current)
    if (open) {
      // Flip `show` on the next frame so CSS animates from hidden -> visible.
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    }
    // Closing: unmount after the exit transition has had time to play.
    timer.current = setTimeout(() => setClosing(false), duration)
    return () => clearTimeout(timer.current)
  }, [open, duration])

  return { mounted, show }
}
