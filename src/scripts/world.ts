const canvas = document.querySelector<HTMLCanvasElement>('#wedding-world');
const world = document.querySelector<HTMLElement>('.world');

if (canvas && world) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldUseStaticGarden = prefersReducedMotion || connection?.saveData === true || (deviceMemory !== undefined && deviceMemory <= 2);

  if (shouldUseStaticGarden) {
    canvas.classList.add('world-fallback');
  } else {
    let requested = false;
    let observer: IntersectionObserver | undefined;

    const loadWorld = async () => {
      if (requested) return;
      requested = true;
      observer?.disconnect();

      try {
        await import('./world-scene');
      } catch (error) {
        console.warn('No se pudo cargar el jardín 3D. Se mostrará la ilustración de respaldo.', error);
        canvas.classList.add('world-fallback');
      }
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) void loadWorld();
      }, { rootMargin: '240px 0px', threshold: 0 });
      observer.observe(world);
    } else {
      void loadWorld();
    }
  }
}
