# Fase 1 — Panorámica Continental · Brief de contenido

**Para el ejecutor:** este archivo es la fuente de verdad del contenido curado de la Fase 1 del track `travel`. Cuando el usuario te dé luz verde, convertilo en migration SQL de seed (análoga a las migrations de IA tipo `20260217060000_phase_0_math_foundations.sql`). Todo en español. Respetar las convenciones del proyecto: `curriculum_source='core'`, `created_by=NULL`, `track='travel'`, `phase='1'`.

**Para el coordinator (yo mismo, futuro):** esto son los 8 conceptos con 8 recursos. Cada URL fue verificada en los search results del 2026-04-21. Algunos quedan marcados `[revisar]` — ver nota al final.

---

## Objetivo de la fase

Instalar el macro continental antes del zoom regional. Al terminar, el usuario debería poder responder sin dudar: por qué Córdoba y Buenos Aires existen por Potosí, por qué la entrada a Colombia colonial es por Cartagena y el Magdalena, por qué Lima está en la costa pero Bogotá y Quito en la altura, y por qué 3 siglos después los países terminaron siendo económicamente y étnicamente tan distintos entre sí.

---

## Conceptos (8)

### C1. Geografía física sudamericana
- **ID sugerido:** `travel-f1-geografia-fisica`
- **Slug:** `geografia-fisica-sudamericana`
- **Definición canónica:** La placa de Nazca subducida bajo la sudamericana explica la cordillera andina, que a su vez estructura cuencas (Amazonas, Orinoco, Paraná-Plata), biomas (selva, puna, pampa, estepa, bosque austral) y régimen climático del continente. Entender esta geometría física es prerrequisito para leer toda decisión colonial y pre-colombina posterior.
- **Prerrequisitos:** ninguno (concepto fundacional de la fase)

### C2. Pueblos pre-colombinos mayores
- **ID sugerido:** `travel-f1-pueblos-precolombinos`
- **Slug:** `pueblos-precolombinos-sudamerica`
- **Definición canónica:** Distribución continental de los pueblos originarios antes de la conquista. Los grandes imperios (Tawantinsuyu, Muisca/Chibcha) en los Andes donde la altitud permitió agricultura intensiva y densidad poblacional; pueblos cazadores-recolectores y agricultores dispersos en Amazonía, pampa, Patagonia y Chaco. Mapuches y Selk'nam como casos extremos de resistencia al imperio inca y al colonialismo europeo respectivamente.
- **Prerrequisitos:** ninguno (puede estudiarse en paralelo con C1)

### C3. Los tres virreinatos
- **ID sugerido:** `travel-f1-virreinatos`
- **Slug:** `tres-virreinatos-america-hispana`
- **Definición canónica:** Organización administrativa española en Sudamérica: (a) Virreinato del Perú (1542) con eje Potosí–Lima–Pacífico–Panamá; (b) Virreinato de Nueva Granada (1717) con eje Cartagena–Magdalena–Bogotá; (c) Virreinato del Río de la Plata (1776) con eje Potosí–Córdoba–Buenos Aires, desgajado del Perú por las reformas borbónicas. La fragmentación del Perú en 3 virreinatos refleja el declive del monopolio de Potosí y el crecimiento del comercio atlántico.
- **Prerrequisitos:** C1, C2

### C4. Potosí: el motor económico
- **ID sugerido:** `travel-f1-potosi`
- **Slug:** `potosi-motor-economia-colonial`
- **Definición canónica:** El Cerro Rico de Potosí fue la mayor fuente de plata de la historia humana y el motor económico del imperio español durante 3 siglos. Explica por qué Sevilla se enriquece, por qué China acepta plata americana (sistema monetario Ming), por qué hay esclavos africanos en Cartagena, por qué existe Córdoba como escala de la ruta comercial. La mita — trabajo forzado indígena reciclado del sistema inca — es la institución laboral que lo hace posible.
- **Prerrequisitos:** C3

### C5. Ejes fluviales y rutas coloniales
- **ID sugerido:** `travel-f1-rutas-coloniales`
- **Slug:** `rutas-coloniales-magdalena-plata`
- **Definición canónica:** En un continente sin carreteras, los ríos son la carretera. (a) Magdalena: única vía entre Cartagena/Santa Marta y Bogotá, espina dorsal de Nueva Granada. (b) Camino Real Potosí–Córdoba–Buenos Aires: ruta precolombina reutilizada que conecta el Alto Perú con el Atlántico, con las postas jesuíticas como nodos. (c) Amazonas: tardía para la colonización española, dominada por los portugueses. Cada capital del continente se explica por su relación con uno de estos ejes.
- **Prerrequisitos:** C1, C3

### C6. Por qué las capitales están donde están
- **ID sugerido:** `travel-f1-capitales-ubicacion`
- **Slug:** `ubicacion-capitales-sudamerica`
- **Definición canónica:** Capítulo de síntesis. Lima: Pizarro + el mar + Callao (conexión Europa). Bogotá: altura defensiva + acceso al Magdalena + asiento de Audiencia en 1550. Quito: altura + ruta inca preexistente. Sucre/La Paz: Potosí. Santiago: valle central protegido por Andes y desierto. Buenos Aires: "puerta trasera" de Potosí, contrabando → virreinato en 1776. Córdoba: escala en el Camino Real + universidad jesuita de 1613. Ninguna capital es accidental.
- **Prerrequisitos:** C3, C4, C5

### C7. Independencias: San Martín y Bolívar
- **ID sugerido:** `travel-f1-independencias`
- **Slug:** `independencias-san-martin-bolivar`
- **Definición canónica:** Dos movimientos convergentes. San Martín sube por el sur: Mendoza → Cruce de los Andes 1817 → Chile → Lima por mar 1820. Bolívar baja por el norte: Caracas → Bogotá (Boyacá 1819) → Quito (Pichincha 1822) → Perú. Se encuentran en Guayaquil julio 1822: discusión sobre forma de gobierno, San Martín se retira, Bolívar toma el mando. Cierre militar: Junín y Ayacucho 1824. La fragmentación posterior de la Gran Colombia (Venezuela, Colombia, Ecuador independizándose entre 1830-1831) y la separación de Bolivia del Perú muestran que la unidad era solo militar.
- **Prerrequisitos:** C3, C4

### C8. Divergencia poscolonial
- **ID sugerido:** `travel-f1-divergencia-poscolonial`
- **Slug:** `divergencia-poscolonial-sudamerica`
- **Definición canónica:** Síntesis de la fase. Después de 1825 los países sudamericanos siguen trayectorias divergentes explicables por su estructura colonial previa. Cono Sur (Argentina, Chile, Uruguay): inmigración europea masiva 1870–1930, modernización temprana, identidad "blanca" construida. Andes centrales (Perú, Bolivia, Ecuador): repúblicas con mayoría indígena campesina, oligarquías terratenientes extractivas, modernización tardía. Colombia: guerra bipartidista crónica Liberal/Conservador, narcotráfico y conflicto armado tardío. Chile: Pinochet como primer laboratorio neoliberal del mundo. Las geografías de Fase 1 (Potosí, Magdalena, Plata) predicen estos caminos.
- **Prerrequisitos:** C6, C7

---

## Recursos (8)

### R1. Video — Virreinatos de América: La Historia Completa
- **ID sugerido:** `travel-r-virreinatos-panorama`
- **Tipo:** `video`
- **Autor/Canal:** Pero eso es otra Historia
- **URL:** https://www.youtube.com/watch?v=NHPP1EF7eoI
- **Duración estimada:** ~1-1.5h (es el capítulo consolidado de la serie)
- **Idioma:** español
- **Enseña:** C3 virreinatos · **Refuerza:** C4 (menciona Potosí), C7 (cierre con independencias)
- **Notas:** Divulgación sólida, con fuentes a vista. Serie tiene capítulos individuales (ep.8 específico de Nueva Granada y Río de la Plata: https://www.youtube.com/watch?v=h0h78YM0Rrg) si el consolidado es muy largo para una sola pasada.

### R2. Video — Documental histórico sobre Potosí (01)
- **ID sugerido:** `travel-r-potosi-documental`
- **Tipo:** `video`
- **Autor/Canal:** Canal Encuentro (Argentina, producción estatal educativa)
- **URL:** https://www.youtube.com/watch?v=Dumvzm40-kk
- **Duración estimada:** ~25-30 min (formato Encuentro)
- **Idioma:** español
- **Enseña:** C4 Potosí · **Refuerza:** C3 (virreinato del Perú)
- **Notas:** Encuentro es el gold standard argentino de divulgación educativa. Alternativa si no funciona: "La montaña roja, Potosí" https://www.youtube.com/watch?v=lYFoGx7xzu4

### R3. Video — La Entrevista de Guayaquil
- **ID sugerido:** `travel-r-guayaquil`
- **Tipo:** `video`
- **Autor/Canal:** (canal a confirmar — hay dos candidatos)
- **URL primaria:** https://www.youtube.com/watch?v=tyPHu1xzwlk
- **URL alternativa:** https://www.youtube.com/watch?v=NhWx2QuDWlU
- **Duración estimada:** 15-30 min
- **Idioma:** español
- **Enseña:** C7 independencias · **Refuerza:** C3, C8 (explica por qué se fragmenta después)
- **Notas:** `[revisar]` Decidir cuál de los dos videos es más riguroso antes de seedear. Ver duración y ver si tiene fuentes.

### R4. Artículo — El río Magdalena: la espina dorsal de Colombia
- **ID sugerido:** `travel-r-magdalena-espina-dorsal`
- **Tipo:** `article` (o `book` si se mapea a un type existente; revisar enum de `resources.type`)
- **Autor:** Banco de la República de Colombia · Enciclopedia Banrepcultural
- **URL:** https://enciclopedia.banrepcultural.org/index.php?title=El_r%C3%ADo_Magdalena_en_el_siglo_XIX:_la_%E2%80%9Cespina_dorsal_de_Colombia%E2%80%9D
- **Idioma:** español
- **Enseña:** C5 (parte Magdalena) · **Refuerza:** C3 (Nueva Granada), C6 (Bogotá)
- **Notas:** Fuente académica colombiana seria. Puede complementarse con el artículo del Taller de la Historia (Universidad de Cartagena) sobre la boga y navegación del río: https://revistas.unicartagena.edu.co/index.php/eltallerdelahistoria/article/view/3765

### R5. Artículo — Camino Real a Potosí: camino de las mulas y comercio colonial
- **ID sugerido:** `travel-r-camino-real-potosi`
- **Tipo:** `article`
- **Autor:** historiaybiografias.com (revisar autoría académica) · alternativa: laamericaespanyola.com ("El Camino Real: De Lima a Buenos Aires")
- **URL primaria:** https://laamericaespanyola.com/2018/06/28/el-camino-real-de-lima-a-buenos-aires/
- **URL alternativa:** https://historiaybiografias.com/miselaneas27/
- **Idioma:** español
- **Enseña:** C5 (parte Camino Real) · **Refuerza:** C4 (Potosí), C6 (Córdoba, Buenos Aires)
- **Notas:** `[revisar]` Preferir fuente académica si existe. Si ninguna convence, reemplazar por paper Scielo sobre la ruta.

### R6. Libro (capítulos) — Historia Contemporánea de América Latina
- **ID sugerido:** `travel-r-halperin-donghi`
- **Tipo:** `book`
- **Autor:** Tulio Halperín Donghi
- **URL (open access, Internet Archive):** https://archive.org/details/halperin-donghi-tulio.-historia-contemporanea-de-america-latina-ocr-1998
- **Idioma:** español
- **Capítulos a leer:** Introducción + Cap 1 (La crisis de la independencia) + Cap 3 (La larga espera, 1825-1850). Total: ~90 páginas.
- **Enseña:** C8 divergencia · **Refuerza:** C3, C7
- **Notas:** EL libro académico canónico para entender el siglo XIX sudamericano. En archive.org está completo y buscable. Para integración al pipeline de Jarre que acepta PDFs, descargar PDF desde archive.org y extraer los capítulos relevantes como `resource_page_range`.

### R7. Artículo — ¿Cómo se formaron los Andes?
- **ID sugerido:** `travel-r-formacion-andes`
- **Tipo:** `article`
- **Autor:** Investigación y Ciencia (edición española de Scientific American)
- **URL:** https://www.investigacionyciencia.es/revistas/investigacion-y-ciencia/qu-ocultan-las-estrellas-de-neutrones-765/cmo-se-formaron-los-andes-17429
- **Idioma:** español
- **Enseña:** C1 geografía física
- **Notas:** Artículo de divulgación científica seria. Cubre subducción Nazca-Sudamericana y los "parones tectónicos" recientes. Complementar con el artículo de la Universidad de Concepción (Chile) si se quiere profundidad: https://noticias.udec.cl/secreto-bajo-el-mar-interaccion-entre-placas-tectonicas-hace-10-millones-de-anos-origino-cordillera-de-los-andes/

### R8. Video — Pueblos originarios (serie Canal Encuentro)
- **ID sugerido:** `travel-r-pueblos-originarios-encuentro`
- **Tipo:** `video`
- **Autor/Canal:** Canal Encuentro (Argentina)
- **URL primaria (Mapuches: Relatos de Yolanda):** https://www.youtube.com/watch?v=d93Lj6CEq-E
- **Idioma:** español
- **Enseña:** C2 pueblos precolombinos (parcial — cubre mapuche con profundidad)
- **Notas:** `[revisar]` Este recurso cubre bien mapuche pero no da el panorama continental que C2 necesita. **Opción A:** sumar un segundo video de Encuentro sobre pueblos andinos/amazónicos. **Opción B:** reemplazar por un video panorámico. Marcarlo como punto de discusión con el usuario antes de seedear.

---

## Mapeo concepto ↔ recurso (para `resource_concepts`)

| Recurso | Enseña (is_prerequisite=false) | Es prerrequisito de (is_prerequisite=true) |
|---------|-------------------------------|--------------------------------------------|
| R1 Virreinatos | C3 | — |
| R2 Potosí | C4 | — |
| R3 Guayaquil | C7 | — |
| R4 Magdalena | C5 (parcial) | — |
| R5 Camino Real | C5 (parcial) | — |
| R6 Halperín Donghi | C8 | — |
| R7 Formación Andes | C1 | — |
| R8 Pueblos Encuentro | C2 (parcial) | — |

Prerrequisitos de concepto a concepto ya expresados en cada card de concepto arriba; se traducen a filas de `concept_prerequisites`.

---

## Cosas a validar antes de seedear

1. **R3 y R5**: elegir URL definitiva entre los candidatos. Yo (coordinator) puedo hacer una segunda pasada antes del seed.
2. **R8 pueblos originarios**: está flojo como cobertura panorámica. Ver si sumamos R8b (otro video de Encuentro sobre Andes/Amazonía) o reemplazamos.
3. **R6 Halperín Donghi**: confirmar que el pipeline PDF acepta ingesta desde archive.org. Si no, descargar el PDF localmente y servirlo.
4. **Tipos de recurso**: el enum `resource_type` actual es `('paper', 'book', 'video', 'course', 'article')` según la migration inicial. Los 4 tipos que uso (video, article, book) están todos cubiertos.
5. **Integración con pipeline**: los videos YT pasan por el pipeline completo (resolve → segment → content → quizzes). Los articles/books entran como PDFs o como markdown pre-procesado según qué prefiera el usuario.

---

## Próximos pasos del coordinator

Mientras el ejecutor sigue con infra:
- [ ] Resolver los 3 puntos de `[revisar]` arriba (R3, R5, R8)
- [ ] Empezar a bocetar el brief de Fase 2 (Colombia Caribe y Darién)
- [ ] Cuando ejecutor reporte paso 7 done, actualizar `PROGRESS.md` y pasar este brief como input para la migration de seed
