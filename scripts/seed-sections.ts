/**
 * Jarre - Seed Resource Sections (DDIA Chapter 1 Proof of Concept)
 *
 * Inserts concept-level sections with translated content for the LEARN step.
 * This script can either:
 *   1. Read from a translated JSON file (output of translate-sections.py)
 *   2. Use hardcoded content for DDIA Ch1 (proof of concept)
 *
 * Run with: npx tsx scripts/seed-sections.ts [--from-file scripts/output/chapter-01-translated.json]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// TYPES
// ============================================================================

interface SeedSection {
  resource_id: string;
  concept_id: string;
  section_title: string;
  sort_order: number;
  content_markdown: string;
  content_original?: string;
  start_page?: number;
  end_page?: number;
  segmentation_confidence?: number;
}

// ============================================================================
// DDIA CHAPTER 1 — PROOF OF CONCEPT (hand-translated content)
// ============================================================================

const DDIA_CH1_SECTIONS: SeedSection[] = [
  {
    resource_id: 'ddia-ch1',
    concept_id: 'reliability',
    section_title: 'Fiabilidad',
    sort_order: 0,
    start_page: 6,
    end_page: 10,
    segmentation_confidence: 1.0,
    content_markdown: `## Fiabilidad

El sistema sigue funcionando correctamente incluso cuando las cosas salen mal.

Las cosas que pueden salir mal se llaman **fallos** (*faults*), y los sistemas que los anticipan y pueden manejarlos se llaman **tolerantes a fallos** (*fault-tolerant*). Un fallo no es lo mismo que un *failure*: un **fallo** es cuando un componente del sistema se desvía de su especificación, mientras que un **failure** es cuando el sistema en su totalidad deja de proporcionar el servicio requerido al usuario.

Es imposible reducir la probabilidad de fallos a cero. Por lo tanto, generalmente es mejor diseñar mecanismos de tolerancia a fallos que prevengan que los fallos causen failures.

### Fallos de Hardware

Los discos duros tienen un tiempo medio hasta fallo (MTTF) de 10 a 50 años. En un clúster de almacenamiento con 10,000 discos, en promedio deberías esperar que un disco muera por día.

La primera respuesta suele ser agregar **redundancia** a los componentes individuales: discos en configuración RAID, servidores con fuentes de alimentación duales, CPUs hot-swappable, y baterías y generadores diesel para los data centers.

Sin embargo, a medida que los volúmenes de datos y las demandas computacionales han aumentado, más aplicaciones usan grandes cantidades de máquinas, lo que incrementa proporcionalmente la tasa de fallos de hardware. Por eso hay un movimiento hacia sistemas que toleren la pérdida de máquinas completas, usando técnicas de tolerancia a fallos por software.

### Fallos de Software

Los errores sistemáticos dentro del sistema son más difíciles de anticipar. Estos bugs a menudo permanecen latentes durante mucho tiempo hasta que se activan por un conjunto inusual de circunstancias. Ejemplos incluyen:

- Un bug en el kernel de Linux que causaba que cada instancia de un servidor de aplicaciones se colgara simultáneamente el 30 de junio de 2012, debido a un bug en el manejo de *leap seconds*.
- Un proceso desbocado que consume algún recurso compartido: CPU, memoria, espacio en disco o ancho de banda de red.
- Un servicio del que depende el sistema se ralentiza, deja de responder, o empieza a devolver respuestas corruptas.
- Fallos en cascada, donde un fallo menor en un componente desencadena un fallo en otro componente, que a su vez desencadena más fallos.

No hay solución rápida para los fallos de software. Muchas cosas pequeñas ayudan: pensar cuidadosamente sobre las suposiciones e interacciones del sistema, testing exhaustivo, aislamiento de procesos, permitir que los procesos se reinicien, medir, monitorear y analizar el comportamiento del sistema en producción.

### Errores Humanos

Los humanos diseñan y construyen los sistemas de software, y los operadores que mantienen los sistemas funcionando también son humanos. Incluso cuando tienen las mejores intenciones, los humanos son notoriamente poco fiables. Un estudio de grandes servicios de internet encontró que los errores de configuración por parte de operadores eran la causa principal de interrupciones, mientras que los fallos de hardware (servidores o red) solo causaban del 10 al 25% de las interrupciones.

¿Cómo hacemos los sistemas fiables a pesar de humanos poco fiables?

- Diseñar sistemas que **minimicen las oportunidades de error**. APIs bien diseñadas, interfaces de administración, y abstracciones que faciliten "hacer lo correcto" y dificulten "hacer lo incorrecto".
- Proporcionar **entornos sandbox** donde la gente pueda explorar y experimentar de forma segura, usando datos reales, sin afectar usuarios reales.
- **Testear exhaustivamente**, desde pruebas unitarias hasta pruebas de integración completas y pruebas manuales.
- Permitir **recuperación rápida** de errores humanos. Hacer que sea fácil revertir cambios de configuración, implementar rollouts graduales, y proporcionar herramientas para recalcular datos.
- Establecer **monitoreo detallado**: métricas de rendimiento y tasas de error (telemetría).`,
  },
  {
    resource_id: 'ddia-ch1',
    concept_id: 'scalability',
    section_title: 'Escalabilidad',
    sort_order: 1,
    start_page: 10,
    end_page: 18,
    segmentation_confidence: 1.0,
    content_markdown: `## Escalabilidad

Incluso si un sistema funciona de manera fiable hoy, eso no significa que necesariamente funcionará de manera fiable en el futuro. Una razón común de degradación es el **aumento de carga**: quizás el sistema ha crecido de 10,000 usuarios concurrentes a 100,000, o de 1 millón a 10 millones. La escalabilidad es el término que usamos para describir la capacidad de un sistema de lidiar con el aumento de carga.

### Describiendo la Carga

Primero necesitamos describir la carga actual del sistema de forma sucinta; solo entonces podemos discutir preguntas de crecimiento. La carga se puede describir con algunos números que llamamos **parámetros de carga**. La mejor elección de parámetros depende de la arquitectura del sistema: puede ser solicitudes por segundo a un servidor web, la proporción de lecturas a escrituras en una base de datos, el número de usuarios activos simultáneamente en un chat, la tasa de aciertos en un caché, o algo más.

#### Ejemplo de Twitter

Twitter publicó algunos números en noviembre de 2012. Dos de las operaciones principales de Twitter son:

- **Publicar tweet:** Un usuario puede publicar un nuevo mensaje para sus seguidores (en promedio 4.6k solicitudes/seg, pico >12k solicitudes/seg).
- **Línea de tiempo (home timeline):** Un usuario puede ver tweets publicados por las personas a las que sigue (300k solicitudes/seg).

Manejar 12,000 escrituras por segundo es bastante fácil. Sin embargo, el desafío de Twitter no es principalmente debido al volumen de tweets, sino al **fan-out**: cada usuario sigue a muchas personas, y cada usuario es seguido por muchas personas.

Hay dos formas de implementar estas operaciones:

1. **Enfoque de consulta al leer:** Publicar un tweet simplemente lo inserta en una tabla global de tweets. Cuando un usuario solicita su timeline, busca todos los tweets de las personas a las que sigue, los mezcla y ordena por tiempo.
2. **Enfoque de fan-out al escribir:** Mantener un caché para la timeline de cada usuario. Cuando un usuario publica un tweet, busca a todos sus seguidores e inserta el nuevo tweet en el caché de timeline de cada uno.

Twitter migró del enfoque 1 al enfoque 2 porque la carga de lecturas era dos órdenes de magnitud mayor que las escrituras. Sin embargo, el enfoque 2 tiene una desventaja: publicar un tweet requiere mucho trabajo extra. En promedio un tweet se entrega a unos 75 seguidores, así que 4.6k tweets/seg se convierten en 345k escrituras/seg al caché de timelines. Pero algunos usuarios tienen más de 30 millones de seguidores — un solo tweet puede resultar en más de 30 millones de escrituras.

La solución final de Twitter es un **híbrido**: fan-out para la mayoría de usuarios, pero los tweets de celebridades se buscan por separado al momento de leer y se mezclan con la timeline pre-computada.

### Describiendo el Rendimiento

Una vez que has descrito la carga, puedes investigar qué pasa cuando la carga aumenta:

- Cuando incrementas un parámetro de carga y mantienes los recursos del sistema sin cambiar, ¿cómo se ve afectado el rendimiento?
- Cuando incrementas un parámetro de carga, ¿cuántos recursos necesitas incrementar para mantener el rendimiento sin cambios?

En un sistema de procesamiento por lotes como Hadoop, generalmente nos importa el **throughput** — el número de registros que podemos procesar por segundo. En sistemas online, lo más importante es el **tiempo de respuesta** — el tiempo entre que un cliente envía una solicitud y recibe la respuesta.

#### Latencia vs Tiempo de Respuesta

El **tiempo de respuesta** es lo que el cliente ve: incluye el tiempo de procesamiento real del servicio (el *service time*), más retrasos de red y de cola. La **latencia** es la duración que una solicitud espera siendo atendida — esperando servicio.

#### Percentiles

Es mejor pensar en los tiempos de respuesta no como un número único, sino como una **distribución de valores**. La mayoría de las solicitudes son razonablemente rápidas, pero hay *outliers* ocasionalmente lentos.

La **mediana** (p50) es un buen indicador: la mitad de las solicitudes son más rápidas y la mitad más lentas. Para saber qué tan malos son los outliers, usa percentiles altos: el **percentil 95 (p95)**, **percentil 99 (p99)** y **percentil 99.9 (p999)**.

Amazon describe los tiempos de respuesta en p99.9, aunque solo afecta a 1 de cada 1,000 solicitudes. Esto se debe a que los clientes con las solicitudes más lentas suelen ser los que tienen más datos — es decir, los clientes más valiosos.

Los percentiles altos de tiempo de respuesta (también conocidos como **latencias de cola** o *tail latencies*) son importantes porque afectan directamente la experiencia de los usuarios.

#### Acuerdos de Nivel de Servicio (SLAs)

Los SLAs y SLOs a menudo se definen en términos de percentiles. Por ejemplo: se espera que el servicio tenga un tiempo de respuesta mediano menor a 200ms y un p99 menor a 1s, y se requiere que el servicio esté activo al menos el 99.9% del tiempo.

#### Amplificación de Latencia de Cola

Cuando llamas a múltiples servicios backend en paralelo (como es común en sistemas con fan-out), basta con que **una** solicitud backend sea lenta para que toda la solicitud del usuario final se ralentice. Incluso si solo un pequeño porcentaje de llamadas backend son lentas, la probabilidad de que al menos una sea lenta aumenta con el número de llamadas. Esto se conoce como **amplificación de latencia de cola**.

### Enfoques para Lidiar con la Carga

- **Escalar verticalmente** (scaling up): pasar a una máquina más potente.
- **Escalar horizontalmente** (scaling out): distribuir la carga entre múltiples máquinas más pequeñas.

En la práctica, los buenos sistemas suelen combinar ambos enfoques. Algunos sistemas son **elásticos**: agregan recursos computacionales automáticamente cuando detectan un aumento de carga, mientras que otros se escalan manualmente.

Distribuir sistemas *stateless* es sencillo. Llevar datos *stateful* de un nodo a un sistema distribuido introduce complejidad adicional. Por eso la sabiduría convencional era mantener tu base de datos en un solo nodo (escalar verticalmente) hasta que el costo u otros requisitos te obligaran a hacer distribución.

No existe una arquitectura genérica que sirva para todo: la arquitectura correcta depende del volumen de lecturas, escrituras, datos a almacenar, complejidad de los datos, requisitos de tiempo de respuesta, y patrones de acceso.`,
  },
  {
    resource_id: 'ddia-ch1',
    concept_id: 'maintainability',
    section_title: 'Mantenibilidad',
    sort_order: 2,
    start_page: 18,
    end_page: 22,
    segmentation_confidence: 1.0,
    content_markdown: `## Mantenibilidad

La mayoría del costo del software no está en su desarrollo inicial, sino en su **mantenimiento continuo**: corregir bugs, mantener los sistemas operativos, investigar fallos, adaptarse a nuevas plataformas, modificar para nuevos casos de uso, pagar deuda técnica, y agregar nuevas funcionalidades.

Desafortunadamente, muchas personas en software no disfrutan el mantenimiento de sistemas *legacy*. Sin embargo, podemos y debemos diseñar el software de manera que minimice el dolor del mantenimiento y evite crear un sistema legacy nosotros mismos. Para este fin, prestaremos especial atención a tres principios de diseño:

### Operabilidad: Facilitando la Vida de Operaciones

Un buen equipo de operaciones es responsable de:

- Monitorear la salud del sistema y restaurar rápidamente el servicio si entra en mal estado.
- Rastrear la causa de problemas, como fallos del sistema o rendimiento degradado.
- Mantener el software y plataformas actualizados, incluyendo parches de seguridad.
- Vigilar cómo los diferentes sistemas se afectan entre sí, para evitar que un cambio problemático cause daño.
- Anticipar problemas futuros y resolverlos antes de que ocurran (por ejemplo, planificación de capacidad).
- Establecer buenas prácticas y herramientas para deployments, gestión de configuración, y más.
- Realizar tareas complejas de mantenimiento, como migrar una aplicación de una plataforma a otra.
- Mantener la seguridad del sistema a medida que se hacen cambios de configuración.
- Definir procesos que hagan las operaciones predecibles y ayuden a mantener el entorno de producción estable.
- Preservar el conocimiento institucional sobre el sistema, incluso cuando individuos van y vienen.

Los buenos sistemas de datos pueden facilitar las tareas de operaciones rutinarias, permitiendo que el equipo de operaciones se enfoque en actividades de alto valor. Esto incluye:

- Proporcionar **visibilidad** del comportamiento interno del sistema, con buena monitorización.
- Proporcionar buen soporte para **automatización** e integración con herramientas estándar.
- Evitar **dependencia de máquinas individuales** (permitiendo que las máquinas se retiren para mantenimiento mientras el sistema sigue funcionando).
- Proporcionar buena **documentación** y un modelo operativo fácil de entender.
- Proporcionar buen comportamiento **por defecto**, pero dar a los administradores la libertad de sobreescribir los defaults cuando sea necesario.
- **Auto-reparación** donde sea apropiado, pero también dando a los administradores control manual del estado del sistema.
- Exhibir comportamiento **predecible**, minimizando sorpresas.

### Simplicidad: Gestionando la Complejidad

A medida que los proyectos crecen, a menudo se vuelven muy complejos y difíciles de entender. Esta complejidad ralentiza a todos los que necesitan trabajar en el sistema, aumenta el costo de mantenimiento, y genera un mayor riesgo de introducir bugs al hacer cambios.

Los síntomas de complejidad incluyen: explosión del espacio de estados, acoplamiento fuerte entre módulos, dependencias enredadas, nomenclatura y terminología inconsistente, hacks para solucionar problemas de rendimiento, y lógica excepcional para manejar casos especiales.

La mejor herramienta para eliminar **complejidad accidental** es la **abstracción**. Una buena abstracción puede ocultar una gran cantidad de detalle de implementación detrás de una fachada limpia y fácil de entender. También puede usarse para una amplia gama de aplicaciones diferentes. No solo es mejor para reusar, sino que también lleva a software de mayor calidad, ya que los componentes de la abstracción se pueden mejorar una vez y benefician a todos los que la usan.

### Evolucionabilidad: Facilitando el Cambio

Los requisitos del sistema cambian constantemente: aprendes nuevos hechos, surgen casos de uso imprevistos, las prioridades del negocio cambian, los usuarios solicitan nuevas funcionalidades, nuevas plataformas reemplazan a las viejas, requisitos legales o regulatorios cambian, y el crecimiento del sistema fuerza cambios arquitectónicos.

En términos de procesos organizacionales, los frameworks Agile proporcionan un marco para adaptarse al cambio. La **evolucionabilidad** (*evolvability*) del sistema es la facilidad con la que puedes modificar un sistema de datos adaptándolo a requisitos cambiantes. Esto está estrechamente ligado a la simplicidad y las abstracciones del sistema: los sistemas simples y bien comprendidos suelen ser más fáciles de modificar que los complejos.`,
  },
];

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const fromDir = process.argv.find((a) => a.startsWith('--from-dir'));
  const fromFile = process.argv.find((a) => a.startsWith('--from-file'));
  let sections: SeedSection[];

  if (fromDir) {
    // Seed all *-translated.json files from a directory
    const dirPath = process.argv[process.argv.indexOf(fromDir) + 1] || 'scripts/output';
    const { readdirSync } = await import('fs');
    const files = readdirSync(dirPath)
      .filter((f: string) => f.endsWith('-translated.json'))
      .sort();

    if (files.length === 0) {
      console.error(`No *-translated.json files found in ${dirPath}`);
      process.exit(1);
    }

    console.log(`Found ${files.length} translated files in ${dirPath}:`);
    let allSections: SeedSection[] = [];
    const allConceptIds = new Set<string>();

    for (const file of files) {
      const filePath = `${dirPath}/${file}`;
      const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
      const mapped = raw.map((s: Record<string, unknown>, i: number) => ({
        resource_id: s.resource_id,
        concept_id: s.concept_id as string,
        section_title: s.section_title,
        sort_order: s.sort_order ?? i,
        content_markdown: s.content_markdown,
        content_original: s.content_original,
      }));
      for (const s of mapped) allConceptIds.add(s.concept_id);
      allSections = allSections.concat(mapped);
      console.log(`  ${file}: ${mapped.length} sections`);
    }

    // Validate concept_ids against DB
    const conceptIds = [...allConceptIds];
    const { data: validConcepts, error: conceptError } = await supabase
      .from('concepts')
      .select('id')
      .in('id', conceptIds);

    if (conceptError) {
      console.error('Error validating concept_ids:', conceptError.message);
      process.exit(1);
    }

    const validIds = new Set(validConcepts.map((c) => c.id));
    const invalidIds = conceptIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      console.warn(`Skipping sections with unknown concept_ids: ${invalidIds.join(', ')}`);
    }

    sections = allSections.filter((s) => validIds.has(s.concept_id));
  } else if (fromFile) {
    const filePath = process.argv[process.argv.indexOf(fromFile) + 1];
    if (!filePath || !existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Validate concept_ids exist in the database
    const conceptIds = [...new Set(raw.map((s: Record<string, unknown>) => s.concept_id as string))];
    const { data: validConcepts, error: conceptError } = await supabase
      .from('concepts')
      .select('id')
      .in('id', conceptIds);

    if (conceptError) {
      console.error('Error validating concept_ids:', conceptError.message);
      process.exit(1);
    }

    const validIds = new Set(validConcepts.map((c) => c.id));
    const invalidIds = conceptIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      console.warn(`Skipping sections with unknown concept_ids: ${invalidIds.join(', ')}`);
    }

    sections = raw
      .filter((s: Record<string, unknown>) => validIds.has(s.concept_id as string))
      .map((s: Record<string, unknown>, i: number) => ({
        resource_id: s.resource_id ?? 'ddia-ch1',
        concept_id: s.concept_id,
        section_title: s.section_title,
        sort_order: s.sort_order ?? i,
        content_markdown: s.content_markdown,
        content_original: s.content_original,
        segmentation_confidence: s.segmentation_confidence,
      }));
    console.log(`Loaded ${sections.length} sections from ${filePath}`);
  } else {
    sections = DDIA_CH1_SECTIONS;
    console.log(`Using hardcoded DDIA Ch1 sections (${sections.length} sections)`);
  }

  // Clear existing sections for this resource
  const resourceIds = [...new Set(sections.map((s) => s.resource_id))];
  for (const rid of resourceIds) {
    const { error: deleteError } = await supabase
      .from('resource_sections')
      .delete()
      .eq('resource_id', rid);

    if (deleteError) {
      console.error(`Error clearing sections for ${rid}:`, deleteError.message);
    } else {
      console.log(`Cleared existing sections for ${rid}`);
    }
  }

  // Insert sections
  const { data, error } = await supabase
    .from('resource_sections')
    .insert(sections)
    .select('id, resource_id, concept_id, section_title, sort_order');

  if (error) {
    console.error('Error inserting sections:', error.message);
    process.exit(1);
  }

  console.log(`\n✓ Inserted ${data.length} sections:`);
  for (const s of data) {
    console.log(`  [${s.sort_order}] ${s.concept_id} — ${s.section_title}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
