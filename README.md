# Invitación de boda

Landing page para una boda, hecha con Astro y Three.js. Incluye un jardín 3D que recorre la historia al desplazarse, galería, detalles del evento, cuenta regresiva, preguntas frecuentes y confirmación de asistencia por correo.

## Empezar

```sh
npm install
npm run dev
```

Para compilar la versión estática:

```sh
npm run build
npm run preview
```

## Personalizar antes de publicar

Edita `src/config.ts`:

- `names`: nombres de la pareja.
- `dateLabel`: fecha visible en la invitación.
- `dateISO`: fecha y hora para la cuenta regresiva y el calendario, por ejemplo `2027-06-14T16:00:00-06:00`.
- `venue` y `address`: lugar y dirección. El enlace del mapa usa estos datos.
- `rsvpEmail`: correo que recibirá las confirmaciones. Si queda vacío, el formulario explica cómo configurarlo.
- `photos`: imágenes de referencia; se pueden sustituir por fotografías propias.

Los valores iniciales de nombres, fecha, lugar y correo son marcadores de posición. El formulario abre el programa de correo de cada invitado; no almacena ni envía información a un servidor.

Las fotografías de referencia vienen de [Unsplash](https://unsplash.com/license) y la galería 3D está guardada en `public/images/wedding-gallery/`. Para publicar, conviene reemplazarlas por fotografías de la pareja.

## Diseño

La dirección visual sigue un enfoque editorial cálido: tonos marfil, verde jardín y terracota, una sola familia tipográfica y movimiento suave. Un fondo pastel rosa y blanco hueso permanece detrás de las secciones y se mueve lentamente con capas CSS transformadas, sin un bucle de animación JavaScript. La galería toma como referencia el carrusel CSS en perspectiva de `Monkeyxcx/Personal`, con retícula y tipografía superpuesta, adaptado a imágenes de boda. El mundo floral de Three.js usa geometría generada en el navegador, no clips pre-renderizados ni servicios de generación de pago. Su cámara adapta el encuadre a la relación de aspecto; en pantallas pequeñas se limita la densidad de píxeles, el número de partículas y la frecuencia de dibujo. El movimiento tiene en cuenta la preferencia de movimiento reducido del dispositivo.

La interfaz contempla móviles estrechos, tabletas, pantallas anchas y orientación horizontal; las fotografías se encuadran con relaciones de aspecto específicas para cada disposición.

## Publicación

Astro genera una web estática en `dist/`. Antes del despliegue, actualiza el dominio en `astro.config.mjs` para que los metadatos y enlaces sociales correspondan al sitio final.
