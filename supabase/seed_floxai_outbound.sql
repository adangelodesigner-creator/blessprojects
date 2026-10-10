-- =============================================================================
-- SEED: FloxAI — Outbound (proyecto operativo separado)
-- Ejecutar DESPUÉS de seed_floxai.sql (o independiente)
-- Fecha inicio: 2026-06-09 | Sistema: 15 DMs/día, lun-vie, 9-10:30 AM
-- =============================================================================

DO $$
DECLARE
  uid uuid;
  pid uuid := gen_random_uuid();  -- proyecto Outbound

  -- ---- SETUP ----
  t_calcom         uuid := gen_random_uuid();
  t_warmup_p1      uuid := gen_random_uuid();
  t_warmup_p2      uuid := gen_random_uuid();
  t_warmup_p3      uuid := gen_random_uuid();
  t_warmup_p4      uuid := gen_random_uuid();
  t_warmup_p5      uuid := gen_random_uuid();

  -- ---- SEMANA 1 DMs (9-13 jun) ----
  t_dm_p1          uuid := gen_random_uuid();
  t_dm_p2          uuid := gen_random_uuid();
  t_dm_p3          uuid := gen_random_uuid();
  t_dm_p4          uuid := gen_random_uuid();
  t_dm_p5          uuid := gen_random_uuid();
  t_dm_75_s1       uuid := gen_random_uuid();
  t_loom_s1        uuid := gen_random_uuid();
  t_followup_s1    uuid := gen_random_uuid();
  t_kpi_s1         uuid := gen_random_uuid();

  -- ---- SEMANA 2 (15-20 jun) ----
  t_prospeccion_s2 uuid := gen_random_uuid();
  t_dm_75_s2       uuid := gen_random_uuid();
  t_loom_s2        uuid := gen_random_uuid();
  t_kpi_s2         uuid := gen_random_uuid();

  -- ---- SEMANA 3 (22-27 jun) ----
  t_prospeccion_s3 uuid := gen_random_uuid();
  t_dm_75_s3       uuid := gen_random_uuid();
  t_loom_s3        uuid := gen_random_uuid();
  t_kpi_s3         uuid := gen_random_uuid();

  -- ---- CIERRE Y REVISIÓN ----
  t_revision_mes   uuid := gen_random_uuid();

BEGIN
  SELECT id INTO uid FROM auth.users LIMIT 1;
  IF uid IS NULL THEN RAISE EXCEPTION 'No hay usuario. Iniciá sesión primero.'; END IF;

  -- =========================================================================
  -- PROYECTO
  -- =========================================================================
  INSERT INTO projects (id, user_id, name, description, color, client, status, start_date, due_date, notes, links, created_at)
  VALUES (
    pid, uid,
    'FloxAI — Outbound',
    'Sistema de captación activa: 15 DMs/día, Loom personalizado, cierre vía llamada. Meta: 1-2 clientes en 30 días.',
    '#7B2D8B',
    '',
    'active',
    '2026-06-09',
    '2026-07-04',
    E'## Reglas de ejecución (no negociables)\n1. Nunca pitch en DM 1. Solo valor + permiso.\n2. Loom personalizado obligatorio — nombre, nicho, screenshot de SU cuenta.\n3. Max 3 toques: DM → follow-up día 3 → follow-up día 7. Después archivar.\n4. Si dice "no" → "perfecto, éxitos". No insistir.\n5. Registrar TODO en outbound/tracking.md.\n6. Bloque fijo: 9:00-10:30 AM lun-vie.\n\n## KPIs meta semana 1\n- DMs enviados: 75\n- Respuestas: 11 (15%+)\n- Looms enviados: 8\n- Looms vistos: 4 (50%+)\n- Llamadas agendadas: 1\n- Cierres: 0\n\n## Stack\n- Prospección: búsqueda manual IG + hashtags\n- DMs: Instagram nativo (max 15/día — no bots)\n- Loom: plan free (25 videos/mes)\n- Cal.com: evento "Auditoría FloxAI 15 min"\n- Tracking: FloxAI/outbound/tracking.md\n\n## Archivos clave\n- Criterios ICP: FloxAI/outbound/criterios_prospect.md\n- Scripts DM: FloxAI/outbound/dm_scripts.md\n- Plantilla Loom: FloxAI/outbound/loom_template.md\n- Ofertas personalizadas S2: FloxAI/outbound/ofertas_personalizadas_mayo2026.md\n- Follow-up: FloxAI/outbound/followup_sequence.md\n- Tracking KPIs: FloxAI/outbound/tracking.md\n- Prospeccion dominical: FloxAI/outbound/prospeccion_dominical.md\n- Calendario visual: FloxAI/outbound/calendario_visual_semanal.md',
    '[{"id":"l1","label":"Scripts DM","url":"file:///C:/Users/Angelo/Repos/FloxAI/outbound/dm_scripts.md"},{"id":"l2","label":"Tracking KPIs","url":"file:///C:/Users/Angelo/Repos/FloxAI/outbound/tracking.md"},{"id":"l3","label":"Ofertas personalizadas","url":"file:///C:/Users/Angelo/Repos/FloxAI/outbound/ofertas_personalizadas_mayo2026.md"}]',
    '2026-06-09T00:00:00.000Z'
  )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- SETUP (hacer hoy / esta semana)
  -- =========================================================================
  INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, due_date, tags, subtasks, created_at)
  VALUES
  (
    t_calcom, uid, pid,
    'Setup Cal.com — "Auditoría FloxAI 15 min"',
    E'Crear evento en Cal.com:\n- Título: "Auditoría FloxAI 15 min"\n- Duración: 15 min\n- Buffer post-reunión: 10 min\n- Descripción: "Revisamos en 15 min las fugas de tu funnel IG y te digo qué ajustar esta semana."\n- CTA en Loom: el link de este evento (NO "llamada estratégica" — suena vendedor)\n\nVer: FloxAI/outbound/setup_calcom.md',
    'todo', 'high', '2026-06-09',
    '["setup","Cal.com"]',
    '[{"id":"sc1","title":"Crear cuenta Cal.com si no existe","completed":false},{"id":"sc2","title":"Crear event type 15 min","completed":false},{"id":"sc3","title":"Poner link en bio IG","completed":false},{"id":"sc4","title":"Testear: reservar uno de prueba","completed":false}]',
    '2026-06-09T00:00:00.000Z'
  ),

  -- ---- Pre-warmup (2-3 días antes del DM = hacer hoy/mañana) ----
  (
    t_warmup_p1, uid, pid,
    'Pre-warmup @tucoachdelaventa (P1 🔴)',
    E'Hacer ANTES del DM para que no caiga en "solicitudes":\n- Like a 2 reels recientes\n- Comment real y concreto en 1 carrusel (NO emoji solo)\n- Ver 3+ stories\n- Verificar: ¿agenda pública vacía? ¿bio sin CTA directo?\n\nAngulo DM: "llevas +15 años formando equipos de ventas pero el tráfico se queda en el feed sin ruta clara hacia una llamada"',
    'todo', 'high', '2026-06-09',
    '["pre-warmup","P1","@tucoachdelaventa"]',
    '[{"id":"pw11","title":"Like 2 reels recientes","completed":false},{"id":"pw12","title":"Comment real en 1 carrusel","completed":false},{"id":"pw13","title":"Ver 3+ stories","completed":false},{"id":"pw14","title":"Confirmar bio sin CTA directo","completed":false}]',
    '2026-06-09T01:00:00.000Z'
  ),
  (
    t_warmup_p2, uid, pid,
    'Pre-warmup @alvaroruiz_coach (P2 🔴)',
    E'Pre-warmup antes del DM:\n- Like 2 reels, comment real en 1 carrusel, ver 3+ stories\n- Verificar: ¿nicho IA confirmado? ¿cuenta en crecimiento?\n\nAngulo DM: "coaching de negocios enfocado en IA es un nicho que va a explotar este año — tu sistema de captación debería ser tan inteligente como tu nicho"',
    'todo', 'high', '2026-06-09',
    '["pre-warmup","P2","@alvaroruiz_coach"]',
    '[{"id":"pw21","title":"Like 2 reels recientes","completed":false},{"id":"pw22","title":"Comment real en 1 carrusel","completed":false},{"id":"pw23","title":"Ver 3+ stories","completed":false}]',
    '2026-06-09T02:00:00.000Z'
  ),
  (
    t_warmup_p3, uid, pid,
    'Pre-warmup @analiadiazcoach (P3 🟡)',
    E'Pre-warmup antes del DM:\n- Like 2 reels, comment real, ver stories\n- Verificar: ¿vende coaching >$500? (nicho finanzas puede ser solo contenido gratis)\n- Si ticket <$500 → bajar a lista general, no personalizada\n\nAngulo DM: "en finanzas, el que no filtra termina dando consultas gratis a gente que nunca va a pagar"',
    'todo', 'medium', '2026-06-10',
    '["pre-warmup","P3","@analiadiazcoach"]',
    '[{"id":"pw31","title":"Like 2 reels recientes","completed":false},{"id":"pw32","title":"Comment real en 1 carrusel","completed":false},{"id":"pw33","title":"Verificar que vende servicio >$500","completed":false}]',
    '2026-06-09T03:00:00.000Z'
  ),
  (
    t_warmup_p4, uid, pid,
    'Pre-warmup @crezcolatam (P4 🟡) — verificar ticket primero',
    E'⚠️ PRIMERO VERIFICAR: ¿venden servicio/mentoría >$500 USD?\nSi solo venden cursos baratos → descartar, no es ICP.\nSi sí → pre-warmup normal.\n\nAngulo DM: "mucho tráfico educativo es vanidad si no hay embudo que convierta los interesados en inscritos"',
    'todo', 'medium', '2026-06-10',
    '["pre-warmup","P4","@crezcolatam","verificar"]',
    '[{"id":"pw41","title":"Verificar que venden servicio >$500 (no solo cursos baratos)","completed":false},{"id":"pw42","title":"Si califica: like 2 reels + comment real","completed":false}]',
    '2026-06-09T04:00:00.000Z'
  ),
  (
    t_warmup_p5, uid, pid,
    'Pre-warmup @latamcoachingnetwork (P5 🟡)',
    E'Cuenta institucional (~48K). Pre-warmup:\n- Like 2 reels, comment real, ver stories\n\n⚠️ Cuenta institucional: el decision-maker puede no manejar IG directamente. Si responden, pedir hablar con quien decide.\n\nAngulo DM: "tienen 48K seguidores — lo que falta es el filtro entre seguidor y cliente"',
    'todo', 'medium', '2026-06-11',
    '["pre-warmup","P5","@latamcoachingnetwork"]',
    '[{"id":"pw51","title":"Like 2 reels recientes","completed":false},{"id":"pw52","title":"Comment real en 1 carrusel","completed":false},{"id":"pw53","title":"Ver 3+ stories","completed":false}]',
    '2026-06-09T05:00:00.000Z'
  ),

  -- =========================================================================
  -- SEMANA 1 — DMs prioritarios + operación general (9-13 jun)
  -- =========================================================================
  (
    t_dm_p1, uid, pid,
    'DM → @tucoachdelaventa (P1 🔴 — PRIMERO)',
    E'Enviar DESPUÉS del pre-warmup (2-3 días de interacción previa).\n\nScript:\n"[Nombre], vi que llevas +15 años formando equipos de ventas — eso no lo tiene cualquiera.\n\nNoté que tu cuenta tiene mucho valor pero el tráfico se queda en el feed sin ruta clara hacia una llamada. Hice un teardown de 5 min con 2 ajustes concretos para que tus reels conviertan en agenda.\n\n¿Te lo mando? Sin venta, lo abrís y sacás lo que sirva."\n\nTras respuesta SI → grabar Loom (ver tarea Loom S1)\nTras 48h sin respuesta → activar followup_sequence.md',
    'todo', 'high', '2026-06-10',
    '["DM","S1","P1","@tucoachdelaventa"]',
    '[{"id":"dm11","title":"Confirmar pre-warmup completo","completed":false},{"id":"dm12","title":"Enviar DM (copiar script exacto)","completed":false},{"id":"dm13","title":"Registrar en tracking.md — estado: dm1","completed":false}]',
    '2026-06-09T06:00:00.000Z'
  ),
  (
    t_dm_p2, uid, pid,
    'DM → @alvaroruiz_coach (P2 🔴)',
    E'Script:\n"Álvaro, me llamó la atención tu perfil — coaching de negocios enfocado en IA es un nicho que va a explotar este año.\n\nJusto trabajo con coaches LATAM montándoles el sistema para que su Instagram filtre leads calificados automático (bot + agenda). Te grabé un teardown rápido de 5 min con 2-3 ideas para tu cuenta específica.\n\n¿Te lo paso?"\n\nTras respuesta → Loom. Sin respuesta 48h → followup.',
    'todo', 'high', '2026-06-10',
    '["DM","S1","P2","@alvaroruiz_coach"]',
    '[{"id":"dm21","title":"Confirmar pre-warmup completo","completed":false},{"id":"dm22","title":"Enviar DM","completed":false},{"id":"dm23","title":"Registrar en tracking.md","completed":false}]',
    '2026-06-09T07:00:00.000Z'
  ),
  (
    t_dm_p3, uid, pid,
    'DM → @analiadiazcoach (P3 🟡) — solo si califica',
    E'Solo enviar si verificaste que vende servicio >$500.\n\nScript:\n"Analía, tu contenido de finanzas personales es muy sólido — se nota que dominás el tema y no improvisás.\n\nTrabajo con coaches LATAM que ya tienen la audiencia pero pierden leads porque no hay nada entre el reel y la llamada. Le grabé un teardown de 5 min a tu funnel con 2 ajustes que podrían cambiar la conversión esta semana.\n\n¿Te interesa que te lo mande?"',
    'todo', 'medium', '2026-06-11',
    '["DM","S1","P3","@analiadiazcoach"]',
    '[{"id":"dm31","title":"Verificar ticket >$500","completed":false},{"id":"dm32","title":"Confirmar pre-warmup","completed":false},{"id":"dm33","title":"Enviar DM","completed":false},{"id":"dm34","title":"Registrar en tracking.md","completed":false}]',
    '2026-06-09T08:00:00.000Z'
  ),
  (
    t_dm_p4, uid, pid,
    'DM → @crezcolatam (P4 🟡) — solo si califica',
    E'Solo enviar si confirmaste que venden servicio/mentoría >$500.\n\nScript:\n"Equipo Crezco, su contenido de educación financiera está muy bien armado — consistente y con valor real.\n\nVi que tienen comunidad activa pero no vi un sistema claro que lleve del reel a una llamada o inscripción filtrada. Grabé un teardown de 5 min con 2-3 ideas concretas para que el contenido convierta mejor.\n\n¿Se los paso? Sin venta, lo ven y sacan lo que sirva."',
    'todo', 'medium', '2026-06-11',
    '["DM","S1","P4","@crezcolatam"]',
    '[{"id":"dm41","title":"Verificar ticket >$500 (ver nota ⚠️ en pre-warmup)","completed":false},{"id":"dm42","title":"Confirmar pre-warmup","completed":false},{"id":"dm43","title":"Enviar DM","completed":false},{"id":"dm44","title":"Registrar en tracking.md","completed":false}]',
    '2026-06-09T09:00:00.000Z'
  ),
  (
    t_dm_p5, uid, pid,
    'DM → @latamcoachingnetwork (P5 🟡)',
    E'Script:\n"Equipo LATAM Coaching, llevo semanas viendo su contenido — la comunidad que armaron es impresionante.\n\nVi una oportunidad: tienen 48K seguidores pero el camino del feed a la inscripción tiene fugas. Grabé un teardown de 5 min mostrando 2 ajustes concretos para que más de esos seguidores conviertan.\n\n¿Se los paso?"\n\n⚠️ Si responden: preguntar "¿podría hablar con quien toma decisiones sobre marketing/captación?" — no cerrar con un community manager.',
    'todo', 'medium', '2026-06-12',
    '["DM","S1","P5","@latamcoachingnetwork"]',
    '[{"id":"dm51","title":"Confirmar pre-warmup","completed":false},{"id":"dm52","title":"Enviar DM","completed":false},{"id":"dm53","title":"Registrar en tracking.md","completed":false}]',
    '2026-06-09T10:00:00.000Z'
  ),
  (
    t_dm_75_s1, uid, pid,
    'Operación DM semana 1 — 75 DMs en 5 días (15/día lun-vie)',
    E'Bloque diario 9:00-10:30 AM. Solo DESPUÉS de hacer la prospección inicial.\n\nDía a día:\n- Lun 9 jun: setup Cal.com + pre-warmup P1 y P2 (no DMs masivos aún)\n- Mar 10 jun: 15 DMs + DM P1 + DM P2\n- Mié 11 jun: 15 DMs + DM P3 + DM P4\n- Jue 12 jun: 15 DMs + DM P5\n- Vie 13 jun: 15 DMs + revisar respuestas + KPI review\n\nFuentes prospectos: hashtags #coachingLATAM #coachargentina #coachmexico + sugeridos.\nICP: 1K-80K seguidores, vende servicio >$500, postea 3+/semana.\nMax 15 DMs/día — si pasás 20 hay riesgo shadowban.',
    'in_progress', 'high', '2026-06-13',
    '["operación","DM","S1","75-DMs"]',
    '[{"id":"op11","title":"Lun 9: setup + pre-warmup P1 y P2","completed":false},{"id":"op12","title":"Mar 10: 15 DMs + DM P1 + P2","completed":false},{"id":"op13","title":"Mié 11: 15 DMs + DM P3 + P4","completed":false},{"id":"op14","title":"Jue 12: 15 DMs + DM P5","completed":false},{"id":"op15","title":"Vie 13: 15 DMs + revisar respuestas","completed":false}]',
    '2026-06-09T11:00:00.000Z'
  ),
  (
    t_loom_s1, uid, pid,
    'Grabar Looms para respuestas positivas S1',
    E'Por cada respuesta "sí me lo mandás" → grabar Loom de 5 min PERSONALIZADO.\n\nEstructura Loom (ver loom_template.md):\n1. "Hola [nombre], Angelo de FloxAI. Grabé esto en 5 min porque vi 2 cosas en tu cuenta que te están costando leads."\n2. Compartir pantalla con su perfil IG\n3. Fuga 1 (específica, con screenshot)\n4. Fuga 2 (específica, con screenshot)\n5. "Hay una tercera pero la vemos en llamada — si te sirve lo que viste, agendá 15 min acá: [link Cal.com]"\n\n⚠️ NO vender en el Loom. CTA = "agendá 15 min" (no "llamada estratégica", no "sesión de ventas").\nDuración máx: 7 min.',
    'todo', 'high', '2026-06-13',
    '["Loom","S1","personalizado"]',
    '[{"id":"lm11","title":"@tucoachdelaventa — Loom si responde sí","completed":false},{"id":"lm12","title":"@alvaroruiz_coach — Loom si responde sí","completed":false},{"id":"lm13","title":"@analiadiazcoach — Loom si responde sí","completed":false},{"id":"lm14","title":"Looms lista general (resto de respuestas positivas)","completed":false}]',
    '2026-06-09T12:00:00.000Z'
  ),
  (
    t_followup_s1, uid, pid,
    'Activar follow-up sequence para no-respuestas S1',
    E'Para cada DM sin respuesta a las 48h:\n- Día 3: follow-up 1 (ver followup_sequence.md)\n- Día 7: follow-up 2 (último toque)\n- Día 8+: archivar en tracking.md como "archivado". No más toques.\n\nSi responde "no gracias" → "perfecto, éxitos" y archivar. Nunca insistir.',
    'todo', 'medium', '2026-06-13',
    '["follow-up","S1","sequence"]',
    '[{"id":"fu11","title":"Día 3: follow-up a no-respuestas del lun/mar","completed":false},{"id":"fu12","title":"Día 7: follow-up final a no-respuestas","completed":false},{"id":"fu13","title":"Archivar en tracking.md","completed":false}]',
    '2026-06-09T13:00:00.000Z'
  ),
  (
    t_kpi_s1, uid, pid,
    'KPI Review semana 1 — vie 13 jun 18:00',
    E'Revisar tablero tracking.md:\n\n| Métrica | Meta | Real |\n|---------|------|------|\n| DMs enviados | 75 | __ |\n| Respuestas | 11 (15%) | __ |\n| Looms enviados | 8 | __ |\n| Looms vistos | 4 (50%) | __ |\n| Llamadas agendadas | 1 | __ |\n| Cierres | 0 | __ |\n\nDiagnóstico cuello de botella:\n- <10% respuesta → DM no engancha, revisar criterios_prospect.md\n- <30% Loom visto → copy de envío débil\n- Looms vistos pero no agendan → CTA débil o Loom demasiado largo (>7 min)\n\nAjuste para semana 2 antes de arrancar lunes.',
    'todo', 'high', '2026-06-13',
    '["KPI","review","S1","viernes"]',
    '[{"id":"kp11","title":"Completar tablero en tracking.md","completed":false},{"id":"kp12","title":"Identificar cuello de botella","completed":false},{"id":"kp13","title":"Definir 1 ajuste para semana 2","completed":false}]',
    '2026-06-09T14:00:00.000Z'
  ),

  -- =========================================================================
  -- SEMANA 2 (15-20 jun)
  -- =========================================================================
  (
    t_prospeccion_s2, uid, pid,
    'Prospección dominical S2 — dom 15 jun (90 min, 75 leads)',
    E'Bloque 90 min domingo. Ver: FloxAI/outbound/prospeccion_dominical.md\n\nFuentes:\n- Hashtags: #coachingLATAM #coachargentina #coachmexico #coachcolombia #mentorialatam\n- Sugeridos de cuentas ya seguidas\n- Commenters de @carolinamillan y @henriquetoledooficial (ya educados en high ticket)\n\nScoring rápido 30 seg/perfil:\n- >=6 puntos → agregar a prospects.csv\n- <6 puntos → skip\n\nMeta: 75 prospectos scoreados listos para DMs lunes.',
    'todo', 'high', '2026-06-15',
    '["prospección","S2","domingo","75-leads"]',
    '[{"id":"pr21","title":"90 min sin interrupciones","completed":false},{"id":"pr22","title":"Scorear y agregar 75 a prospects.csv","completed":false},{"id":"pr23","title":"Revisar ajustes del KPI S1 antes de arrancar","completed":false}]',
    '2026-06-09T15:00:00.000Z'
  ),
  (
    t_dm_75_s2, uid, pid,
    'Operación DM semana 2 — 75 DMs (15/día lun-vie 15-19 jun)',
    E'Bloque 9:00-10:30 AM lunes a viernes.\nUsar scripts actualizados (ajustados post-KPI S1).\nRegistrar cada DM en tracking.md.\nActivar follow-up para no-respuestas de S1 que vencen esta semana.',
    'todo', 'high', '2026-06-19',
    '["operación","DM","S2","75-DMs"]',
    '[{"id":"op21","title":"Lun 15: 15 DMs","completed":false},{"id":"op22","title":"Mar 16: 15 DMs","completed":false},{"id":"op23","title":"Mié 17: 15 DMs","completed":false},{"id":"op24","title":"Jue 18: 15 DMs","completed":false},{"id":"op25","title":"Vie 19: 15 DMs","completed":false}]',
    '2026-06-15T00:00:00.000Z'
  ),
  (
    t_loom_s2, uid, pid,
    'Looms + seguimiento respuestas S2',
    E'Grabar Looms para respuestas positivas de S1 que lleguen esta semana + nuevas de S2.\nConfirmar llamadas agendadas 24h antes.\nMandar video recordatorio el día de la llamada.',
    'todo', 'medium', '2026-06-19',
    '["Loom","S2","seguimiento"]',
    '[{"id":"lm21","title":"Looms para respuestas positivas S2","completed":false},{"id":"lm22","title":"Confirmar llamadas 24h antes","completed":false},{"id":"lm23","title":"Video recordatorio día de llamada","completed":false}]',
    '2026-06-15T01:00:00.000Z'
  ),
  (
    t_kpi_s2, uid, pid,
    'KPI Review semana 2 — vie 20 jun 18:00',
    E'| Métrica | Meta | Real |\n|---------|------|------|\n| DMs enviados | 75 | __ |\n| Respuestas | 13 (17%) | __ |\n| Looms enviados | 9 | __ |\n| Looms vistos | 5 (55%) | __ |\n| Llamadas agendadas | 2 | __ |\n| Cierres | 0-1 | __ |\n\nS3 empieza el lunes 22. Si hay llamada agendada esta semana → preparar script CLOSER.\nVer: FloxAI/ventas-crm/FLOX_Script_Llamada_CLOSER.md',
    'todo', 'high', '2026-06-20',
    '["KPI","review","S2","viernes"]',
    '[{"id":"kp21","title":"Completar tablero tracking.md","completed":false},{"id":"kp22","title":"Identificar cuello de botella","completed":false},{"id":"kp23","title":"Preparar script CLOSER si hay llamada","completed":false}]',
    '2026-06-20T00:00:00.000Z'
  ),

  -- =========================================================================
  -- SEMANA 3 (22-27 jun)
  -- =========================================================================
  (
    t_prospeccion_s3, uid, pid,
    'Prospección dominical S3 — dom 22 jun (90 min, 75 leads)',
    'Bloque 90 min. Misma metodología. Ver prospeccion_dominical.md. Ajustar fuentes según nichos que mejor convirtieron en S1-S2.',
    'todo', 'high', '2026-06-22',
    '["prospección","S3","domingo","75-leads"]',
    '[]',
    '2026-06-22T00:00:00.000Z'
  ),
  (
    t_dm_75_s3, uid, pid,
    'Operación DM semana 3 — 75 DMs (15/día lun-vie 22-26 jun)',
    E'Bloque 9:00-10:30 AM. Scripts refinados con aprendizajes de S1 y S2.\nPriorizar nichos con mejor tasa de respuesta.\nEsta semana es la del cierre (S3) — coordinar con proyecto FloxAI principal.',
    'todo', 'high', '2026-06-26',
    '["operación","DM","S3","75-DMs"]',
    '[]',
    '2026-06-22T01:00:00.000Z'
  ),
  (
    t_loom_s3, uid, pid,
    'Looms + llamadas S3 — semana de cierre',
    E'Esta es la semana del primer cierre (gate S3 del roadmap principal).\nLlamar con script CLOSER: FloxAI/ventas-crm/FLOX_Script_Llamada_CLOSER.md\nNo improvisar la llamada — seguir el script.',
    'todo', 'high', '2026-06-26',
    '["Loom","S3","cierre","llamada"]',
    '[{"id":"lm31","title":"Looms para nuevas respuestas","completed":false},{"id":"lm32","title":"Llamadas con script CLOSER","completed":false},{"id":"lm33","title":"Registrar cierres en tracking.md","completed":false}]',
    '2026-06-22T02:00:00.000Z'
  ),
  (
    t_kpi_s3, uid, pid,
    'KPI Review semana 3 — vie 27 jun 18:00',
    E'| Métrica | Meta | Real |\n|---------|------|------|\n| DMs enviados | 75 | __ |\n| Respuestas | 15 (20%) | __ |\n| Llamadas agendadas | 3 | __ |\n| Cierres | 1 | __ |\n| Ingresos | $1.5K | __ |',
    'todo', 'high', '2026-06-27',
    '["KPI","review","S3","viernes"]',
    '[]',
    '2026-06-27T00:00:00.000Z'
  ),

  -- =========================================================================
  -- REVISIÓN MENSUAL
  -- =========================================================================
  (
    t_revision_mes, uid, pid,
    'Revisión mensual outbound — vie 4 jul',
    E'Cerrar el ciclo del primer mes.\n\nCompletar en tracking.md:\n- Total DMs: ___\n- Total respuestas: ___ (___% tasa)\n- Total Looms: ___\n- Total llamadas: ___\n- Total cierres: ___\n- Revenue mes: $___\n- Mejor script (qué variante convirtió más): ___\n- Peor nicho (descartar mes 2): ___\n- Mejor nicho (doblar mes 2): ___\n- CAC: ___ horas/cliente\n\nDecisión: ¿qué sistema escalar en mes 2?',
    'todo', 'medium', '2026-07-04',
    '["revisión","mensual","outbound"]',
    '[{"id":"rm1","title":"Completar revisión en tracking.md","completed":false},{"id":"rm2","title":"Definir 1 cambio principal para mes 2","completed":false},{"id":"rm3","title":"Actualizar criterios ICP con aprendizajes","completed":false}]',
    '2026-06-27T01:00:00.000Z'
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed Outbound cargado. Proyecto ID: %', pid;
END $$;
