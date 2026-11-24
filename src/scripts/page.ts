const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll<HTMLElement>('.reveal').forEach((item) => revealObserver.observe(item));

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
rsvpForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const feedback = rsvpForm.querySelector<HTMLElement>('.form-feedback');
  const name = (rsvpForm.elements.namedItem('name') as HTMLInputElement).value.trim();
  const attendance = (rsvpForm.elements.namedItem('attendance') as HTMLSelectElement).value;
  const note = (rsvpForm.elements.namedItem('note') as HTMLTextAreaElement).value.trim();
  const nameError = rsvpForm.querySelector<HTMLElement>('[data-error="name"]');
  if (nameError) nameError.textContent = name ? '' : 'Escribe tu nombre para continuar.';
  if (!feedback) return;
  if (!name || !attendance) {
    feedback.textContent = !name ? 'Revisa tu nombre y vuelve a intentarlo.' : 'Elige si podrás acompañarnos.';
    if (!name) (rsvpForm.elements.namedItem('name') as HTMLInputElement).focus();
    return;
  }
  const email = rsvpForm.dataset.email?.trim();
  if (!email) {
    feedback.textContent = 'La invitación está lista para personalizarse. Añade el correo de confirmación en src/config.ts.';
    return;
  }
  const couple = rsvpForm.dataset.couple || 'Nuestra boda';
  const subject = encodeURIComponent(`RSVP para ${couple}: ${name}`);
  const body = encodeURIComponent(`Nombre: ${name}\nRespuesta: ${attendance}\nAlergias o mensaje: ${note || 'Ninguno'}`);
  feedback.textContent = 'Se abrirá tu correo para que puedas enviar la confirmación.';
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
});
