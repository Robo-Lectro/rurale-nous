# Rurale-Nous 🌿

Veille municipale du Québec rural — transport collectif, développement des communautés, corrélations RIMQ/UMQ/FMQ.

## Ce que ça fait.

- **Collecte automatique** des actualités rurales (RSS + scraping) toutes les heures
- **Classification** par thème : transport collectif, développement, défis ruraux, bonnes pratiques
- **Détection des régions** du Québec automatiquement
- **Croisement** avec les sources officielles : RIMQ, UMQ (Union des municipalités), FMQ (Fédération des municipalités)
- **Corrélations** entre enjeux (transport ↔ exode, mutualisation ↔ rétention...)
- **Résumé 8 minutes** généré par Groq, lisible en une session, avec liens vers toutes les sources

## Installation locale

```bash
npm install
npm run dev
```

## Build macOS (universel Intel + Apple Silicon)

```bash
npm run build:mac
```

Le `.dmg` universel est créé dans `dist/`. Compatible macOS 10.13+.

## GitHub Actions

Chaque push sur `main` déclenche un build automatique. Pour créer une release :

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Configuration

Ouvrez l'app → Préférences → entrez votre clé API Groq pour activer la génération de résumés.

## Sources surveillées

| Source | Type | RSS |
|--------|------|-----|
| RIMQ | Municipal | ✓ |
| UMQ | Municipal | ✓ |
| FMQ | Municipal | ✓ |
| Radio-Canada (9 régions) | Média | ✓ |
| Le Devoir Régions | Média | ✓ |

## Structure du projet

```
src/
  main/          ← Processus Electron (fenêtre, IPC, scheduler)
  renderer/      ← Interface React (Dashboard, Articles, Corrélations, Résumé)
  services/      ← Scraper, Classifier, Correlator, Digest (Groq API)
data/            ← SQLite local (créé automatiquement)
.github/
  workflows/     ← Build macOS universel
```
