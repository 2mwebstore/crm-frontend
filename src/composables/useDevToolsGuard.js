// ---------------------------------------------------------------------
// IMPORTANT — read before relying on this for anything security-critical:
//
// This is a DETERRENT, not real protection. It can be bypassed by:
//   - opening DevTools before this script runs (e.g. via a breakpoint on
//     page load, or disabling JS momentarily)
//   - using a separate/undocked DevTools window (the size-heuristic below
//     only catches a DOCKED panel)
//   - browser extensions, some accessibility tools, or just calling the
//     API directly with curl/Postman — nothing here touches the network
//   - simply using a browser/device that doesn't fire these events
//
// It also risks FALSE POSITIVES for real users: narrow windows,
// split-screen setups, some responsive-design modes, and certain
// extensions can all trip the size-based check below.
//
// Your real security boundary is (and must stay) server-side — the JWT +
// permission checks your API already enforces. This file only makes
// casual poking-around slightly less convenient; treat it as cosmetic.
//
// Every trigger below does the exact same thing: redirect to DECOY_URL.
// Nothing here touches auth/token/session — that's untouched on purpose.
// ---------------------------------------------------------------------

const DECOY_URL = 'https://google.com'

function decoyRedirect() {
  window.location.href = DECOY_URL
}

function onKeydown(e) {
  const key = e.key?.toUpperCase()

  // F12. NOTE (Mac): many Mac keyboards send F12 as a system media/
  // brightness key by default, so it never reaches the browser at all
  // unless the person holds Fn+F12 or has "Use F1, F2, etc. as standard
  // function keys" enabled in System Settings → Keyboard. That's an
  // OS-level behavior this script can't change.
  if (key === 'F12') { e.preventDefault(); decoyRedirect(); return }

  // Ctrl/Cmd+Shift+I (Inspect), Ctrl/Cmd+Shift+J (Console), Ctrl/Cmd+Shift+C (Inspect element)
  // — the Windows/Linux Chrome/Firefox binding.
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(key)) {
    e.preventDefault(); decoyRedirect(); return
  }

  // Cmd+Option+I / J / C — the actual macOS Chrome/Safari binding (uses
  // Option/Alt, not Shift). This is the shortcut Mac users actually press
  // day-to-day.
  if (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(key)) {
    e.preventDefault(); decoyRedirect(); return
  }

  // Ctrl/Cmd+U (View Source)
  if ((e.ctrlKey || e.metaKey) && key === 'U') {
    e.preventDefault(); decoyRedirect()
  }
}

// Heuristic for an already-open, DOCKED DevTools panel: when docked, the
// browser's outer chrome stays the same size but the visible viewport
// shrinks by roughly the panel's width/height. This does NOT catch an
// undocked DevTools window — there's no reliable way to detect that from
// page JS.
const DOCK_THRESHOLD = 160
let sizeCheckInterval = null
function checkDockedSize() {
  const widthDiff = window.outerWidth - window.innerWidth
  const heightDiff = window.outerHeight - window.innerHeight
  if (widthDiff > DOCK_THRESHOLD || heightDiff > DOCK_THRESHOLD) {
    decoyRedirect()
  }
}

let installed = false
export function installDevToolsGuard() {
  if (installed) return
  installed = true

  window.addEventListener('keydown', onKeydown)
  // Optional: also block the right-click context menu. Left disabled by
  // default since it's more invasive to legitimate users (copy/paste,
  // "Open link in new tab", etc.) — uncomment if you want it too.
  // window.addEventListener('contextmenu', e => e.preventDefault())

  sizeCheckInterval = setInterval(checkDockedSize, 1000)
}

export function uninstallDevToolsGuard() {
  window.removeEventListener('keydown', onKeydown)
  if (sizeCheckInterval) clearInterval(sizeCheckInterval)
  installed = false
}