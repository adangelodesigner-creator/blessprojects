# Puesta en marcha (≈5 min) — blessprojects

El código ya está listo. Faltan estos pasos que requieren **tu cuenta** (crear proyecto y
manejar tus llaves). Hazlos una sola vez.

## 1. Crear proyecto en Supabase
1. Entra a https://supabase.com → inicia sesión → **New project**.
2. Nombre: `blessprojects`. Región: la más cercana (East US). Genera y **guarda la
   contraseña de la base de datos**.
3. Espera ~2 min a que termine de crearse.

## 2. Crear las tablas
1. En el proyecto → menú **SQL Editor** → New query.
2. Abre el archivo `supabase/schema.sql` de este repo, copia TODO su contenido, pégalo y
   dale **Run**. Debe decir `Success. No rows returned`.

## 3. Crear tu usuario
1. Menú **Authentication** → **Users** → **Add user** → tu email + una contraseña.
2. Menú **Authentication** → **Sign In / Providers** → **desactiva** "Allow new users to
   sign up" (para que nadie más se registre).

## 4. Copiar las llaves
1. Menú **Project Settings** → **API**.
2. Copia **Project URL** y **anon public** key.

## 5. Poner las llaves en la app (local)
Edita el archivo `.env.local` (en la raíz del repo) y reemplaza los placeholders:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   (tu anon public key)
```

Prueba local:
```
npm run dev
```
Debe abrir el login; entra con el usuario del paso 3 y ya guarda en la nube.

## 6. Desplegar en Vercel
1. Entra a https://vercel.com → inicia sesión con GitHub.
2. **Add New → Project** → importa el repo `blessprojects`. Detecta **Vite** solo.
3. En **Environment Variables** agrega las mismas dos:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (aplícalas a Production y Preview). **Deploy**.

## 7. Ajuste final en Supabase
Menú **Authentication** → **URL Configuration** → agrega tu URL de Vercel
(`https://<tu-proyecto>.vercel.app`) en **Site URL** y **Redirect URLs** (para que el
"olvidé mi contraseña" redirija bien).

## 8. Probar el sync
1. Abre la URL de Vercel en la **PC** → login → verás tus proyectos.
2. Abre la misma URL en el **teléfono** → login → instálala (Añadir a pantalla de inicio).
3. Crea una tarea en el teléfono → en la PC, enfoca la ventana → aparece. ✅

---

**Notas**
- La `anon public` key es segura de exponer: el acceso lo protege RLS en la base de datos.
- La **contraseña de la DB** y la **service_role** key NUNCA van en el frontend ni en este repo.
- Pagos: diferidos. El modelo ya deja el hueco para PayPal + registros manuales.
