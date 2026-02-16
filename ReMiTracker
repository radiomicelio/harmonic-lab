Perfecto: si lo aparcamos y pensamos “**FamiTracker moderno dentro de la web**”, lo que estás describiendo es una evolución muy natural de tu harmonic-lab:

**de “explorar una onda” → a “componer con ondas”** (y seguir viéndolas + midiéndolas).

### Cómo lo plantearía sin reventar el proyecto

Mantén tu web como “Lab”, pero añade un modo nuevo:

## Modo nuevo: Tracker

Un tracker minimalista tipo FamiTracker, pero diseñado para divulgación y para tu estética.

**Concepto clave:** no necesitas empezar con 8 canales ni mil cosas. Con que haya:

* **Patrones** (pattern)
* **Step grid** (filas 00–3F)
* **Canales** (2 pulse + 1 wave + 1 noise)
* **Instrumentos** (duty/envelope/vibrato/bitcrush)
  …ya estás componiendo.

### MVP (lo mínimo que ya se siente “tracker”)

1. **Transport**: Play/Stop, BPM, Swing opcional
2. **Pattern**: una tabla 64 pasos, columnas por canal
3. **Editor de notas**: click + teclado (Z/S/X/D… estilo tracker o piano roll mini)
4. **Instrument list**: Instrumento 01…0F con parámetros (duty, attack/decay, vibrato)
5. **Song**: lista de patrones (orden de reproducción)

Y lo brutal: cada canal, al sonar, sigue pasando por tu **analizador/visual** (y luego metes “osciloscopio” cuando toque).

### Lo que lo hace “moderno” (sin complicar)

* **Copiar/pegar** en bloques (4, 8, 16 steps)
* **Random/humanize** controlado (detune cents, microtiming ligero)
* **Arpeggiator** tipo 0xy (clásico tracker) pero con UI friendly
* **Export**: JSON (tu formato), y opcionalmente **MIDI** para llevártelo a Logic/DAW

### Arquitectura sugerida (para que Claude no lo rompa)

Sin meter frameworks, pero sí modularizar:

* `engine/` (audio + scheduler)
* `tracker/` (state + pattern + playback)
* `ui/` (render tabla + input)
* `lab/` (tu parte actual: fórmula/armónicos/controles)

Si no quieres carpetas aún, al menos separarlo dentro de `app.js` con secciones claras y un `state` único.

### Orden de implementación que da hits rápidos

1. **Scheduler serio** (auto estable)
2. **Pattern grid** (solo mostrar y editar notas)
3. **Playback de pattern** (un canal)
4. Añadir canales 2/3/4
5. Instrumentos (por canal)
6. Song chain + export/import JSON

---

## Prompt corto para Claude: “Tracker MVP sin cargarse el Lab”

Si quieres, este sería el siguiente paso real:

```text
Quiero añadir un “Modo Tracker” sin eliminar el modo actual.
No uses librerías ni frameworks.

Objetivo MVP:
- Un botón para cambiar entre “Lab” y “Tracker”.
- En “Tracker”: una tabla de 32 pasos (de momento) con 2 canales (Pulse1 y Pulse2).
- Cada celda puede estar vacía o contener una nota (ej: C-4, D#4).
- Click en una celda: cicla OFF -> C-4 -> D-4 -> E-4 (placeholder) para probar.
- Botón Play/Stop que reproduce el patrón en loop a BPM fijo (120).
- Usa el motor de audio existente (duty/envelope) y scheduling estable con AudioContext.

Devuelve SOLO index.html, style.css y app.js completos, manteniendo todo lo existente del modo Lab.
```

---

Si me dices **qué te tira más** para el tracker (elige una y tiramos):

* **A)** “FamiTracker puro”: columnas con efectos (0xy arpegio, slide, vibrato, volume)
* **B)** “Tracker divulgativo”: menos efectos, pero con “ver armónicos / espectro” al lado, súper didáctico
* **C)** “Compositor Pokémon”: presets de instrumentos + patterns rápidos + export MIDI

Yo apostaría por **B** para que sea único y no solo “otro tracker”.
