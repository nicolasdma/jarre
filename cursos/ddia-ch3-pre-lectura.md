# DDIA Capítulo 3: Storage and Retrieval
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-05
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el capítulo en inglés.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: El Problema Fundamental

Una base de datos hace dos cosas:
1. **Guardar datos** (write)
2. **Encontrar datos** (read)

Los datos viven en **disco**, que es ~100,000x más lento que la RAM.

> **Todo el capítulo 3 se trata de: ¿cómo organizamos los datos en disco para que guardar y buscar sea lo más rápido posible?**

**Analogía:**
- **RAM** = tu escritorio. Todo lo que tienes ahí lo agarras instantáneamente.
- **Disco** = un almacén a 5 cuadras. Cada vez que necesitas algo, tienes que ir, buscarlo, y volver.

El recurso más caro en bases de datos es el **I/O de disco** (Input/Output). Casi todo se diseña para **minimizar cuántas veces tocas el disco**.

---

## Concepto 2: Índices

Para no leer todo el archivo al buscar, las bases de datos usan **índices**.

**Analogía:** El índice de un libro. En vez de leer 500 páginas, vas al índice, buscas "Kafka → página 234", y vas directo.

Un índice es una **estructura adicional** que te dice **dónde** está un dato en el disco.

### El Trade-off Central del Capítulo

> **Los índices hacen las lecturas más rápidas, pero hacen las escrituras más lentas.**

Costos de un índice:
1. **Espacio:** Cada índice ocupa espacio adicional en disco
2. **Escrituras más lentas:** Cada INSERT ahora también actualiza todos los índices

**Regla:**
- App que lee mucho, escribe poco (ej: Wikipedia) → muchos índices
- App que escribe muchísimo (ej: logs) → pocos índices

---

## Concepto 3: Las Dos Familias de Motores de Almacenamiento

| | **LSM-Trees** | **B-Trees** |
|---|---|---|
| Optimizado para | **Escrituras** | **Lecturas** |
| Usado por | Cassandra, RocksDB, LevelDB | PostgreSQL, MySQL, SQLite |
| Idea central | Escribir secuencialmente, organizar después | Mantener datos ordenados siempre |

- **LSM-Tree** = "primero escribo rápido, después organizo"
- **B-Tree** = "mantengo todo organizado siempre, así buscar es rápido"

---

## Concepto 4: B-Tree en Detalle

Un árbol donde arriba hay una raíz y abajo las hojas:

```
            [50]              ← raíz
           /    \
      [20, 35]   [65, 80]    ← nodos intermedios
      /  |  \     /  |  \
    [..] [..] [..] [..] [..] ← hojas (aquí están los datos)
```

### Búsqueda (rápida)

Buscar ID = 42:
1. Raíz: ¿42 < 50? → Sí → izquierda
2. Nodo [20, 35]: ¿42 > 35? → Sí → tercer hijo
3. Hoja → dato encontrado

**Solo 3 lecturas de disco** en vez de recorrer millones de registros.

Un B-Tree con millones de registros típicamente tiene solo **3-4 niveles** de profundidad.

### Escritura SIN split (caso feliz)

La hoja tiene espacio libre:

```
ANTES:                              DESPUÉS:

        [50]                              [50]
       /    \                            /    \
  [20,35]   [65,80]                [20,35]   [65,80]
   /  |  \                          /  |  \
 [..] [..] [36,38,__]            [..] [..] [36,37,38]
                 ↑ hay espacio                ↑ entró fácil
```

3 lecturas para bajar + 1 escritura en la hoja. Rápido.

### Escritura CON split (caso costoso)

La hoja está **llena** y no cabe el nuevo dato:

```
ANTES:
        [50]
       /    \
  [20,40]   [65,80]
   /  |  \
 [..] [..] [33,35,36,38]  ← ¡LLENA! No cabe 37
```

**Paso 1:** La hoja se parte en dos (SPLIT):
```
[33,35,36,38] + nuevo 37  →  [33,35,36] y [37,38]
```

**Paso 2:** El nodo padre se actualiza para apuntar a las dos hojas nuevas:
```
DESPUÉS:
           [50]
          /    \
  [20,36,40]   [65,80]       ← el padre cambió
   /  |  |  \
 [..][..][33,35,36] [37,38]  ← ahora son 2 hojas
```

Resultado: 3 lecturas + **3 escrituras** (hoja vieja, hoja nueva, padre). Múltiples posiciones del disco.

> **B-Tree: lectura rápida (3-4 saltos), escritura costosa (posibles splits + escrituras en múltiples lugares)**

---

## Concepto 5: LSM-Tree en Detalle

Estrategia: no organizar nada al momento de escribir.

### Escritura (rápida)

1. Dato nuevo → se guarda en **memoria RAM** en una estructura ordenada llamada **memtable**
2. Cuando la memtable se llena → se escribe completa al disco como un archivo ordenado (**SSTable**)
3. Con el tiempo se acumulan SSTables → se **fusionan** en segundo plano (compactación)

```
Llegan datos 37, 42, 15, 88:

  RAM: [15, 37, 42, 88]   ← rápido, es memoria

Se llena → se escribe al disco de un golpe:

  Disco: [SSTable-1: 15, 37, 42, 88]

Llegan más datos 5, 22, 60, 91:

  Disco: [SSTable-1: 15, 37, 42, 88]
         [SSTable-2: 5, 22, 60, 91]
```

No hay splits. No hay reorganización. Solo "apilar" archivos.

### Lectura (más lenta)

```
Buscar el dato 22:

  1. ¿Está en la memtable (RAM)?     → No
  2. ¿Está en SSTable-3 (más nuevo)?  → No
  3. ¿Está en SSTable-2?              → ¡Sí!

  Pero si no estuviera → hay que revisar TODOS los SSTables
```

Si tienes 100 SSTables, podrías necesitar revisar todos. Por eso LSM-Trees usan **Bloom filters** para evitar búsquedas innecesarias (se cubre en el capítulo).

---

## Concepto 6: WAL (Write-Ahead Log)

Problema: estás escribiendo en el B-Tree, se va la luz a medio split. Datos corruptos.

Solución: **WAL** — antes de hacer cualquier operación, escribir "voy a hacer X" en un log.

```
1. ANTES de tocar el B-Tree → escribir en el log qué vas a hacer
2. Hacer la operación real en el B-Tree
3. Si se cae el sistema → al reiniciar, leer el log y reparar
```

**Analogía:** Un piloto que antes de cada acción dice en voz alta lo que va a hacer y lo graba en la caja negra.

"Write-**Ahead**" = escribir **antes** de hacer la operación real.

**Nota:** El WAL es append-only (se agrega al final), pero NO es un LSM-Tree. El WAL es solo para recuperación ante crashes, no se busca en él.

PostgreSQL (Supabase) usa WAL. Por eso es tan confiable.

---

## Concepto 7: Column-Oriented Storage (Almacenamiento por Columnas)

Dos tipos de operaciones:
- "Dame el pedido #12345" → necesito **una fila** completa
- "¿Cuánto vendimos en enero?" → necesito **una columna** de millones de filas

### Row-Oriented (por filas)

```
Fila 1: | id:1 | nombre:"Juan"  | monto:500  | fecha:ene |
Fila 2: | id:2 | nombre:"María" | monto:300  | fecha:feb |
Fila 3: | id:3 | nombre:"Pedro" | monto:700  | fecha:ene |
```

Para sumar montos de enero → hay que leer TODA cada fila.

### Column-Oriented (por columnas)

```
Columna id:     [1, 2, 3]
Columna nombre: ["Juan", "María", "Pedro"]
Columna monto:  [500, 300, 700]        ← solo leo esta
Columna fecha:  ["ene", "feb", "ene"]  ← y esta
```

Solo lees las columnas que necesitas. Mucho más eficiente para analytics.

### OLTP vs OLAP

```
OLTP (filas)                    OLAP (columnas)
─────────────                   ──────────────
"Dame ESE pedido"               "Dame TODOS los totales"
1 fila, todas las columnas      Millones de filas, 2-3 columnas
PostgreSQL, MySQL               BigQuery, Redshift, ClickHouse
Tu app Jarre usa esto           Un equipo de analytics usaría esto
```

> **Regla:** `WHERE id = X` → row store. `SUM()`, `AVG()`, `GROUP BY` sobre millones → column store.

### Empresas Grandes Usan Ambos

```
┌─────────────────┐         ┌──────────────────────┐
│   PostgreSQL     │         │   BigQuery/Redshift   │
│   (row-oriented) │   ETL   │   (column-oriented)   │
│                  │  ────►  │                       │
│ "Mostrar pedido" │         │ "Ventas por región"   │
│ "Perfil usuario" │         │ "Tendencias mensual"  │
│                  │         │                       │
│ La app del user  │         │ Dashboards internos   │
└─────────────────┘         └──────────────────────┘
```

**ETL** (Extract, Transform, Load): proceso que copia datos de la base transaccional a la analítica. Generalmente corre cada hora o cada noche.

No existe UNA base de datos que haga todo perfecto. Por eso existen distintos motores.

---

## Resumen Visual

```
                    Storage & Retrieval
                          │
              ┌───────────┼───────────┐
              │           │           │
          Índices     Motores     Columnas
              │           │           │
         Trade-off:   ┌───┴───┐    OLTP vs OLAP
         lectura vs   │       │
         escritura  B-Tree  LSM-Tree
                      │       │
                   Siempre  Escribe rápido,
                   ordenado  organiza después
                      │       │
                    Splits  Memtable → SSTable
                      │       │
                     WAL   Compactación
```

---

## Términos Clave para el Capítulo (Inglés → Español)

| Inglés | Español | Qué es |
|--------|---------|--------|
| Storage engine | Motor de almacenamiento | Cómo la DB guarda datos en disco |
| Index | Índice | Estructura que acelera búsquedas |
| B-tree | B-tree | Árbol balanceado, optimizado para lecturas |
| LSM-tree | LSM-tree | Log-Structured Merge Tree, optimizado para escrituras |
| SSTable | SSTable | Sorted String Table, archivo ordenado en disco |
| Memtable | Memtable | Tabla en memoria RAM (parte del LSM) |
| Compaction | Compactación | Fusionar SSTables para reducir cantidad |
| Write-ahead log (WAL) | Log de escritura anticipada | Log de seguridad ante crashes |
| Bloom filter | Filtro Bloom | Estructura probabilística para evitar lecturas innecesarias |
| OLTP | OLTP | Online Transaction Processing (operaciones del día a día) |
| OLAP | OLAP | Online Analytical Processing (analytics, reportes) |
| Column-oriented | Por columnas | Almacenamiento optimizado para analytics |
| Row-oriented | Por filas | Almacenamiento optimizado para transacciones |
| Data warehouse | Almacén de datos | Base analítica separada de la transaccional |
| ETL | ETL | Extract, Transform, Load — mover datos de OLTP a OLAP |

---

## Preguntas de Comprensión (Auto-evaluación)

1. ¿Por qué el I/O de disco es el cuello de botella principal en bases de datos?
2. ¿Cuál es el trade-off de agregar índices?
3. ¿Cuántos niveles tiene típicamente un B-Tree con millones de registros?
4. ¿Qué es un "split" en B-Tree y cuándo ocurre?
5. ¿Por qué LSM-Tree es más rápido para escrituras?
6. ¿Cuál es la debilidad de LSM-Tree al leer?
7. ¿Para qué sirve el WAL?
8. ¿Cuándo usarías almacenamiento por columnas vs por filas?
9. ¿Qué es ETL y por qué las empresas grandes lo necesitan?
