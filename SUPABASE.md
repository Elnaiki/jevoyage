## Guide détaillé — Lier le projet à Supabase

Ce guide décrit comment : créer un projet Supabase, configurer les variables d'environnement, créer la table `profiles`, ajouter des politiques RLS et gérer les clés côté client / serveur.

### 1) Créer le projet Supabase

- Allez sur https://app.supabase.com et créez un nouveau projet.
- Notez l'URL du projet (ex: `https://xyz.supabase.co`) et la clé publique (ANON key) dans Settings → API.

### 2) Variables d'environnement

1. Copiez le fichier ` .env.example` en `.env` ou `.env.local` à la racine du projet et remplacez les valeurs :

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

2. Redémarrez le serveur de développement pour que Vite prenne en compte les variables.

```bash
# Windows
copy .env.example .env

# install et lancer
npm install
npm run dev
```

> Ne mettez jamais la `service_role` key côté client. Gardez-la uniquement pour votre serveur.

### 3) Schéma : table `profiles`

Exemple SQL pour créer la table `profiles` liée aux utilisateurs d'auth :

```sql
create table public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	phone text,
	created_at timestamptz default now()
);
```

### 4) Trigger pour créer un profil automatiquement

Optionnel : créer un trigger qui insère un enregistrement dans `profiles` après l'inscription d'un `auth.user` :

```sql
create function public.handle_new_user() returns trigger language plpgsql as $$
begin
	insert into public.profiles (id, full_name, created_at)
	values (new.id, coalesce(new.raw_user_meta->>'full_name',''), now())
	on conflict (id) do nothing;
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();
```

Remarque : `raw_user_meta` contient les données optionnelles envoyées lors de `signUp` si vous passez `options.data`.

### 5) Activer RLS et créer des policies

Activer RLS :

```sql
alter table public.profiles enable row level security;
```

Policies courantes — permettre aux utilisateurs de lire/mettre à jour leur propre profil :

```sql
create policy "Profiles - select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles - insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles - update own" on public.profiles for update using (auth.uid() = id);
```

Si vous utilisez le trigger d'insertion automatique, vous pouvez également autoriser l'insertion depuis le service role seulement, ou créer une policy qui autorise la fonction trigger (security definer) à écrire.

### 6) Exemple côté client (déjà présent dans le projet)

Le client récupère le profil avec :

```ts
const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
```

L'auth est gérée via `supabase.auth` — votre fichier `src/app/lib/auth.tsx` utilise `signUp`, `signInWithPassword` et `onAuthStateChange`.

### 7) Tests manuels

1. Démarrez l'app (`npm run dev`).
2. Allez sur la page d'authentification de l'app et créez un compte.
3. Vérifiez dans Supabase → Table Editor → `profiles` que la ligne est créée.
4. Testez la connexion et la déconnexion depuis l'interface.

### 8) Migrations & CLI

Si vous voulez versionner votre schéma : utilisez le Supabase CLI :

```bash
npx supabase init      # si première utilisation
npx supabase login
npx supabase migration new create_profiles_table
npx supabase db push    # pousse les migrations vers la DB
```

### 9) Sécurité et bonnes pratiques

- Ne commitez jamais de clés sensibles (`service_role`).
- Restreignez les permissions côté serveur et utilisez la `service_role` key uniquement pour tâches back-end.
- Testez les policies RLS avec un utilisateur standard et en tant qu'admin pour vérifier les accès.

---

Si vous voulez, je peux :
- générer un fichier de migration SQL `supabase/migrations/XXXXX_create_profiles_table.sql`,
- ajouter des exemples d'API serveur utilisant la `service_role` key,
- ou créer une page d'admin pour lister les utilisateurs.
