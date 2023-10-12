# API pour Call Notifier

Cette API permet de faire une liaison entre le bot et le CLI lors de l'association d'une Freebox. Il est nécessaire d'héberger cette API si vous souhaiter hébergez le robot Telegram.

> Contrairement au CLI qui s'exécute sur l'ordinateur de l'utilisateur, l'API n'a pas besoin d'être connecté à une Freebox.

> Vous pouvez parfaitement utiliser cette API sur [Vercel](https://vercel.com/new), vous n'aurez qu'à fork ce repo et le configurer depuis votre panel.

## Utilisation d'une API personnalisée avec le CLI

```bash
npm i -g freebox-notifier-cli
fbx-associate https://url-de-votre-api.com
```

## Installation

### Prérequis

- [Node.js](https://nodejs.org/fr/) (version 18 ou supérieure)
- Un compte [Supabase](https://supabase.com/dashboard/sign-in) (gratuit)

### Configurer la base de données

> Cette base de donnée est commune pour le bot Telegram et l'API. Si vous avez déjà créer un projet Supabase, vous pouvez passer cette étape.

> Les instructions sont [disponibles ici](https://github.com/el2zay/wikis/wiki/H%C3%A9berger-soi%E2%80%90m%C3%AAme#configurer-la-base-de-donn%C3%A9es).

### Installation

1. Cloner le repository
```sh
git clone https://github.com/Freebox-Tools/api-notifier.git
```

2. Installer les dépendances
```sh
cd api-notifier
npm install
# ou "pnpm install" si vous utilisez pnpm
```

3. Créer un fichier `.env` à la racine du projet, et y ajouter les variables suivantes :
```sh
SUPABASE_LINK=https://****.supabase.co
SUPABASE_PUBLIC_KEY=<longue clé d'accès l'API, privée contrairement à ce que le nom indique, permet un accès complet à la base de données, voir la partie sur Supabase>
```

4. Lancer l'API
```sh
npm start
# ou vous pouvez utiliser pm2 pour le lancer en arrière plan
pm2 start index.js --name "API - Call Notifier"
```
