# Posteman

## Description

Posteman est une application facilitant la collaboration d'un groupe de personnes pour organiser un projet, une tâche ou un événement.

Chaque projet contient :

- Une messagerie en temps réel
- Des sections pour catégoriser les thèmes
- Des posts pour proposer des idées ou des tâches

Le créateur du projet peut :

- Supprimer des posts et des messages
- Exclure ou bannir les membres du projet

## Stack

- Node.js >= 20 (22 recommandé)
- Framework NestJS
- Prisma
- PostgreSQL
- Docker

## Installation

### Prérequis :

- Docker Desktop
- Git

### Cloner le repo

git clone url  
cd Poste-man-Back

### Variables d'environnement

Créer un fichier .env à la racine du projet et le remplir à l'aide du fichier .env.example

## Lancement

### Option 1

Prerequis :

- Lancer Docker Desktop
- Node.js >= 20 (22 recommandé)

```bash
# Initialisation de l'application
$ npm run docker:init

# Lancement de l'application
$ npm run start:docker
```

### Option 2

Prerequis :

- Lancer Docker Desktop

```bash

# Initialisation de docker
$ docker compose up -d

# Génération du schéma prisma
$ docker compose run --rm api npx prisma generate

# Migration du schéma prisma
$ docker compose run --rm api npx prisma migrate dev

# Lancement de la seed
$ docker compose run --rm api npx prisma db seed

# Lancement de l'application en mode watch
$ docker compose up --watch

```

## Run tests

```bash
# Tests unitaires
$ npm run test

# Tests d'intégration
# vérifier que la bdd de test est bien configurée en amont
$ npm run test:e2e

# Couverture des tests unitaires
$ npm run test:cov

# Couverture des tests d'intégration
$ npm run test:e2e:cov
```

## Documentation

Accessible une fois l'application démarée.  
Swagger : http://localhost:3000/api

## Accéder à la base de donnée

Prérequis :

- Node.js >= 20 (22 recommandé)
- Application en route sur Docker Desktop

```bash

# Installation des dépendances
$ npm i

# Lancement de prisma studio
$ npx prisma studio
```
