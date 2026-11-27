// Personaliza estos datos antes de publicar la invitación.
export const wedding = {
  names: 'NOMBRE & NOMBRE',
  dateLabel: 'FECHA POR CONFIRMAR',
  dateISO: '', // Formato: 2027-06-14T16:00:00-06:00
  venue: 'LUGAR POR CONFIRMAR',
  address: '',
  rsvpEmail: '',
  rsvpEndpoint: '', // Endpoint HTTPS de Formspree; vacío = formulario sin envío externo.
  rsvpDeadline: 'Confirma antes de la fecha indicada en tu invitación',
  instagram: '',
};

export const photos = {
  hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
  story: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1100&q=85',
  dinner: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1100&q=85',
  gallery: Array.from({ length: 10 }, (_, index) => `/images/wedding-gallery/${String(index + 1).padStart(2, '0')}.jpg`),
};
