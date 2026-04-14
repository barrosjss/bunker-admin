# ADR 004 — Mobile First

**Estado:** Aceptado  
**Fecha:** 2026-04-14

## Contexto

Los usuarios del panel (admins, trainers) acceden principalmente desde el teléfono. El formulario público de registro también es mayoritariamente móvil.

## Decisión

Todo el desarrollo de la plataforma debe ser **mobile-first**:

- Layouts y componentes se diseñan primero para pantallas pequeñas, luego se amplían con breakpoints `sm:` y `lg:`.
- El panel admin `/[slug]/admin` siempre incluye una barra de navegación inferior en móvil (`AdminSlugMobileNav`), oculta en desktop donde se usa el sidebar lateral.
- Los targets táctiles mínimos son 44px (`min-h-touch`).
- Las tablas muestran columnas esenciales en mobile y amplían con `sm:table-cell` en desktop.
- Los modales son full-width en mobile, con `max-w-*` en desktop.

## Consecuencias

- Mayor accesibilidad y usabilidad en el dispositivo principal del equipo.
- El contenido principal en mobile debe considerar el padding inferior para la nav bar (`pb-20 lg:pb-0`).
