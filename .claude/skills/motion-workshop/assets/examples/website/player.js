/* Copy with runtime/*.js and retain the MIT license. No library dependencies. */
(() => {
  'use strict';
  // Synchronous, deterministic entry point for frame-based renderers.
  function createFrameRenderer(canvas, rawProject) {
    const project = MotionProject.validate(rawProject);
    const duration = MotionProject.duration(project);
    const frames = Math.round(duration * project.fps);
    return {
      project, duration, frames,
      renderFrame(frame) {
        if (!Number.isFinite(frame)) throw new Error('frame must be finite');
        const index = Math.max(0, Math.min(frames - 1, Math.floor(frame)));
        return MotionProject.render(project, index / project.fps, canvas);
      }
    };
  }
  function createPreviewPlayer(canvas, rawProject, onFrame = () => {}) {
    const renderer = createFrameRenderer(canvas, rawProject);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, playing = false, raf = 0, start = 0, disposed = false;
    function draw() { renderer.renderFrame(frame); onFrame(frame / renderer.project.fps, playing); }
    function pause() { playing = false; cancelAnimationFrame(raf); raf = 0; if (!disposed) draw(); }
    function tick(now) {
      if (!playing || disposed) return;
      frame = Math.floor((now - start) / 1000 * renderer.project.fps) % renderer.frames;
      draw(); raf = requestAnimationFrame(tick);
    }
    function play() {
      if (disposed || playing) return;
      // Explicit user action may enable motion even with reduced-motion set.
      playing = true; start = performance.now() - frame / renderer.project.fps * 1000;
      draw(); raf = requestAnimationFrame(tick);
    }
    function seek(seconds) {
      pause(); frame = Math.max(0, Math.min(renderer.frames - 1, Math.round(seconds * renderer.project.fps))); draw();
    }
    const visibility = () => { if (document.hidden) pause(); };
    const preference = () => { if (reduced.matches) pause(); };
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    draw(); // Initial state is static. Motion starts only after a user's click.
    return {
      ...renderer, play, pause, seek,
      get playing() { return playing; },
      dispose() {
        pause(); disposed = true;
        document.removeEventListener('visibilitychange', visibility);
        reduced.removeEventListener('change', preference);
      }
    };
  }
  window.MotionWorkshopPlayer = { createFrameRenderer, createPreviewPlayer };
})();
