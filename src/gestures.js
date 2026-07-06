/* ============================================================
   gestures.js  ->  LifeOS.Gestures
   Native-feeling touch gestures for the mobile app:
     • Swipe left/right between bottom-nav tabs (with a live,
       finger-following slide and a subtle slide-in on commit).
     • Pull-to-refresh on the Today screen.
   Kept minimal and fast. Ignores horizontal scrollers, inputs and
   the coach overlay so it never fights normal scrolling.
   ============================================================ */
(function (NS) {
  'use strict';
  const NAV = ['today', 'meals', 'move', 'care', 'progress', 'you'];
  const IGNORE = '.pills,.home-pills,.coach-chips,.coach-screen,.timeline-track,input,textarea,select,[type=range],.chartsvg,.measure-grid';

  function App() { return NS.App; }
  function homeRoute() { return NS.State && NS.State.route === 'home'; }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  let sx = 0, sy = 0, mode = null, wrap = null, ptr = null, pulling = 0;

  function ptrEl() {
    if (ptr) return ptr;
    ptr = document.createElement('div');
    ptr.className = 'ptr';
    ptr.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v5h-5"/></svg>';
    document.body.appendChild(ptr);
    return ptr;
  }

  function onStart(e) {
    mode = null;
    if (!App() || !homeRoute() || App()._coachOpen) return;
    if (e.target.closest && e.target.closest(IGNORE)) return;
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    wrap = document.querySelector('.wrap');
  }

  function onMove(e) {
    if (!wrap) return;
    const t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    const tab = App()._tab;
    if (mode === null) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3 && NAV.indexOf(tab) >= 0) mode = 'swipe';
      else if (dy > 14 && dy > Math.abs(dx) * 1.4 && tab === 'today' && window.scrollY <= 0) mode = 'ptr';
      else if (Math.abs(dy) > 12) mode = 'scroll';
    }
    if (mode === 'swipe') {
      e.preventDefault();
      wrap.style.transition = 'none';
      wrap.style.transform = 'translateX(' + (dx * 0.9) + 'px)';
      wrap.style.opacity = String(1 - Math.min(Math.abs(dx) / 500, 0.25));
    } else if (mode === 'ptr') {
      e.preventDefault();
      pulling = Math.min(dy * 0.5, 80);
      const p = ptrEl();
      p.style.transform = 'translate(-50%,' + (pulling - 46) + 'px)';
      p.style.opacity = String(Math.min(pulling / 60, 1));
      p.style.setProperty('--rot', (pulling * 4) + 'deg');
      p.firstChild.style.transform = 'rotate(' + (pulling * 4) + 'deg)';
    }
  }

  function commitSwipe(dx) {
    const tab = App()._tab; const i = NAV.indexOf(tab);
    const dir = dx < 0 ? 1 : -1;               // swipe left -> next tab
    const ni = i + dir;
    if (ni < 0 || ni >= NAV.length) { spring(); return; }
    buzz(8);
    App()._tab = NAV[ni];
    App().renderRoute();
    const nw = document.querySelector('.wrap');
    if (nw) {
      nw.style.transition = 'none';
      nw.style.transform = 'translateX(' + (dir * 34) + 'px)';
      nw.style.opacity = '0.35';
      requestAnimationFrame(function () {
        nw.style.transition = 'transform .2s var(--ease-out), opacity .2s';
        nw.style.transform = 'translateX(0)';
        nw.style.opacity = '1';
      });
    }
  }
  function spring() {
    if (!wrap) return;
    wrap.style.transition = 'transform .2s var(--ease-out), opacity .2s';
    wrap.style.transform = 'translateX(0)';
    wrap.style.opacity = '1';
  }

  function onEnd(e) {
    if (mode === 'swipe') {
      const dx = (e.changedTouches[0].clientX) - sx;
      if (Math.abs(dx) > 60) commitSwipe(dx); else spring();
    } else if (mode === 'ptr') {
      const p = ptrEl();
      if (pulling >= 55) {
        p.classList.add('show', 'spin');
        p.style.transform = 'translate(-50%,14px)';
        buzz(12);
        setTimeout(function () {
          App().renderRoute();
          p.classList.remove('spin');
          p.style.transform = 'translate(-50%,-60px)';
          p.style.opacity = '0';
          setTimeout(function () { p.classList.remove('show'); }, 250);
        }, 550);
      } else {
        p.style.transform = 'translate(-50%,-60px)'; p.style.opacity = '0';
      }
    }
    mode = null; wrap = null; pulling = 0;
  }

  function init() {
    if (init._done) return; init._done = true;
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
  }

  NS.Gestures = { init };
  if (typeof document !== 'undefined' && !window.__LIFEOS_TEST__) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(window.LifeOS = window.LifeOS || {});
