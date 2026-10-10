-- =============================================================================
-- SEED: Angelo Editor — 19 agencias para Outreach (IG DM)
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-07-16 (v2 — UIDs actualizados)
-- =============================================================================

DELETE FROM public.leads WHERE brand = 'angelo-editor';

DO $$
DECLARE
  angelo_uuid uuid := 'ab7dbbca-face-4176-89bf-af827c46cf74';
  aranza_uuid uuid := '83e30fd4-3793-41f1-862c-3ab3f18e2247';
  guille_uuid uuid := '123423ab-29ea-4b02-bfaa-91250303ac96';
BEGIN

  INSERT INTO public.leads (id, user_id, name, handle, status, brand, notes, source, contact_info, assigned_to, assigned_user_id, deal_value, commission_rate, commission_paid, created_at)
  VALUES

  -- =========================================================================
  -- ARANZA — 9 agencias
  -- =========================================================================
  (gen_random_uuid(), aranza_uuid, 'Rock Content', 'rockcontent', 'new', 'angelo-editor',
   'Content marketing LATAM. Ángulo: white-label de edición de reels y VSL.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Resultados Digitales', 'resultadosdigitales', 'new', 'angelo-editor',
   'Agencia digital Venezuela. Meta Ads + branding. Ángulo: tercerizar edición de reels.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Agencia Pulpo', 'agenciaspulpo', 'new', 'angelo-editor',
   'Agencia creativa México-Colombia. Ángulo: partner de edición para reels.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'We Are Katan', 'wearekatan', 'new', 'angelo-editor',
   'Agencia digital España. Ángulo: retainer mensual de reels.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Naranja X', 'naranjax', 'new', 'angelo-editor',
   'Agencia growth Argentina. Ángulo: VSL y video ads.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Somos Digital', 'somosdigital', 'new', 'angelo-editor',
   'Agencia Miami. US Hispanic. Ángulo: white-label edición.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Wunderman Thompson', 'wundermanthompson', 'new', 'angelo-editor',
   'Red global de agencias. Ángulo: colaborador externo edición reels y ads.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'MKTG Agency', 'mktgagency', 'new', 'angelo-editor',
   'Agencia de marca España. Ángulo: paquete mensual de reels.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  (gen_random_uuid(), aranza_uuid, 'Agencia FYG', 'agenciafyg', 'new', 'angelo-editor',
   'Agencia Venezuela. Community management + ads. Ángulo: tercerizar producción reels.', 'instagram_dm', '', 'Aranza', aranza_uuid, 0, 20, false, now()),

  -- =========================================================================
  -- GUILLERMO — 10 agencias
  -- =========================================================================
  (gen_random_uuid(), guille_uuid, 'Ahorita Agency', 'ahoritaagency', 'new', 'angelo-editor',
   'Agencia creativa LATAM. Ángulo: edición de reels para campañas.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Pluris Agency', 'plurisagency', 'new', 'angelo-editor',
   'Agencia branding Colombia. Ángulo: retainer de contenido video.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Buenos Muchachos', 'buenosmuchachos', 'new', 'angelo-editor',
   'Agencia creativa España. Ángulo: partner de post-producción de video.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Agencia Pauta', 'agenciapauta', 'new', 'angelo-editor',
   'Agencia de medios Chile. Ángulo: VSL y video ads.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Gravity Digital', 'gravitydigital', 'new', 'angelo-editor',
   'Agencia performance Miami. Meta + TikTok ads. Ángulo: edición de creativos publicitarios.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Agencia Tono', 'agenciatono', 'new', 'angelo-editor',
   'Agencia comunicación México. Ángulo: paquete premium de VSL.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'The Hero Co', 'theheroco', 'new', 'angelo-editor',
   'Agencia storytelling LATAM. Ángulo: white-label edición reels narrativos.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Agencia Cebra', 'agenciacebra', 'new', 'angelo-editor',
   'Agencia creativa Argentina. Ángulo: tercerizar edición contenido.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'Gobbo Agency', 'gobboagency', 'new', 'angelo-editor',
   'Agencia digital Venezuela. Meta Ads. Ángulo: retainer mensual de reels.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now()),

  (gen_random_uuid(), guille_uuid, 'La Agencia', 'laagencia', 'new', 'angelo-editor',
   'Agencia de marca Colombia. Ángulo: partner de video y post-producción.', 'instagram_dm', '', 'Guillermo', guille_uuid, 0, 20, false, now())

  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed Angelo Editor cargado: 19 agencias';
END $$;
