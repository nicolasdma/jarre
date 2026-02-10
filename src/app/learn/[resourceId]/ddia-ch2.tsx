export function DDIAChapter2() {
  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      {/* Hero */}
      <header className="mb-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-j-accent" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            DDIA · Capítulo 2
          </span>
        </div>

        <h1 className="text-4xl font-light text-j-text mb-2">
          Modelos de Datos
        </h1>
        <p className="text-2xl font-light text-j-text-tertiary">
          y Lenguajes de Consulta
        </p>

        <p className="mt-8 text-j-text-secondary leading-relaxed max-w-xl">
          La elección del modelo de datos es la decisión más fundamental en el diseño de una aplicación.
          Afecta cómo piensas sobre el problema y cómo escribes el código.
        </p>
      </header>

      {/* The Big Picture */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6">
          Los tres modelos principales
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-6 border border-j-border">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Relacional
            </p>
            <p className="text-xs text-j-text-tertiary">Tablas + SQL</p>
          </div>
          <div className="text-center p-6 border border-j-border">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Documento
            </p>
            <p className="text-xs text-j-text-tertiary">JSON anidado</p>
          </div>
          <div className="text-center p-6 border border-j-border">
            <div className="text-4xl mb-3">🕸️</div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-1">
              Grafo
            </p>
            <p className="text-xs text-j-text-tertiary">Nodos + Aristas</p>
          </div>
        </div>

        <div className="border-l-2 border-j-accent pl-6 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-2">Insight clave</p>
          <p className="text-j-text">
            No hay modelo "mejor". Cada uno optimiza para un tipo de relación entre datos.
          </p>
        </div>
      </section>

      {/* Model 1: Relational */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">01</span>
          <div>
            <h2 className="text-xl text-j-text">Modelo Relacional</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              SQL · PostgreSQL · MySQL
            </p>
          </div>
        </div>

        {/* Visual: Tables */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Estructura</p>

          <div className="grid grid-cols-2 gap-6">
            {/* Users table */}
            <div>
              <p className="text-xs text-j-accent mb-2 font-mono">users</p>
              <div className="border border-j-border text-xs">
                <div className="grid grid-cols-3 bg-j-bg-alt border-b border-j-border">
                  <span className="p-2 font-mono text-j-text-secondary">id</span>
                  <span className="p-2 font-mono text-j-text-secondary">name</span>
                  <span className="p-2 font-mono text-j-text-secondary">email</span>
                </div>
                <div className="grid grid-cols-3 border-b border-j-border">
                  <span className="p-2 text-j-accent">1</span>
                  <span className="p-2">Ana</span>
                  <span className="p-2 text-j-text-tertiary">ana@...</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="p-2 text-j-accent">2</span>
                  <span className="p-2">Bob</span>
                  <span className="p-2 text-j-text-tertiary">bob@...</span>
                </div>
              </div>
            </div>

            {/* Orders table */}
            <div>
              <p className="text-xs text-j-accent mb-2 font-mono">orders</p>
              <div className="border border-j-border text-xs">
                <div className="grid grid-cols-3 bg-j-bg-alt border-b border-j-border">
                  <span className="p-2 font-mono text-j-text-secondary">id</span>
                  <span className="p-2 font-mono text-j-text-secondary">user_id</span>
                  <span className="p-2 font-mono text-j-text-secondary">total</span>
                </div>
                <div className="grid grid-cols-3 border-b border-j-border">
                  <span className="p-2">101</span>
                  <span className="p-2 text-j-accent">1 →</span>
                  <span className="p-2">$50</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="p-2">102</span>
                  <span className="p-2 text-j-accent">1 →</span>
                  <span className="p-2">$30</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-j-text-secondary mt-4 text-center">
            Datos normalizados → relaciones vía <span className="font-mono text-j-accent">foreign keys</span> → unir con <span className="font-mono text-j-accent">JOIN</span>
          </p>
        </div>

        {/* Pros/Cons */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Joins flexibles entre cualquier tabla</li>
              <li>• Esquema estricto → datos consistentes</li>
              <li>• 40+ años de optimización de queries</li>
              <li>• Ideal para relaciones many-to-many</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Impedance mismatch con objetos</li>
              <li>• Joins costosos a escala</li>
              <li>• Esquema rígido → migraciones</li>
              <li>• Datos jerárquicos son awkward</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Model 2: Document */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">02</span>
          <div>
            <h2 className="text-xl text-j-text">Modelo de Documento</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              MongoDB · CouchDB · Firestore
            </p>
          </div>
        </div>

        {/* Visual: JSON */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Estructura</p>

          <pre className="text-xs font-mono text-[#5a5a52] bg-j-bg-alt p-4 overflow-x-auto">
{`{
  "id": 1,
  "name": "Ana",
  "email": "ana@...",
  "orders": [
    { "id": 101, "total": 50 },
    { "id": 102, "total": 30 }
  ],
  "address": {
    "city": "Madrid",
    "zip": "28001"
  }
}`}
          </pre>

          <p className="text-xs text-j-text-secondary mt-4 text-center">
            Todo anidado en un documento → <span className="font-mono text-j-accent">una lectura</span> trae todo
          </p>
        </div>

        {/* Key concept: Locality */}
        <div className="border-l-2 border-j-warm-dark pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-2">Concepto clave: Localidad</p>
          <p className="text-j-text">
            Si siempre necesitas el usuario + sus órdenes juntos,
            <span className="text-j-accent"> un documento es más eficiente</span> que hacer JOIN.
          </p>
        </div>

        {/* Pros/Cons */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-3">Fortalezas</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Esquema flexible (schema-on-read)</li>
              <li>• Natural para datos jerárquicos</li>
              <li>• Mejor localidad de datos</li>
              <li>• Mapea bien a objetos en código</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-3">Debilidades</p>
            <ul className="space-y-2 text-sm text-[#5a5a52]">
              <li>• Joins pobres o inexistentes</li>
              <li>• Duplicación de datos</li>
              <li>• Documentos pueden crecer mucho</li>
              <li>• Many-to-many es doloroso</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Model 3: Graph */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">03</span>
          <div>
            <h2 className="text-xl text-j-text">Modelo de Grafo</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Neo4j · DGraph · Amazon Neptune
            </p>
          </div>
        </div>

        {/* Visual: Graph */}
        <div className="relative p-6 bg-white/50 mb-8">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">Estructura</p>

          <div className="flex justify-center items-center gap-8 py-8">
            {/* Node: Ana */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-j-accent flex items-center justify-center bg-white">
                <span className="text-sm font-medium">Ana</span>
              </div>
              <span className="text-[10px] text-j-text-tertiary mt-1">:Person</span>
            </div>

            {/* Edge */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-px bg-j-accent relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-[#4a5d4a] border-y-4 border-y-transparent" />
              </div>
              <span className="text-[10px] text-j-accent mt-1">:KNOWS</span>
            </div>

            {/* Node: Bob */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-j-accent flex items-center justify-center bg-white">
                <span className="text-sm font-medium">Bob</span>
              </div>
              <span className="text-[10px] text-j-text-tertiary mt-1">:Person</span>
            </div>

            {/* Edge */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-px bg-[#8b7355] relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-[#8b7355] border-y-4 border-y-transparent" />
              </div>
              <span className="text-[10px] text-j-warm-dark mt-1">:WORKS_AT</span>
            </div>

            {/* Node: Acme */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-j-warm-dark flex items-center justify-center bg-white">
                <span className="text-sm font-medium">Acme</span>
              </div>
              <span className="text-[10px] text-j-text-tertiary mt-1">:Company</span>
            </div>
          </div>

          <p className="text-xs text-j-text-secondary mt-4 text-center">
            <span className="font-mono text-j-accent">Nodos</span> (entidades) + <span className="font-mono text-j-accent">Aristas</span> (relaciones) como ciudadanos de primera clase
          </p>
        </div>

        {/* When to use */}
        <div className="border-l-2 border-j-accent pl-6 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-2">Cuándo usar grafos</p>
          <p className="text-j-text">
            Cuando las <span className="text-j-accent">conexiones entre datos</span> son tan importantes como los datos mismos.
          </p>
          <p className="text-sm text-j-text-secondary mt-2">
            Redes sociales, motores de recomendación, detección de fraude, knowledge graphs.
          </p>
        </div>
      </section>

      {/* Schema comparison */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-4xl font-light text-[#e8e6e0]">04</span>
          <div>
            <h2 className="text-xl text-j-text">Schema-on-Write vs Schema-on-Read</h2>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              La diferencia filosófica fundamental
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-5 border border-j-accent bg-j-accent/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-3">Schema-on-Write</p>
            <p className="text-sm text-[#5a5a52] mb-3">Relacional (SQL)</p>
            <p className="text-sm text-j-text">"Define la estructura primero. Los datos deben conformarse."</p>
            <div className="mt-4 text-xs text-j-text-secondary">
              <p>✓ Datos siempre válidos</p>
              <p>✓ Errores en tiempo de escritura</p>
              <p>✗ Migraciones dolorosas</p>
            </div>
          </div>
          <div className="p-5 border border-j-warm-dark bg-[#8b7355]/5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm-dark uppercase mb-3">Schema-on-Read</p>
            <p className="text-sm text-[#5a5a52] mb-3">Documento (NoSQL)</p>
            <p className="text-sm text-j-text">"Guarda lo que quieras. Interpreta al leer."</p>
            <div className="mt-4 text-xs text-j-text-secondary">
              <p>✓ Flexible, evoluciona fácil</p>
              <p>✓ Sin migraciones</p>
              <p>✗ Código debe manejar variaciones</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 bg-white/50">
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-j-border-input" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-j-border-input" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-j-border-input" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-j-border-input" />

          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">Analogía</p>
          <p className="text-[#5a5a52]">
            <span className="text-j-accent">Schema-on-write</span> es como un formulario con campos obligatorios.
            <br />
            <span className="text-j-warm-dark">Schema-on-read</span> es como un cuaderno en blanco donde escribes lo que quieras.
          </p>
        </div>
      </section>

      {/* Decision Framework */}
      <section className="mb-20">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-6">
          Framework de decisión
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-j-border">
            <div>
              <p className="text-j-text">"Tengo datos muy interconectados con muchos many-to-many"</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Relacional o Grafo</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-j-border">
            <div>
              <p className="text-j-text">"Mis datos son jerárquicos y los leo completos"</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Documento</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-j-border">
            <div>
              <p className="text-j-text">"Las relaciones son el core del problema"</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Grafo</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-j-border">
            <div>
              <p className="text-j-text">"Necesito transacciones ACID estrictas"</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Relacional</p>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-j-border">
            <div>
              <p className="text-j-text">"Mi esquema cambia frecuentemente"</p>
            </div>
            <p className="font-mono text-xs text-j-accent">→ Documento</p>
          </div>
        </div>
      </section>

      {/* Mnemonic */}
      <section className="mb-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-6">Mnemotécnico</p>

        <p className="text-4xl font-light text-j-text mb-2">RDG</p>
        <p className="text-sm text-j-text-tertiary mb-8">Las iniciales de los tres modelos</p>

        <div className="inline-block text-left space-y-2">
          <p><span className="text-j-accent font-medium">R</span><span className="text-j-text-tertiary">elacional</span> <span className="text-j-text">— Tablas + JOINs + Consistencia</span></p>
          <p><span className="text-j-accent font-medium">D</span><span className="text-j-text-tertiary">ocumento</span> <span className="text-j-text">— JSON anidado + Localidad + Flexibilidad</span></p>
          <p><span className="text-j-accent font-medium">G</span><span className="text-j-text-tertiary">rafo</span> <span className="text-j-text">— Nodos + Aristas + Traversals</span></p>
        </div>
      </section>

      {/* Final question */}
      <section className="text-center py-12 border-t border-j-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
          Pregunta para reflexionar
        </p>
        <p className="text-xl text-[#5a5a52] max-w-md mx-auto">
          En tu aplicación actual, ¿estás forzando datos jerárquicos en tablas,
          <span className="text-j-text"> o relaciones complejas en documentos</span>?
        </p>
      </section>
    </article>
  );
}
