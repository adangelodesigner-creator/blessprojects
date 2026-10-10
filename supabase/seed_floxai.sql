-- =============================================================================
-- SEED: FloxAI en gestorprojects
-- Ejecutar en Supabase SQL Editor (dashboard > SQL Editor > New query)
-- Fecha: 2026-06-09 | Estado: S2 Outbound activo
-- =============================================================================

DO $$
DECLARE
  uid uuid;
  pid_floxai       uuid := gen_random_uuid();
  pid_crumpizza    uuid := gen_random_uuid();

  -- task IDs FloxAI
  t_magnets        uuid := gen_random_uuid();
  t_s1_miedo       uuid := gen_random_uuid();
  t_s1_car1        uuid := gen_random_uuid();
  t_s1_car2        uuid := gen_random_uuid();
  t_s1_cita        uuid := gen_random_uuid();
  t_s1_dolor       uuid := gen_random_uuid();
  t_s2_dm1         uuid := gen_random_uuid();
  t_s2_dm2         uuid := gen_random_uuid();
  t_s2_dm3         uuid := gen_random_uuid();
  t_s2_dm4         uuid := gen_random_uuid();
  t_s2_dm5         uuid := gen_random_uuid();
  t_s2_resp        uuid := gen_random_uuid();
  t_s2_call        uuid := gen_random_uuid();
  t_s3_cliente     uuid := gen_random_uuid();
  t_s4_onboard     uuid := gen_random_uuid();
  t_s4_guiones     uuid := gen_random_uuid();
  t_s4_ensamblaje  uuid := gen_random_uuid();
  t_s4_reporte     uuid := gen_random_uuid();

  -- task IDs Crumpizza
  tc_landing       uuid := gen_random_uuid();
  tc_ads           uuid := gen_random_uuid();
  tc_manchat       uuid := gen_random_uuid();

BEGIN
  SELECT id INTO uid FROM auth.users LIMIT 1;
  IF uid IS NULL THEN RAISE EXCEPTION 'No se encontró usuario en auth.users. Iniciá sesión primero.'; END IF;

  -- =========================================================================
  -- PROYECTOS
  -- =========================================================================
  INSERT INTO projects (id, user_id, name, description, color, client, status, start_date, due_date, notes, links, created_at)
  VALUES
  (
    pid_floxai, uid,
    'FloxAI — Agencia IA',
    'Agencia de contenido e IA para coaches y consultores LATAM. Lanzamiento 4 semanas.',
    '#FF6B00',
    '',
    'active',
    '2026-06-04',
    '2026-06-27',
    E'## Roadmap\n- S1 (4-8 jun): PROOF — contenido orgánico semana 1\n- S2 (9-13 jun): OUTBOUND — 5 DMs premium crafteados\n- S3 (16-20 jun): CIERRE — 1 cliente firmado\n- S4 (23-27 jun): ENTREGA + ESCALA\n\n## Archivos clave\n- Dashboard ejecución: C:/Users/Angelo/Repos/floxai-ejecutar.html\n- Roadmap visual: C:/Users/Angelo/Repos/floxai-roadmap.html\n- Contenido S1: FloxAI/contenido/semana_1/\n- Outbound: FloxAI/outbound/\n- Automatización: FloxAI/automatizacion/\n\n## Regla\nFeo y publicado > perfecto y pendiente. 1 tarea cerrada/día. Timer 25 min para arrancar.',
    '[{"id":"l1","label":"Dashboard ejecución","url":"file:///C:/Users/Angelo/Repos/floxai-ejecutar.html"},{"id":"l2","label":"Roadmap visual","url":"file:///C:/Users/Angelo/Repos/floxai-roadmap.html"}]',
    '2026-06-04T00:00:00.000Z'
  ),
  (
    pid_crumpizza, uid,
    'Crumpizza — Meta Ads',
    'Pizzería en Maracay. Lanzamiento Meta Ads para pizza hamburguesa + borde de queso.',
    '#E63946',
    'Crumpizza (Maracay)',
    'active',
    '2026-06-01',
    NULL,
    E'## Brief\nPizzería en Maracay Venezuela. Producto estrella: pizza hamburguesa + borde de queso (diferenciador).\nObjectivo: leads y ventas vía Meta Ads.',
    '[]',
    '2026-06-01T00:00:00.000Z'
  )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- TAREAS — FloxAI
  -- =========================================================================

  -- ---- S1 PROOF (4-8 jun) ----
  INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, due_date, tags, subtasks, created_at)
  VALUES
  (
    t_magnets, uid, pid_floxai,
    'Cargar lead magnets en ManyChat',
    'Subir sistema_social_funnel.pdf (CTA SISTEMA) y flujo_floxai.pdf (CTA FLUJO) a ManyChat antes de publicar el Jue 4.',
    'done', 'high', '2026-06-04',
    '["S1","setup","ManyChat"]', '[]', '2026-06-04T00:00:00.000Z'
  ),
  (
    t_s1_miedo, uid, pid_floxai,
    'Publicar video "tenía miedo" (apertura lanzamiento)',
    'Flox_Teniamiedo_sub.mp4 (357MB, subtitulado 30-may). Revisar/exportar. PRIMERO de la semana — nada va antes.',
    'done', 'high', '2026-06-04',
    '["S1","orgánico","video"]', '[]', '2026-06-04T00:00:00.000Z'
  ),
  (
    t_s1_car1, uid, pid_floxai,
    'Publicar Carrusel 1 — SISTEMA (quién soy)',
    'Carrusel terminado por Angelo (manual). Caption en semana_1/. CTA: comentar SISTEMA.',
    'done', 'high', '2026-06-05',
    '["S1","orgánico","carrusel"]', '[]', '2026-06-04T10:00:00.000Z'
  ),
  (
    t_s1_car2, uid, pid_floxai,
    'Publicar Carrusel 2 — FLUJO (proceso FloxAI)',
    'Carrusel terminado por Angelo (manual). Caption en semana_1/. CTA: comentar FLUJO.',
    'done', 'high', '2026-06-06',
    '["S1","orgánico","carrusel"]', '[]', '2026-06-04T11:00:00.000Z'
  ),
  (
    t_s1_cita, uid, pid_floxai,
    'Publicar post cita (Dom 7 jun)',
    'Post de cita. Caption en semana_1/.',
    'done', 'medium', '2026-06-07',
    '["S1","orgánico","post"]', '[]', '2026-06-04T12:00:00.000Z'
  ),
  (
    t_s1_dolor, uid, pid_floxai,
    'Grabar + publicar reel "dolor" (Lun 8 jun)',
    'Guión en reel_s1_martes_dolor.md. Selfie iPhone. Grabar en bloque con reel BTS.',
    'in_progress', 'high', '2026-06-08',
    '["S1","orgánico","reel","grabar"]', '[]', '2026-06-04T13:00:00.000Z'
  ),

  -- ---- S2 OUTBOUND (9-13 jun) ----
  (
    t_s2_dm1, uid, pid_floxai,
    'DM crafteado → @tucoachdelaventa (P1)',
    'Prospecto 1 outbound. DM personalizado + ángulo Loom. Ver outbound/ofertas_personalizadas_mayo2026.md.',
    'todo', 'high', '2026-06-10',
    '["S2","outbound","DM"]', '[]', '2026-06-09T00:00:00.000Z'
  ),
  (
    t_s2_dm2, uid, pid_floxai,
    'DM crafteado → @alvaroruiz_coach (P2)',
    'Prospecto 2 outbound. DM personalizado + ángulo Loom.',
    'todo', 'high', '2026-06-10',
    '["S2","outbound","DM"]', '[]', '2026-06-09T01:00:00.000Z'
  ),
  (
    t_s2_dm3, uid, pid_floxai,
    'DM crafteado → @analiadiazcoach (P3)',
    'Prospecto 3 outbound. DM personalizado + ángulo Loom.',
    'todo', 'high', '2026-06-11',
    '["S2","outbound","DM"]', '[]', '2026-06-09T02:00:00.000Z'
  ),
  (
    t_s2_dm4, uid, pid_floxai,
    'DM crafteado → @crezcolatam (P4)',
    'Prospecto 4 outbound. Verificar ticket antes de enviar.',
    'todo', 'medium', '2026-06-11',
    '["S2","outbound","DM"]', '[]', '2026-06-09T03:00:00.000Z'
  ),
  (
    t_s2_dm5, uid, pid_floxai,
    'DM crafteado → @latamcoachingnetwork (P5)',
    'Prospecto 5 outbound. DM personalizado + ángulo Loom.',
    'todo', 'medium', '2026-06-12',
    '["S2","outbound","DM"]', '[]', '2026-06-09T04:00:00.000Z'
  ),
  (
    t_s2_resp, uid, pid_floxai,
    'Gate S2: 2 respuestas obtenidas',
    'Gate mínimo para avanzar a S3. Seguimiento con followup_sequence.',
    'todo', 'high', '2026-06-13',
    '["S2","gate","outbound"]', '[]', '2026-06-09T05:00:00.000Z'
  ),
  (
    t_s2_call, uid, pid_floxai,
    'Gate S2: 1 llamada agendada',
    'Agendar call vía Calcom. Gate para S3.',
    'todo', 'high', '2026-06-13',
    '["S2","gate","call"]', '[]', '2026-06-09T06:00:00.000Z'
  ),

  -- ---- S3 CIERRE (16-20 jun) ----
  (
    t_s3_cliente, uid, pid_floxai,
    'Gate S3: 1 cliente firmado',
    'Cerrar primer cliente. Skills: floxai-propuesta, floxai-highticket.',
    'todo', 'high', '2026-06-20',
    '["S3","cierre","gate"]', '[]', '2026-06-09T07:00:00.000Z'
  ),

  -- ---- S4 ENTREGA + ESCALA (23-27 jun) ----
  (
    t_s4_onboard, uid, pid_floxai,
    'Onboarding cliente firmado',
    'Skill: floxai-onboarding.',
    'todo', 'medium', '2026-06-24',
    '["S4","entrega"]', '[]', '2026-06-09T08:00:00.000Z'
  ),
  (
    t_s4_guiones, uid, pid_floxai,
    'Producir guiones reels del cliente',
    'Skill: floxai-guiones. Pack 5 reels (2x30s + 3x60s).',
    'todo', 'medium', '2026-06-25',
    '["S4","entrega","reels"]', '[]', '2026-06-09T09:00:00.000Z'
  ),
  (
    t_s4_ensamblaje, uid, pid_floxai,
    'Ensamblaje + variaciones del cliente',
    'Skills: floxai-ensamblaje, floxai-variaciones.',
    'todo', 'medium', '2026-06-26',
    '["S4","entrega"]', '[]', '2026-06-09T10:00:00.000Z'
  ),
  (
    t_s4_reporte, uid, pid_floxai,
    'Reporte primer ciclo',
    'Skill: floxai-reporting. Entregar a cliente.',
    'todo', 'medium', '2026-06-27',
    '["S4","entrega","reporte"]', '[]', '2026-06-09T11:00:00.000Z'
  )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- TAREAS — Crumpizza
  -- =========================================================================
  INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, due_date, tags, subtasks, created_at)
  VALUES
  (
    tc_landing, uid, pid_crumpizza,
    'Landing / página de destino Meta Ads',
    'Página de aterrizaje para las campañas. Optimizada para conversión.',
    'todo', 'high', NULL,
    '["Meta Ads","landing"]', '[]', '2026-06-01T00:00:00.000Z'
  ),
  (
    tc_ads, uid, pid_crumpizza,
    'Crear y lanzar campañas Meta Ads',
    'Anuncios para pizza hamburguesa + borde de queso. Objetivo: leads/ventas.',
    'todo', 'high', NULL,
    '["Meta Ads","campaña"]', '[]', '2026-06-01T01:00:00.000Z'
  ),
  (
    tc_manchat, uid, pid_crumpizza,
    'Automatización ManyChat para pedidos/consultas',
    'Flujo de respuesta automática para consultas de pedido vía IG/Facebook.',
    'todo', 'medium', NULL,
    '["ManyChat","automatización"]', '[]', '2026-06-01T02:00:00.000Z'
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed FloxAI cargado. Proyectos: FloxAI (%), Crumpizza (%)', pid_floxai, pid_crumpizza;
END $$;
