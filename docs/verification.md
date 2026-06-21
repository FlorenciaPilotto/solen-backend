# Verificación — Solen Mobile

## Cómo demostrar que un cambio funciona

1. **TypeScript limpio**: `cd solen-mobile && npx tsc --noEmit` sin errores.
2. **Sin regresiones visuales**: describir qué pantalla se ve afectada y cómo debería verse.
3. **Flujo completo**: si el cambio toca navegación, describir el flujo de pantallas afectadas.

## Comando de verificación rápida

```bash
./init.sh
```

Sale 0 si todo está bien, 1 si hay errores.

## Qué NO cuenta como verificación

- "Parece que está bien" sin haber ejecutado `./init.sh`.
- TypeScript con errores suprimidos con `// @ts-ignore`.
- Cambios que funcionan en un archivo pero rompen los tipos en otro.
