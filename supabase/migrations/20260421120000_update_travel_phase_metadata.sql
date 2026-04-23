-- ============================================================================
-- Travel track — Replace placeholder objectives/outcomes in phase metadata
-- ----------------------------------------------------------------------------
-- The original seed (20260421020000) used 'TBD - coordinator' placeholders.
-- This migration replaces them with curated content from each phase brief
-- in docs/travel-track/phase-N-brief.md.
-- ============================================================================

BEGIN;

-- Phase 1 — Panorámica Continental
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Instalar la lectura macro del continente antes del zoom regional: geografía física sudamericana, pueblos pre-colombinos mayores, los tres virreinatos, motor económico de Potosí, ejes fluviales y rutas coloniales, ubicación no accidental de las capitales, independencias de San Martín y Bolívar y divergencia poscolonial.',
  objective_en = 'Install the continental macro view before the regional zoom: South American physical geography, major pre-Columbian peoples, the three viceroyalties, Potosí as economic engine, fluvial axes and colonial routes, the non-accidental location of capitals, San Martín and Bolívar''s independence wars, and postcolonial divergence.',
  outcomes_es  = ARRAY[
    'Explicar cómo la subducción Nazca-Sudamericana estructura cordillera, cuencas y biomas',
    'Ubicar a Tawantinsuyu, Muisca, Mapuche y Selk''nam en el mapa pre-colombino',
    'Reconstruir la cadena Potosí-Sevilla-China-mita y su huella en las capitales',
    'Seguir las campañas de San Martín y Bolívar hasta Guayaquil 1822',
    'Leer la divergencia poscolonial Cono Sur / Andes centrales / Colombia'
  ],
  outcomes_en  = ARRAY[
    'Explain how Nazca-South American subduction structures the cordillera, basins, and biomes',
    'Place Tawantinsuyu, Muisca, Mapuche, and Selk''nam on the pre-Columbian map',
    'Reconstruct the Potosí-Seville-China-mita chain and its imprint on the capitals',
    'Follow San Martín''s and Bolívar''s campaigns up to Guayaquil 1822',
    'Read postcolonial divergence across the Southern Cone, Central Andes, and Colombia'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '1';

-- Phase 2 — Colombia Caribe y Darién
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Entrar por el Caribe colombiano: Sierra Nevada de Santa Marta, Cartagena como puerto esclavista, Palenque y cimarronaje (Benkos Biohó), Tayrona y Ciudad Perdida (Teyuna), Barranquilla fluvial del siglo XIX, vallenato-cumbia triétnico, Tapón del Darién como frontera viva y autonomía binacional Guna Yala.',
  objective_en = 'Enter through the Colombian Caribbean: Sierra Nevada de Santa Marta, Cartagena as slave port, Palenque and cimarronaje (Benkos Biohó), Tayrona and Ciudad Perdida (Teyuna), 19th-century fluvial Barranquilla, tri-ethnic vallenato-cumbia, the Darién Gap as live frontier, and the binational Guna Yala autonomy.',
  outcomes_es  = ARRAY[
    'Justificar por qué Cartagena es el eje militar del imperio que protege Potosí',
    'Leer la primera villa libre de América (San Basilio, 1713) como matriz caribe',
    'Situar a los Kogi-Arhuaco-Wiwa como continuidad viva de Tayrona',
    'Analizar el Darién como reserva biológica y mayor corredor migratorio del hemisferio',
    'Ubicar el Tratado Guna 1938 como primera autonomía indígena reconocida en América'
  ],
  outcomes_en  = ARRAY[
    'Justify why Cartagena is the imperial military axis protecting Potosí',
    'Read America''s first free town (San Basilio, 1713) as Caribbean matrix',
    'Situate Kogi-Arhuaco-Wiwa as a living continuity of Tayrona',
    'Analyze the Darién as biological reserve and the hemisphere''s largest migratory corridor',
    'Place the 1938 Guna Treaty as the first indigenous autonomy recognized in America'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '2';

-- Phase 3 — Colombia Andina Norte
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Núcleo económico del país: colonización antioqueña y configuración del paisa, arco Medellín (industria → narco Escobar → urbanismo social Fajardo), Santa Fe y Quimbaya, Eje Cafetero con Federación y Paisaje UNESCO, Cali-Valle afro-cañero-salsa, Bogotazo y La Violencia como gestación del conflicto, Nevados y tragedia Armero 1985.',
  objective_en = 'The country''s economic core: Antioquian colonization and "paisa" identity, Medellín''s arc (industry → Escobar''s narco → Fajardo''s social urbanism), Santa Fe and the Quimbaya, the Coffee Axis with the Federación and UNESCO landscape, Cali-Valle Afro-sugar-salsa, the Bogotazo and La Violencia as conflict genesis, and the 1985 Armero volcanic tragedy.',
  outcomes_es  = ARRAY[
    'Explicar cómo la colonización antioqueña produce el minifundio cafetero',
    'Leer el arco de Medellín 1905-2015 como síntesis política urbana',
    'Contrastar la matriz paisa de minifundio con la hacienda caucana de caña',
    'Trazar la línea Bogotazo 1948 → La Violencia → FARC 1964 → conflicto actual',
    'Reconstruir Armero 1985 como caso canónico de comunicación del riesgo volcánico'
  ],
  outcomes_en  = ARRAY[
    'Explain how Antioquian colonization produces the coffee smallholding model',
    'Read Medellín''s 1905-2015 arc as a synthesis of urban politics',
    'Contrast the paisa smallholder matrix with the Cauca sugar hacienda',
    'Trace the line from Bogotazo 1948 → La Violencia → 1964 FARC → today''s conflict',
    'Reconstruct Armero 1985 as a canonical case of volcanic risk communication'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '3';

-- Phase 4 — Colombia Andina Sur
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Sur profundo: Popayán y su oligarquía de 17 presidentes, San Agustín megalítico, Nasa-Misak y el CRIC como organización indígena canónica, Pasto-Nariño y el Carnaval de Negros y Blancos, Las Lajas y frontera Ipiales-Rumichaca, Trampolín de la Muerte como corredor Andes-Amazonía, Casa Arana y el genocidio del Putumayo, FARC-PNIS y sustitución.',
  objective_en = 'Deep south: Popayán and its oligarchy of 17 presidents, megalithic San Agustín, Nasa-Misak and CRIC as canonical indigenous organization, Pasto-Nariño and the Black and White Carnival, Las Lajas and the Ipiales-Rumichaca border, the Trampolín de la Muerte as Andes-Amazon corridor, Casa Arana and the Putumayo genocide, FARC-PNIS and crop substitution.',
  outcomes_es  = ARRAY[
    'Explicar la desproporción del poder payanés sobre la república colombiana',
    'Interpretar San Agustín como sociedad compleja no-incaica paralela a Muiscas y Tayronas',
    'Leer el CRIC 1971 como modelo replicado de organización indígena',
    'Ubicar el genocidio cauchero (40.000-80.000 víctimas) en el Putumayo-Caquetá',
    'Evaluar el PNIS post-acuerdo 2016 como política pública fallida y en disputa'
  ],
  outcomes_en  = ARRAY[
    'Explain Popayán''s disproportionate power over the Colombian republic',
    'Interpret San Agustín as a complex non-Inca society parallel to Muisca and Tayrona',
    'Read the 1971 CRIC as a replicated model of indigenous organization',
    'Place the rubber genocide (40,000-80,000 victims) in Putumayo-Caquetá',
    'Evaluate post-2016 PNIS as a failing public policy in dispute'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '4';

-- Phase 5 — Amazonía Ecuatoriana
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Oriente ecuatoriano: biodiversidad Yasuní y refugio del Pleistoceno, pueblos amazónicos (Shuar, Achuar, Kichwa, Waorani, Siekopai), caucho y genocidio Putumayo, colonización y reforma agraria 1964-1978, Texaco-Chevron y juicio Aguinda, Yasuní-ITT y referéndum 2023, guerras del Cenepa, CONFENIAE y Sumak Kawsay.',
  objective_en = 'Ecuadorian east: Yasuní biodiversity and the Pleistocene refuge, Amazonian peoples (Shuar, Achuar, Kichwa, Waorani, Siekopai), rubber and the Putumayo genocide, 1964-1978 colonization and agrarian reform, Texaco-Chevron and the Aguinda lawsuit, Yasuní-ITT and the 2023 referendum, the Cenepa wars, CONFENIAE and Sumak Kawsay.',
  outcomes_es  = ARRAY[
    'Explicar por qué Yasuní concentra el récord mundial de diversidad arbórea',
    'Distinguir Shuar/Achuar/Waorani/Kichwa amazónicos en territorio y cosmovisión',
    'Reconstruir el caso Aguinda vs Chevron como litigio climático-indígena global',
    'Leer el Sí al Yasuní 2023 como episodio abierto del extractivismo continental',
    'Ubicar la Guerra del Cenepa 1995 como último conflicto interestatal en Sudamérica'
  ],
  outcomes_en  = ARRAY[
    'Explain why Yasuní holds the world record in tree species diversity',
    'Distinguish Amazonian Shuar/Achuar/Waorani/Kichwa by territory and worldview',
    'Reconstruct Aguinda vs Chevron as a global indigenous climate litigation case',
    'Read the 2023 Yes-to-Yasuní vote as an open chapter of continental extractivism',
    'Place the 1995 Cenepa War as South America''s last interstate conflict'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '5';

-- Phase 6 — Ecuador Andino y Costa
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Cierre del Ecuador: Quito colonial (primer UNESCO 1978), Avenida de los Volcanes de Humboldt, Guayaquil costeño y cacaotero, Revolución Liberal de Eloy Alfaro y ferrocarril, Cuenca-Austro y diáspora, CONAIE-Pachakutik-Sumak Kawsay, feriado bancario 1999 y dolarización 2000 vigente.',
  objective_en = 'Closing Ecuador: colonial Quito (first UNESCO site, 1978), Humboldt''s Avenue of Volcanoes, coastal cacao Guayaquil, Eloy Alfaro''s Liberal Revolution and the trans-Andean railway, Cuenca-Austro and the diaspora, CONAIE-Pachakutik-Sumak Kawsay, the 1999 bank holiday and the 2000 dollarization still in force.',
  outcomes_es  = ARRAY[
    'Contrastar Quito serrana-conservadora vs Guayaquil costeña-liberal como eje político',
    'Explicar por qué Chimborazo es el punto más alejado del centro de la Tierra',
    'Leer la "pepa de oro" como fundación de la oligarquía financiera guayaquileña',
    'Ubicar a la CONAIE 1986 como movimiento indígena más influyente del continente',
    'Evaluar la dolarización 2000 como pérdida de soberanía monetaria irreversible'
  ],
  outcomes_en  = ARRAY[
    'Contrast Quito (highland-conservative) vs Guayaquil (coastal-liberal) as political axis',
    'Explain why Chimborazo is the farthest point from Earth''s center',
    'Read the cacao boom as foundation of the Guayaquil financial oligarchy',
    'Place 1986 CONAIE as the continent''s most influential indigenous movement',
    'Evaluate the 2000 dollarization as irreversible loss of monetary sovereignty'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '6';

-- Phase 7 — Costa Peruana
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Costa peruana: desierto y corriente de Humboldt, Chavín como matriz iconográfica pan-andina, Moche y Señor de Sipán, Chimú y Chan Chan, Lima virreinal de Salazar Bondy, era del guano-salitre y Guerra del Pacífico, desborde popular de Matos Mar y cultura chicha, costa norte piurana-tumbesina con afroperuanos y frontera 1941.',
  objective_en = 'Peruvian coast: desert and the Humboldt Current, Chavín as pan-Andean iconographic matrix, Moche and the Lord of Sipán, Chimú and Chan Chan, viceregal Lima through Salazar Bondy, the guano-saltpeter era and War of the Pacific, Matos Mar''s popular overflow and chicha culture, the Piuran-Tumbesian north with Afro-Peruvians and the 1941 border.',
  outcomes_es  = ARRAY[
    'Explicar por qué los valles transversales son oasis de civilización en el desierto',
    'Trazar la difusión del Horizonte Chavín en Moche, Paracas, Nazca',
    'Reconstruir la conquista inca de Chimú vía corte del río Moche (~1470)',
    'Leer "Lima la horrible" como desmonte del mito de la Arcadia colonial',
    'Ubicar el Desborde popular de Matos Mar como colapso del Estado ante la migración'
  ],
  outcomes_en  = ARRAY[
    'Explain why transverse valleys are civilization oases in the desert',
    'Trace the Chavín Horizon''s spread into Moche, Paracas, Nazca',
    'Reconstruct the Inca conquest of Chimú via the Moche river cut-off (~1470)',
    'Read "Lima la horrible" as dismantling the colonial Arcadia myth',
    'Situate Matos Mar''s Desborde popular as state collapse in the face of migration'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '7';

-- Phase 8 — Cordillera Blanca (Ancash)
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Cordillera Blanca: geología glacial (Huascarán 6.768 m) y retroceso climático, Callejón de Huaylas y río Santa, Chavín de Huántar como sitio físico con Lanzón y cabezas clavas, terremoto-aluvión Yungay 1970, Velasco y reforma agraria 1969, Cañón del Pato e ingeniería de 35 túneles, Parque Nacional UNESCO, Sendero en Ancash via Degregori.',
  objective_en = 'Cordillera Blanca: glacial geology (Huascarán, 6,768 m) and climate retreat, the Huaylas corridor and Santa river, Chavín de Huántar as physical site with the Lanzón and tenon heads, the 1970 Yungay quake-landslide, Velasco and the 1969 agrarian reform, the Cañón del Pato and 35-tunnel engineering, the UNESCO National Park, and Sendero in Ancash via Degregori.',
  outcomes_es  = ARRAY[
    'Explicar por qué la Cordillera Blanca es la cordillera tropical más alta del mundo',
    'Distinguir el Chavín iconográfico (F7) del Chavín sitio (F8) con su Lanzón y canal Rocas',
    'Reconstruir el aluvión de Yungay 1970 como peor desastre natural del Perú',
    'Situar la reforma agraria de Velasco 1969 y sus cooperativas',
    'Leer con Degregori por qué Sendero nace en Ayacucho y no en Ancash'
  ],
  outcomes_en  = ARRAY[
    'Explain why the Cordillera Blanca is the world''s highest tropical range',
    'Distinguish iconographic Chavín (F7) from site Chavín (F8) with its Lanzón and Rocas channel',
    'Reconstruct the 1970 Yungay mudflow as Peru''s worst natural disaster',
    'Situate Velasco''s 1969 agrarian reform and its cooperatives',
    'Read with Degregori why Sendero was born in Ayacucho and not in Ancash'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '8';

-- Phase 9 — Andes Peruanos Sur (Cusco y Amazonía sur)
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Corazón del Tahuantinsuyu: control vertical de pisos ecológicos (Murra), Cusco cosmológico con Coricancha y ceques, resistencia neo-inca de Vilcabamba 1536-1572, Machu Picchu entre Bingham y Yale, Gran Rebelión de Túpac Amaru II 1780, Valle Sagrado con Moray y andenes, utopía andina de Flores Galindo y CVR, descenso del altiplano a Madre de Dios (minería ilegal, Mashco Piro).',
  objective_en = 'Heart of the Tahuantinsuyu: vertical control of ecological tiers (Murra), cosmological Cusco with Coricancha and ceques, neo-Inca resistance of Vilcabamba 1536-1572, Machu Picchu between Bingham and Yale, 1780 Great Rebellion of Túpac Amaru II, Sacred Valley with Moray and terraces, Flores Galindo''s Andean utopia and the CVR, the descent from the altiplano to Madre de Dios (illegal mining, Mashco Piro).',
  outcomes_es  = ARRAY[
    'Explicar cómo funcionaba un imperio de 2M km² sin rueda ni mercado (control vertical)',
    'Leer Cusco como planificación zoomórfica (puma) con sistema de 41 ceques',
    'Reconstruir Vilcabamba 1536-1572 como estado neo-inca paralelo',
    'Ubicar a Túpac Amaru II 1780 como antecedente directo de las independencias',
    'Leer la utopía andina del Inkarrí desde 1572 hasta el MRTA y la CVR'
  ],
  outcomes_en  = ARRAY[
    'Explain how a 2M km² empire functioned without wheel or market (vertical control)',
    'Read Cusco as zoomorphic (puma) planning with a 41-ceque system',
    'Reconstruct Vilcabamba 1536-1572 as parallel neo-Inca state',
    'Situate Túpac Amaru II 1780 as direct antecedent of the independence wars',
    'Read the Andean Inkarrí utopia from 1572 to the MRTA and the Truth Commission'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '9';

-- Phase 10 — Chile (sur a norte)
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Chile en clave longitudinal (sur a norte): pueblos canoeros exterminados, Torres del Paine y ganadería lanera, Chiloé último bastión español 1826, Mapuche y la Araucanía (frontera hasta 1881), terremoto de Valdivia 1960 (9,5 Mw), Santiago con Allende/Pinochet/Chicago Boys, Atacama con salitre/cobre y Guerra del Pacífico, San Pedro de Atacama y Valparaíso patrimonio.',
  objective_en = 'Chile read longitudinally (south to north): exterminated canoe peoples, Torres del Paine and sheep ranching, Chiloé as last Spanish stronghold (1826), Mapuche and the Araucanía (frontier until 1881), the 1960 Valdivia earthquake (9.5 Mw), Santiago with Allende/Pinochet/Chicago Boys, Atacama with saltpeter/copper and the War of the Pacific, San Pedro de Atacama and the Valparaíso heritage.',
  outcomes_es  = ARRAY[
    'Explicar por qué Chile tuvo el sismo más grande jamás registrado (Valdivia 1960)',
    'Reconstruir la simetría Pacificación de la Araucanía 1881 / Conquista del Desierto 1878-85',
    'Leer a Pinochet y los Chicago Boys como primer laboratorio neoliberal global',
    'Ubicar la Guerra del Pacífico 1879-84 como origen del mar boliviano perdido',
    'Situar Valparaíso post-Canal de Panamá 1914 como patrimonio UNESCO 2003'
  ],
  outcomes_en  = ARRAY[
    'Explain why Chile had the largest instrumental earthquake (Valdivia 1960)',
    'Reconstruct the symmetry between the 1881 Pacification of Araucanía and the 1878-85 Desert Campaign',
    'Read Pinochet and the Chicago Boys as the world''s first neoliberal laboratory',
    'Situate the 1879-84 War of the Pacific as origin of Bolivia''s lost coastline',
    'Situate post-1914 Valparaíso (after the Panama Canal) as 2003 UNESCO heritage'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '10';

-- Phase 11 — Argentina: Cuyo y Patagonia (cierre del track)
UPDATE curriculum_phase_metadata
SET
  objective_es = 'Cierre del track: Cuyo colonial y acequias moriscas, Cruce de los Andes de San Martín 1817, Conquista del Desierto 1878-85, Patagonia rebelde de Bayer (huelgas 1920-21), YPF 1907/1922 y Vaca Muerta, Ushuaia-Tierra del Fuego-Malvinas, Córdoba la docta y el Cordobazo 1969, Buenos Aires y la nación argentina retomando F1-C8 (divergencia poscolonial).',
  objective_en = 'Closing the track: colonial Cuyo and Moorish acequias, San Martín''s 1817 Andes crossing, the 1878-85 Desert Campaign, Bayer''s rebel Patagonia (1920-21 strikes), YPF 1907/1922 and Vaca Muerta, Ushuaia-Tierra del Fuego-Malvinas, Córdoba la docta and the 1969 Cordobazo, Buenos Aires and the Argentine nation revisiting F1-C8 (postcolonial divergence).',
  outcomes_es  = ARRAY[
    'Explicar por qué Cuyo perteneció a Chile hasta 1776 y qué dejó eso en Mendoza',
    'Reconstruir el Cruce de los Andes 1817 como operación logística sin precedente',
    'Ubicar la Conquista del Desierto 1878-85 como trauma fundante del Estado argentino',
    'Leer YPF como primera petrolera estatal integral del mundo (anterior a Total)',
    'Sintetizar por qué Argentina pasó de 1913-PBI-Francia a default crónico (cierra F1-C8)'
  ],
  outcomes_en  = ARRAY[
    'Explain why Cuyo belonged to Chile until 1776 and what that left in Mendoza',
    'Reconstruct the 1817 Andes Crossing as an unprecedented logistical operation',
    'Place the 1878-85 Desert Campaign as the founding trauma of the Argentine state',
    'Read YPF as the world''s first integrated state oil company (before Total)',
    'Synthesize why Argentina went from 1913-France-level GDP to chronic default (closes F1-C8)'
  ],
  updated_at = NOW()
WHERE track = 'travel' AND phase = '11';

COMMIT;
