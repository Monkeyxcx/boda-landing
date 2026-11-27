const reduceScrollMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const focusTargets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

if (focusTargets.length && !reduceScrollMotion) {
  let focusFrame = 0;

  const updateFocus = () => {
    focusFrame = 0;
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight * 0.5;
    const updates = focusTargets.map((target) => {
      const rect = target.getBoundingClientRect();
      const targetCenter = rect.top + rect.height * 0.5;
      const focusRange = viewportHeight * 0.58 + Math.min(rect.height * 0.18, viewportHeight * 0.2);
      const distance = Math.abs(viewportCenter - targetCenter);
      const proximity = Math.max(0, Math.min(1, 1 - distance / focusRange));
      const progress = proximity * proximity * (3 - 2 * proximity);
      const visibleProgress = target.matches(':focus-within') ? 1 : progress;

      return {
        target,
        opacity: (0.5 + visibleProgress * 0.5).toFixed(3),
        scale: (0.5 + visibleProgress * 0.5).toFixed(3),
      };
    });

    updates.forEach(({ target, opacity, scale }) => {
      target.style.setProperty('--scroll-focus-opacity', opacity);
      target.style.setProperty('--scroll-focus-scale', scale);
    });
    document.documentElement.classList.add('scroll-focus-enabled');
  };

  const scheduleFocusUpdate = () => {
    if (!focusFrame) focusFrame = window.requestAnimationFrame(updateFocus);
  };

  window.addEventListener('scroll', scheduleFocusUpdate, { passive: true });
  window.addEventListener('resize', scheduleFocusUpdate, { passive: true });
  document.addEventListener('focusin', scheduleFocusUpdate);
  updateFocus();
}

const wordHeading = document.querySelector<HTMLElement>('.word-reveal');
if (wordHeading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const words = wordHeading.textContent?.trim().split(/\s+/) ?? [];
  wordHeading.replaceChildren(...words.map((word, index) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    span.style.transitionDelay = `${Math.min(index * 42, 500)}ms`;
    return span;
  }));
  const wordsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.7, rootMargin: '-38% 0px -38% 0px' });
  wordHeading.querySelectorAll('.word').forEach((word) => wordsObserver.observe(word));
} else {
  wordHeading?.classList.add('is-visible');
}

const photoRing = document.querySelector<HTMLElement>('.photo-ring');
const photoRingTrack = photoRing?.querySelector<HTMLElement>('.photo-ring-track');
const photoRingItems = Array.from(document.querySelectorAll<HTMLElement>('.photo-ring-item'));
const ringAnimation = photoRingTrack?.getAnimations().find((animation) => (animation as CSSAnimation).animationName === 'wedding-ring');
const ringMotionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ringStatus = document.querySelector<HTMLElement>('[data-ring-status]');

if (photoRing && photoRingTrack && ringAnimation && photoRingItems.length > 0) {
  const ringElement = photoRing;
  const rotation = ringAnimation;
  const stepAngle = 360 / photoRingItems.length;
  let drag: { pointerId: number; startX: number; startTime: number; itemIndex: number; moved: boolean } | null = null;
  let resumeTimer = 0;
  let seekGeneration = 0;

  const duration = () => {
    const value = rotation.effect?.getTiming().duration;
    return typeof value === 'number' && value > 0 ? value : 38_000;
  };
  const wrapTime = (time: number, length: number) => ((time % length) + length) % length;
  const currentTime = (length = duration()) => wrapTime(Number(rotation.currentTime ?? 0), length);

  function updateCenteredItem(time = currentTime()) {
    const angle = time / duration() * 360;
    const nearestIndex = Math.round(-angle / stepAngle);
    const centeredIndex = (nearestIndex % photoRingItems.length + photoRingItems.length) % photoRingItems.length;
    const correction = -(angle + nearestIndex * stepAngle);

    photoRingItems.forEach((item, index) => {
      const centered = index === centeredIndex;
      item.classList.toggle('is-centered', centered);
      if (centered) item.style.setProperty('--front-correction', `${correction}deg`);
      else item.style.removeProperty('--front-correction');
    });
    if (ringStatus) ringStatus.textContent = `Fotografía ${centeredIndex + 1} de ${photoRingItems.length}`;
  }

  function animateToTime(target: number, done: () => void) {
    const length = duration();
    const start = currentTime(length);
    const end = wrapTime(target, length);
    let delta = end - start;
    if (delta > length / 2) delta -= length;
    if (delta < -length / 2) delta += length;

    rotation.pause();
    if (ringMotionReduced || Math.abs(delta) < .001) {
      rotation.currentTime = end;
      updateCenteredItem(end);
      done();
      return;
    }

    const generation = ++seekGeneration;
    const startedAt = performance.now();
    const snapDuration = 240;
    const tick = (now: number) => {
      if (generation !== seekGeneration) return;
      const progress = Math.min(1, (now - startedAt) / snapDuration);
      const eased = progress * progress * (3 - 2 * progress);
      const time = wrapTime(start + delta * eased, length);
      rotation.currentTime = time;
      updateCenteredItem(time);
      if (progress < 1) window.requestAnimationFrame(tick);
      else {
        rotation.currentTime = end;
        updateCenteredItem(end);
        done();
      }
    };
    window.requestAnimationFrame(tick);
  }

  function scheduleAutoResume() {
    window.clearTimeout(resumeTimer);
    if (ringMotionReduced) return;
    resumeTimer = window.setTimeout(() => {
      photoRingItems.forEach((item) => {
        item.classList.remove('is-centered');
        item.style.removeProperty('--front-correction');
      });
      rotation.play();
    }, 900);
  }

  function selectPhoto(index: number) {
    const targetAngle = ((-index * stepAngle) % 360 + 360) % 360;
    const targetTime = targetAngle / 360 * duration();
    window.clearTimeout(resumeTimer);
    seekGeneration += 1;
    animateToTime(targetTime, scheduleAutoResume);
  }

  document.querySelectorAll<HTMLButtonElement>('[data-ring-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.ringStep);
      if (!Number.isFinite(direction) || direction === 0) return;
      const angle = currentTime() / duration() * 360;
      const active = (Math.round(-angle / stepAngle) % photoRingItems.length + photoRingItems.length) % photoRingItems.length;
      selectPhoto((active + direction + photoRingItems.length) % photoRingItems.length);
    });
  });

  ringElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('.photo-ring-item');
    if (!card) return;
    const itemIndex = photoRingItems.indexOf(card);
    if (itemIndex < 0) return;

    window.clearTimeout(resumeTimer);
    seekGeneration += 1;
    rotation.pause();
    ringElement.classList.add('is-dragging');
    drag = { pointerId: event.pointerId, startX: event.clientX, startTime: currentTime(), itemIndex, moved: false };
    ringElement.setPointerCapture(event.pointerId);
  });

  ringElement.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) drag.moved = true;
    if (!drag.moved) return;
    const length = duration();
    const time = wrapTime(drag.startTime + (deltaX * .55 / 360) * length, length);
    rotation.currentTime = time;
    updateCenteredItem(time);
  });

  function finishDrag(event: PointerEvent, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const state = drag;
    drag = null;
    ringElement.classList.remove('is-dragging');
    if (ringElement.hasPointerCapture(event.pointerId)) ringElement.releasePointerCapture(event.pointerId);

    if (cancelled) {
      scheduleAutoResume();
      return;
    }
    if (!state.moved) {
      selectPhoto(state.itemIndex);
      return;
    }

    const angle = currentTime() / duration() * 360;
    const snappedIndex = (Math.round(-angle / stepAngle) % photoRingItems.length + photoRingItems.length) % photoRingItems.length;
    selectPhoto(snappedIndex);
  }

  ringElement.addEventListener('pointerup', (event) => finishDrag(event));
  ringElement.addEventListener('pointercancel', (event) => finishDrag(event, true));
}

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileMenu = document.querySelector<HTMLElement>('.mobile-menu');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
  mobileMenu?.classList.remove('is-open');
  mobileMenu?.setAttribute('inert', '');
}
menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  mobileMenu?.classList.toggle('is-open', !isOpen);
  if (isOpen) mobileMenu?.setAttribute('inert', '');
  else mobileMenu?.removeAttribute('inert');
});
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

const countdown = document.querySelector<HTMLElement>('.countdown');
const dateString = countdown?.dataset.date;
const countdownLabel = document.querySelector<HTMLElement>('.countdown-label');
if (dateString && !Number.isNaN(Date.parse(dateString))) {
  const tick = () => {
    const remaining = Math.max(0, Date.parse(dateString) - Date.now());
    const values = {
      days: Math.floor(remaining / 86_400_000),
      hours: Math.floor((remaining / 3_600_000) % 24),
      minutes: Math.floor((remaining / 60_000) % 60),
      seconds: Math.floor((remaining / 1_000) % 60),
    };
    Object.entries(values).forEach(([unit, value]) => {
      const output = document.querySelector<HTMLElement>(`[data-${unit}]`);
      if (output) output.textContent = String(value).padStart(2, '0');
    });
    if (remaining === 0 && countdownLabel) countdownLabel.textContent = 'HOY ES EL GRAN DÍA';
  };
  tick();
  window.setInterval(tick, 1000);
} else if (countdownLabel) {
  countdownLabel.textContent = 'PRONTO COMPARTIREMOS LA FECHA';
}

function formatCalendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

document.querySelector<HTMLButtonElement>('[data-calendar]')?.addEventListener('click', (event) => {
  const date = dateString;
  const button = event.currentTarget as HTMLButtonElement;
  if (!date || Number.isNaN(Date.parse(date))) {
    const label = document.querySelector<HTMLElement>('.countdown-foot');
    if (label) label.textContent = 'La fecha estará disponible muy pronto.';
    else button.textContent = 'La fecha estará disponible muy pronto';
    return;
  }
  const start = formatCalendarDate(date);
  const endDate = new Date(Date.parse(date) + 4 * 60 * 60 * 1000);
  const end = formatCalendarDate(endDate.toISOString());
  const names = document.querySelector<HTMLElement>('.brand-name')?.textContent?.trim() || 'Nuestra boda';
  const eventText = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nuestra boda//ES', 'BEGIN:VEVENT',
    `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${names.replaceAll(',', '\\,')}`,
    'DESCRIPTION:Una celebración para compartir juntos.', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([eventText], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nuestra-boda.ics';
  link.click();
  URL.revokeObjectURL(url);
});

const rsvpForm = document.querySelector<HTMLFormElement>('#rsvp-form');
rsvpForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = rsvpForm.querySelector<HTMLElement>('.form-feedback');
  const name = (rsvpForm.elements.namedItem('name') as HTMLInputElement).value.trim();
  const attendance = (rsvpForm.elements.namedItem('attendance') as HTMLSelectElement).value;
  const note = (rsvpForm.elements.namedItem('note') as HTMLTextAreaElement).value.trim();
  const honeypot = rsvpForm.elements.namedItem('_gotcha') as HTMLInputElement | null;
  const nameError = rsvpForm.querySelector<HTMLElement>('[data-error="name"]');
  if (nameError) nameError.textContent = name ? '' : 'Escribe tu nombre para continuar.';
  if (!feedback) return;
  if (honeypot?.value.trim()) {
    feedback.textContent = 'No se pudo procesar la respuesta.';
    return;
  }
  if (!name || !attendance) {
    feedback.textContent = !name ? 'Revisa tu nombre y vuelve a intentarlo.' : 'Elige si podrás acompañarnos.';
    if (!name) (rsvpForm.elements.namedItem('name') as HTMLInputElement).focus();
    else (rsvpForm.elements.namedItem('attendance') as HTMLSelectElement).focus();
    return;
  }

  const endpoint = rsvpForm.dataset.endpoint?.trim();
  if (endpoint) {
    const submitButton = rsvpForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    let destination: URL;
    try {
      destination = new URL(endpoint);
    } catch {
      feedback.textContent = 'El endpoint de confirmación no es válido. Revisa src/config.ts.';
      return;
    }
    if (destination.protocol !== 'https:') {
      feedback.textContent = 'El endpoint de confirmación debe usar HTTPS.';
      return;
    }

    const couple = rsvpForm.dataset.couple || 'Nuestra boda';
    const formData = new FormData(rsvpForm);
    formData.set('_subject', `RSVP para ${couple}`);
    formData.set('Pareja', couple);
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }
    feedback.textContent = 'Enviando tu respuesta…';
    try {
      const response = await fetch(destination, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!response.ok) throw new Error(`RSVP endpoint responded ${response.status}`);
      feedback.textContent = 'Gracias. Recibimos tu respuesta.';
      rsvpForm.reset();
    } catch (error) {
      console.error('No se pudo enviar el RSVP.', error);
      feedback.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
    return;
  }

  const email = rsvpForm.dataset.email?.trim();
  if (!email) {
    feedback.textContent = 'Añade rsvpEndpoint o rsvpEmail en src/config.ts para recibir confirmaciones.';
    return;
  }
  const couple = rsvpForm.dataset.couple || 'Nuestra boda';
  const subject = encodeURIComponent(`RSVP para ${couple}: ${name}`);
  const body = encodeURIComponent(`Nombre: ${name}\nRespuesta: ${attendance}\nAlergias o mensaje: ${note || 'Ninguno'}`);
  feedback.textContent = 'Se abrirá tu correo para que puedas enviar la confirmación.';
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
});
