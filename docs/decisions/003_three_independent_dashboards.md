# ADR 003 — Tres dashboards completamente independientes

**Fecha:** 2026-04-08  
**Estado:** Aceptado

## Contexto

El sistema tiene tres roles (owner, admin, trainer) con responsabilidades muy distintas. La versión anterior del proyecto usaba un "panel selector" para que el mismo usuario cambiara de vista.

## Decisión

Los tres dashboards son **rutas independientes** bajo `/[slug]/owner`, `/[slug]/admin` y `/[slug]/trainer`. No comparten layouts, contextos de sesión, ni navegación entre ellos.

Un usuario con rol `trainer` que intente acceder a `/[slug]/admin` es redirigido por el middleware.

## Consecuencias

- Cada dashboard tiene su propio layout, sidebar y guards de autenticación.
- No es posible "cambiar de rol" sin cerrar sesión y entrar con otra cuenta.
- El código de cada dashboard puede evolucionar independientemente sin afectar los otros.
- Elimina el `PanelSwitcher` de la versión anterior del proyecto.
