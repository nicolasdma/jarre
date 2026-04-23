-- ============================================================================
-- Travel track — Phase 9 (Andes Peruanos Sur: Cusco y Amazonía sur) seed
-- ----------------------------------------------------------------------------
-- Source of truth: docs/travel-track/phase-9-brief.md
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Concepts C1..C8
-- ---------------------------------------------------------------------------
INSERT INTO concepts (id, name, slug, canonical_definition, phase, track) VALUES
  (
    'travel-f9-tahuantinsuyu-pisos',
    'Formación del Tahuantinsuyu y control vertical de pisos ecológicos',
    'tahuantinsuyu-control-vertical-pisos-ecologicos',
    'Entre ~1438 (reforma de Pachacútec tras la derrota de los Chancas) y 1533 (captura de Atahualpa), el Tahuantinsuyu — "las cuatro regiones unidas" (Chinchaysuyu, Antisuyu, Collasuyu, Contisuyu) — se expande desde Cusco hasta cubrir ~2 millones de km² entre el sur de Colombia y el norte de Chile. Su viabilidad económica se explica por el modelo de control vertical de un máximo de pisos ecológicos (John Murra, 1972): cada grupo étnico mantiene "islas" productivas discontinuas en distintas altitudes (costa 0m para pescado y algodón; yunga 500–2 300m para maíz y coca; quechua 2 300–3 500m para papa y maíz; suni/puna 3 500–4 800m para tubérculos andinos y camélidos) sin pasar por mercado, articuladas por reciprocidad y redistribución estatal. El imperio formaliza esta lógica con la mita (turno de trabajo rotatorio), los quipus (registro de cuerdas anudadas), los tambos y chaskis (postas y mensajeros del qhapaq ñan) y los mitmaqkuna (poblaciones desplazadas). Sin este esquema, no se entiende nada posterior — ni la colonia española, que recicla la mita para Potosí, ni las comunidades campesinas del siglo XXI.',
    '9',
    'travel'
  ),
  (
    'travel-f9-cusco-ombligo',
    'Cusco como ombligo cosmológico: forma de puma, Coricancha y sistema de ceques',
    'cusco-coricancha-ceques',
    'Cusco (Qusqu = ombligo) no fue solo capital administrativa sino centro cosmológico diseñado. Pachacútec lo refunda con planta zoomorfa — el casco histórico traza la silueta de un puma cuya cabeza es Sacsayhuamán (fortaleza-santuario con muros ciclópeos sin mortero) y cuyo cuerpo se recorta entre los ríos Tullumayo y Saphi. Desde el Coricancha (Templo del Sol, recubierto originalmente de planchas de oro) irradiaban 41 líneas ceremoniales imaginarias — el sistema de ceques reconstruido por Tom Zuidema (tesis Leiden 1964) — que organizaban 328 huacas (santuarios) en un calendario ritual-astronómico simultáneamente geográfico y político: cada ceque era responsabilidad de un ayllu o panaca (linaje real). La conquista no destruye esta estructura sino que la superpone: la iglesia de Santo Domingo se erige literalmente sobre los muros del Coricancha, la Catedral sobre el palacio de Viracocha. Esta superposición arquitectónica es el emblema físico del sincretismo andino.',
    '9',
    'travel'
  ),
  (
    'travel-f9-resistencia-vilcabamba',
    'Conquista y resistencia neo-inca: de Cajamarca a Vilcabamba (1532–1572)',
    'conquista-resistencia-neoinca-vilcabamba',
    'La "conquista del Perú" no termina en 1533 con la ejecución de Atahualpa sino en 1572 con la decapitación de Túpac Amaru I en la Plaza de Armas del Cusco por orden del virrey Francisco de Toledo. Entre medio: (a) Manco Inca, entronizado títere por Pizarro, se rebela en 1536, sitia Cusco durante diez meses y, derrotado en Sacsayhuamán, funda el estado neo-inca de Vilcabamba al noroeste del Cusco (ceja de selva, actual La Convención — cerca del corredor Santa Teresa/Quillabamba). (b) Durante 36 años (1536–1572) cuatro incas — Manco, Sayri Túpac, Titu Cusi, Túpac Amaru I — gobiernan un estado paralelo que mantiene ritual, administración y ejército propios. (c) Toledo, al llegar en 1569, define la erradicación de Vilcabamba como prioridad política y la campaña militar culmina en la captura y ejecución pública de Túpac Amaru I (23 sept 1572). Esta "vertebrita andina" subterránea — que la conciencia colonial niega y la memoria popular preserva — es la matriz de todas las rebeliones andinas posteriores, incluida la de 1780.',
    '9',
    'travel'
  ),
  (
    'travel-f9-machu-picchu',
    'Machu Picchu: de llaqta imperial a marca global',
    'machu-picchu-bingham-yale',
    'Machu Picchu no fue "descubierto" por Hiram Bingham el 24 de julio de 1911 — familias campesinas vivían cultivando allí y guías locales (Melchor Arteaga, el niño Pablito Álvarez) lo llevaron al sitio. Bingham, historiador de Yale con financiación de la National Geographic Society, la reclasifica como "ciudad perdida de los incas" y la convierte en noticia global (National Geographic, abril 1913). Función real del sitio: llaqta real de Pachacútec hacia 1450, hacienda estacional y centro religioso, nunca capital ni fortaleza. Entre 1911 y 1915 Bingham exporta ~46 000 piezas arqueológicas a Yale; la controversia se extiende 100 años hasta que, tras campaña diplomática del gobierno de Alan García y acuerdo de noviembre 2010, Yale repatria 363 piezas prioritarias en 2011 y completa la devolución en 2012 (hoy en el Museo Machupicchu Casa Concha en Cusco). Hoy la ciudadela es UNESCO (1983), Nueva Maravilla del Mundo (2007) y locomotora de la economía cusqueña — con cuota diaria de 4 500 visitantes y conflictos recurrentes de Cusco vs Lima por la gobernanza del sitio.',
    '9',
    'travel'
  ),
  (
    'travel-f9-tupac-amaru-ii',
    'Túpac Amaru II y la Gran Rebelión (1780–1783)',
    'tupac-amaru-ii-gran-rebelion',
    'El 4 de noviembre de 1780, José Gabriel Condorcanqui Noguera — curaca de Surimana, Tungasuca y Pampamarca, descendiente legal reconocido del inca Túpac Amaru I y comerciante arriero acomodado — captura al corregidor Antonio de Arriaga en Tinta (sur del Cusco), lo ejecuta días después y desata la mayor rebelión anticolonial del siglo XVIII en toda América española. Adopta el nombre Túpac Amaru II y articula una alianza multiétnica (indígenas, mestizos, criollos descontentos) contra abusos del sistema de corregimientos, repartos forzosos y mita de Potosí. La rebelión se extiende del Cusco al altiplano del Collao (Puno) y al Alto Perú hasta La Paz, donde Túpac Katari cerca la ciudad en 1781. Capturado por traición en Langui el 6 abril 1781, es ejecutado el 18 mayo 1781 en la Plaza de Armas del Cusco con un ritual de tortura diseñado por el visitador José Antonio de Areche: obligado a presenciar la ejecución de su esposa Micaela Bastidas e hijos, se intenta descuartizarlo con cuatro caballos y finalmente se lo decapita. Las reformas borbónicas postrebelión suprimen corregimientos y curacazgos pero ya es tarde: 30 años después empezarán las guerras de independencia, y el nombre "Túpac Amaru" vuelve a ser bandera en el siglo XX (MRTA, 1984–1997).',
    '9',
    'travel'
  ),
  (
    'travel-f9-valle-sagrado',
    'Valle Sagrado y tecnología agrícola inca: Moray, andenes, waru waru',
    'valle-sagrado-moray-andenes',
    'El Valle Sagrado del Urubamba (río Vilcanota en su tramo superior) entre Pisac y Ollantaytambo es el granero tecnológico del imperio y la prueba empírica del modelo de control vertical. Sus componentes: (a) andenes — terrazas de piedra con drenaje interno que convierten laderas de 30–45° en parcelas cultivables y controlan erosión; existen ~1.5M acres en los Andes; (b) Moray — complejo de tres anfiteatros circulares concéntricos a 3 500m con ~20 microclimas simultáneos (diferencia de hasta 15°C entre el borde y el fondo), interpretado por el antropólogo John Earls (PUCP) como estación experimental para adaptar cultivos entre pisos ecológicos; (c) waru waru en el altiplano — camellones elevados con canales de agua que amortiguan heladas nocturnas; (d) Ollantaytambo y Pisac como ciudades vivas con trazado inca todavía habitado, únicas del imperio con continuidad urbana ininterrumpida; (e) salineras de Maras — pozas de evaporación pre-incas aún en operación. El valle funciona como laboratorio y despensa de Cusco: demuestra que el imperio incaico no fue sólo expansión militar sino una ingeniería paisajística a escala continental.',
    '9',
    'travel'
  ),
  (
    'travel-f9-utopia-violencia',
    'Utopía andina, indigenismo literario y violencia política (CVR 1980–2000)',
    'utopia-andina-cvr-sierra-sur',
    'Tres capas interrelacionadas de la memoria andina del siglo XX. (a) Utopía andina (Alberto Flores Galindo, 1986): tesis de que desde 1572 existe en los Andes una memoria milenarista del Inca — el retorno del Inkarrí reconstituyendo cabeza y cuerpo — que fusiona mesianismo cristiano y cosmología andina y que late bajo cada rebelión colonial, republicana y moderna del sur peruano. (b) Indigenismo literario: José María Arguedas — bilingüe quechua/castellano, educado en haciendas del sur andino — publica Los ríos profundos (1958), Todas las sangres (1964) y póstuma El zorro de arriba y el zorro de abajo (1971) construyendo una literatura desde adentro del mundo andino (no sobre él como Ciro Alegría), con el río Pachachaca y Abancay como ejes simbólicos. (c) Conflicto armado interno 1980–2000: Sendero Luminoso (PCP-SL, maoísta, fundado por Abimael Guzmán en Huamanga/Ayacucho) y el MRTA generan una guerra interna con ~69 280 muertos y desaparecidos según la CVR (informe final, 28 agosto 2003, 9 tomos). 75% de las víctimas fueron quechuahablantes rurales del sur central; Ayacucho concentra el epicentro pero Cusco, Apurímac, Puno y Huancavelica quedan heridos. Respuesta estatal: Fujimori 1990–2000, autogolpe 1992, captura de Guzmán 1992, Grupo Colina, esterilizaciones forzadas a mujeres andinas, vacancia 2000. El juicio y condena de Fujimori en 2009 es el primer caso en el mundo de un expresidente juzgado en su país por violaciones a DDHH.',
    '9',
    'travel'
  ),
  (
    'travel-f9-amazonia-sur',
    'Amazonía sur: descenso Cusco → Santa Teresa → Kiteni → Quillabamba → Madre de Dios',
    'amazonia-sur-manu-madre-de-dios',
    'El descenso del altiplano cusqueño (3 400m) a la llanura amazónica (250m) en Madre de Dios no es una transición geográfica menor sino un corredor cultural y económico denso que replica a escala del siglo XXI el mismo gradiente ecológico que gestionaban los incas. Hitos del corredor: (a) Santa Teresa y Quillabamba (La Convención, ceja de selva) — región del estado neo-inca de Vilcabamba, después hacendaria (Hugo Blanco lidera la primera toma de tierras campesina del Perú en 1962, antecedente de la reforma agraria de Velasco 1969), hoy productora de coca legal y café. (b) Kiteni y el río Urubamba inferior — puerta al territorio matsigenka y al gas de Camisea (megaproyecto energético desde 2004). (c) Parque Nacional Manu (1973, Patrimonio Natural UNESCO 1987) — 1.7M ha, una de las zonas más biodiversas del planeta, territorio ancestral de matsigenka, harakbut, yine y del pueblo Mashco Piro en aislamiento voluntario (avistamientos se multiplicaron desde 2011). (d) Ciclo del caucho (1880–1915): Julio César Arana (Casa Arana) y Carlos Fermín Fitzcarrald — epónimo del Fitzcarraldo de Werner Herzog (1982) — esclavizan y exterminan comunidades amazónicas; informe Roger Casement 1912 denuncia el genocidio. (e) Minería ilegal de oro en Madre de Dios: La Pampa es hoy la mayor zona de deforestación por minería aluvial ilegal del Perú, 100 000+ ha devastadas, mercurio en ríos, trata sexual de adolescentes, Operación Mercurio 2019.',
    '9',
    'travel'
  )
ON CONFLICT (id) DO UPDATE SET
  name                 = EXCLUDED.name,
  slug                 = EXCLUDED.slug,
  canonical_definition = EXCLUDED.canonical_definition,
  phase                = EXCLUDED.phase,
  track                = EXCLUDED.track,
  updated_at           = NOW();

-- ---------------------------------------------------------------------------
-- 2) concept_prerequisites — DAG
--    C1 ← F1 pueblos-precolombinos, F1 geografia-fisica
--    C2 ← C1
--    C3 ← C1, C2, F1 virreinatos
--    C4 ← C2, C3
--    C5 ← C3, F1 virreinatos, F1 potosi
--    C6 ← C1, C2
--    C7 ← C5, F1 divergencia-poscolonial
--    C8 ← C1, C3, C7
-- ---------------------------------------------------------------------------
INSERT INTO concept_prerequisites (concept_id, prerequisite_id) VALUES
  ('travel-f9-tahuantinsuyu-pisos',      'travel-f1-pueblos-precolombinos'),
  ('travel-f9-tahuantinsuyu-pisos',      'travel-geo-sudamerica'),
  ('travel-f9-cusco-ombligo',            'travel-f9-tahuantinsuyu-pisos'),
  ('travel-f9-resistencia-vilcabamba',   'travel-f9-tahuantinsuyu-pisos'),
  ('travel-f9-resistencia-vilcabamba',   'travel-f9-cusco-ombligo'),
  ('travel-f9-resistencia-vilcabamba',   'travel-f1-virreinatos'),
  ('travel-f9-machu-picchu',             'travel-f9-cusco-ombligo'),
  ('travel-f9-machu-picchu',             'travel-f9-resistencia-vilcabamba'),
  ('travel-f9-tupac-amaru-ii',           'travel-f9-resistencia-vilcabamba'),
  ('travel-f9-tupac-amaru-ii',           'travel-f1-virreinatos'),
  ('travel-f9-tupac-amaru-ii',           'travel-f1-potosi'),
  ('travel-f9-valle-sagrado',            'travel-f9-tahuantinsuyu-pisos'),
  ('travel-f9-valle-sagrado',            'travel-f9-cusco-ombligo'),
  ('travel-f9-utopia-violencia',         'travel-f9-tupac-amaru-ii'),
  ('travel-f9-utopia-violencia',         'travel-f1-divergencia-poscolonial'),
  ('travel-f9-amazonia-sur',             'travel-f9-tahuantinsuyu-pisos'),
  ('travel-f9-amazonia-sur',             'travel-f9-resistencia-vilcabamba'),
  ('travel-f9-amazonia-sur',             'travel-f9-utopia-violencia')
ON CONFLICT (concept_id, prerequisite_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Resources R1..R8
-- ---------------------------------------------------------------------------
INSERT INTO resources (
  id, title, type, url, author, phase, description,
  estimated_hours, sort_order, curriculum_source, is_archived,
  created_by, track
) VALUES
  (
    'travel-r-rostworowski-tahuantinsuyu',
    'Historia del Tahuantinsuyu',
    'book',
    'https://fondoeditorial.iep.org.pe/producto/historia-del-tahuantinsuyu-obras-completas-viii/',
    'María Rostworowski de Diez Canseco',
    '9',
    'Libro fundacional de los estudios incaicos en el Perú contemporáneo (IEP, 1988; Obras Completas VIII). Rostworowski fue la primera historiadora peruana en usar sistemáticamente documentación colonial (visitas, probanzas, testamentos de curacas) para reconstruir la sociedad inca desde adentro. Lectura íntegra (~332 pp).',
    8.0,
    1,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-murra-pisos-ecologicos',
    'El "control vertical" de un máximo de pisos ecológicos en la economía de las sociedades andinas',
    'paper',
    'https://americafarberman.files.wordpress.com/2017/08/6646535-040805-murra-el-control-vertical-de-un-maximo-de-pisos-ecologicos-bb.pdf',
    'John V. Murra',
    '9',
    'Texto canónico de la etnohistoria andina (1972, originalmente en Visita de la Provincia de León de Huánuco). Define el archipiélago vertical con casos etnográficos concretos (Chupaychu, Lupaqa, Chincha). Lectura obligada antes de caminar cualquier andén.',
    2.0,
    2,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-flores-galindo-buscando-inca',
    'Buscando un Inca: identidad y utopía en los Andes (caps. I, II, VI)',
    'book',
    'https://archive.org/details/flores-galindo-a.-buscando-un-inca.-identidad-y-utopia-en-los-andes-ocr-1994',
    'Alberto Flores Galindo',
    '9',
    'Premio Casa de las Américas 1986. Flores Galindo sutura la memoria andina colonial con la violencia política del XX. Lectura: cap. I "En busca de un Inca" + cap. II "La redención por la violencia" (Túpac Amaru II) + cap. VI "En el nombre del Inca".',
    8.0,
    3,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-zuidema-ceques',
    'El sistema de ceques del Cuzco',
    'book',
    'https://repositorio.pucp.edu.pe/index/handle/123456789/181630',
    'R. Tom Zuidema',
    '9',
    'Libro derivado de la tesis doctoral de Zuidema (Leiden 1964), reeditado por Fondo Editorial PUCP. Descifra los ceques a partir del cronista jesuita Bernabé Cobo (1653). Denso pero indispensable para entender por qué Sacsayhuamán y Qorikancha están donde están.',
    4.0,
    4,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-machu-picchu-bingham-yale',
    'Machu Picchu: Bingham, Yale y repatriación (serie Infobae + UNAL)',
    'article',
    'https://www.infobae.com/historias/2025/06/06/las-aventuras-del-profesor-estadounidense-que-divulgo-la-existencia-del-machu-picchu-y-las-piezas-arqueologicas-que-se-llevo-de-peru/',
    'Infobae Perú (con fuentes primarias de Richard L. Burger/Yale y archivos National Geographic)',
    '9',
    'Narrativa detallada con cifras precisas (5.415 lotes, 173 individuos, 363 piezas repatriadas 2011) sobre el caso Bingham-Yale y la repatriación 2010-2012. Complementar con el artículo de Pensamiento Jurídico UNAL sobre el caso legal.',
    1.5,
    5,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-tupac-amaru-documental',
    'Sucedió en el Perú: Túpac Amaru II (TV Perú)',
    'video',
    'https://www.youtube.com/@TVPeru/search?query=tupac%20amaru%20ii%20sucedio%20en%20el%20peru',
    'TV Perú — Sucedió en el Perú (conducido por Antonio Zapata Velasco, PUCP)',
    '9',
    'Sucedió en el Perú es el programa de divulgación histórica estatal peruano, equivalente local al Canal Encuentro argentino. Antonio Zapata (PUCP) ha hecho varios episodios sobre Túpac Amaru II. Coordinator puede refinar el episodio exacto en follow-up.',
    2.0,
    6,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-cvr-hatun-willakuy',
    'Hatun Willakuy — Síntesis oficial del Informe Final de la CVR',
    'book',
    'https://idehpucp.pucp.edu.pe/wp-content/uploads/2012/11/hatun-willakuy-cvr-espanol.pdf',
    'Comisión de la Verdad y Reconciliación del Perú (2001–2003)',
    '9',
    'Hatun Willakuy ("gran relato" en quechua) es la versión abreviada oficial del Informe Final de 9 tomos de la CVR (presidida por Salomón Lerner Febres). Síntesis canónica del conflicto armado interno 1980-2000. Imprescindible para entender Ayacucho, Cusco, Puno y Huancavelica.',
    10.0,
    7,
    'core',
    FALSE,
    NULL,
    'travel'
  ),
  (
    'travel-r-madre-de-dios-mineria',
    'Minería ilegal en Madre de Dios y el Parque Nacional Manu (Mongabay + DAR)',
    'article',
    'https://es.mongabay.com/2021/10/peligro-en-el-manu-vias-mineria-ilegal-narcotrafico-peru/',
    'Mongabay Latam + Derecho, Ambiente y Recursos Naturales (DAR Perú)',
    '9',
    'Serie de periodismo ambiental de investigación sobre minería aurífera ilegal en Madre de Dios (La Pampa, frontera con Bolivia), con cartografía satelital, cifras del informe DAR 2024 (100 000+ ha deforestadas, 70% minería aurífera ilegal) y reporteo de terreno sobre Mashco Piro y pueblos en aislamiento.',
    3.0,
    8,
    'core',
    FALSE,
    NULL,
    'travel'
  )
ON CONFLICT (id) DO UPDATE SET
  title             = EXCLUDED.title,
  type              = EXCLUDED.type,
  url               = EXCLUDED.url,
  author            = EXCLUDED.author,
  phase             = EXCLUDED.phase,
  description       = EXCLUDED.description,
  estimated_hours   = EXCLUDED.estimated_hours,
  sort_order        = EXCLUDED.sort_order,
  curriculum_source = EXCLUDED.curriculum_source,
  is_archived       = EXCLUDED.is_archived,
  created_by        = EXCLUDED.created_by,
  track             = EXCLUDED.track,
  updated_at        = NOW();

-- ---------------------------------------------------------------------------
-- 4) resource_concepts — teach-only
-- ---------------------------------------------------------------------------
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('travel-r-rostworowski-tahuantinsuyu',  'travel-f9-tahuantinsuyu-pisos',     FALSE),
  ('travel-r-murra-pisos-ecologicos',      'travel-f9-valle-sagrado',           FALSE),
  ('travel-r-flores-galindo-buscando-inca','travel-f9-utopia-violencia',        FALSE),
  ('travel-r-zuidema-ceques',              'travel-f9-cusco-ombligo',           FALSE),
  ('travel-r-machu-picchu-bingham-yale',   'travel-f9-machu-picchu',            FALSE),
  ('travel-r-tupac-amaru-documental',      'travel-f9-tupac-amaru-ii',          FALSE),
  ('travel-r-cvr-hatun-willakuy',          'travel-f9-utopia-violencia',        FALSE),
  ('travel-r-madre-de-dios-mineria',       'travel-f9-amazonia-sur',            FALSE)
ON CONFLICT (resource_id, concept_id) DO UPDATE SET
  is_prerequisite = EXCLUDED.is_prerequisite;

COMMIT;
