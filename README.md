# 🏨 Hotelia PMS — Hôtel Refuge Bananeraie (Bongouanou)
> **Système Intégré de Gestion Hôtelière Multi-Modale & Point de Vente (POS)**  
> Développé pour l'Hôtel Refuge Bananeraie (Bongouanou, Côte d'Ivoire) — Groupe Dekouassi Holding.

---

## 📋 Table des Matières
1. [Présentation du Système](#-présentation-du-système)
2. [Stack Technique](#-stack-technique)
3. [Prérequis Système](#-prérequis-système)
4. [Installation Rapide](#-installation-rapide)
5. [Configuration de l'Environnement (`.env`)](#-configuration-de-lenvironnement-env)
6. [Déploiement de la Base de Données MySQL](#-déploiement-de-la-base-de-données-mysql)
   - [Option A : Import CLI MySQL (Recommandé)](#option-a--import-direct-en-ligne-de-commande-mysql)
   - [Option B : Déploiement Conteneurisé avec Docker](#option-b--déploiement-rapide-avec-docker)
   - [Option C : Import via phpMyAdmin / MySQL Workbench / DBeaver](#option-c--import-via-phpmyadmin-ou-dbeaver)
   - [Option D : Déploiement Cloud (GCP Cloud SQL, AWS RDS, VPS)](#option-d--déploiement-cloud-vps--cloud-sql)
7. [Architecture de la Base MySQL & Triggers Anti-Surbooking](#-architecture-de-la-base-mysql--triggers-anti-surbooking)
8. [Lancement et Exécution](#-lancement-et-exécution)
9. [Comptes et Données de Test (Seed Data)](#-comptes-et-données-de-test-seed-data)
10. [Sauvegardes & Maintenance](#-sauvegardes--maintenance-mysql)

---

## 🌟 Présentation du Système

**Hotelia PMS** est une solution complète de gestion pour établissements hôteliers, résidences meublées et complexes touristiques combinant :
- **Hébergement Multi-modal** : Réservations classiques à la nuitée et formules courtes à l'heure (*Day-use* / passage) avec décompte temps réel.
- **Moteur Anti-Surbooking Strict** : Triggers SQL et contrôles applicatifs empêchant tout chevauchement de réservations sur une même chambre.
- **Planning Gantt & Calendrier Dynamique** : Vue visuelle interactive par chambre, étage et statut.
- **Module Restaurant & Bar (POS / Caisse)** : Plan de tables, prise de commandes, envoi en cuisine (KDS) et transfert de note sur la chambre.
- **Gestion des Stocks Multi-entrepôts** : Suivi des entrées/sorties et alertes de seuils critiques.
- **Gestion Fine des Utilisateurs & ACL** : Système RBAC avec filtrage dynamique des onglets et actions selon les permissions accordées.
- **Tableau de Bord & Analytics** : Taux d'occupation en temps réel, flux prévisionnel d'arrivées/départs avec graphiques Recharts.

---

## 🛠 Stack Technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Motion.
- **Backend / Serveur** : Node.js 20+, Express.js, TypeScript (`tsx`).
- **Base de Données** : MySQL 8.0+ (moteur InnoDB, encodage `utf8mb4_unicode_ci`) ou MariaDB 10.5+.
- **Rapports & Impressions** : jsPDF (génération factures A4 et tickets de caisse thermiques 80mm).

---

## 💻 Prérequis Système

Assurez-vous que les outils suivants sont installés sur votre machine ou serveur :

| Composant | Version minimale recommandée | Vérification |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (LTS recommandée) | `node -v` |
| **npm** ou **bun** | `npm >= 10.0` ou `bun >= 1.1` | `npm -v` ou `bun -v` |
| **MySQL Server** | `>= 8.0.0` (ou MariaDB `>= 10.5`) | `mysql --version` |
| **Git** | `>= 2.30` | `git --version` |

---

## 🚀 Installation Rapide

### 1. Cloner le projet
```bash
git clone <URL_DU_DEPOT> hotelia-bananeraie
cd hotelia-bananeraie
```

### 2. Installer les dépendances
Avec **npm** :
```bash
npm install
```
*Ou avec bun si disponible :*
```bash
bun install
```

---

## ⚙️ Configuration de l'Environnement (`.env`)

Copiez le fichier d'exemple pour créer votre configuration locale :

```bash
cp .env.example .env
```

Éditez ensuite le fichier `.env` avec vos paramètres réels :

```env
# ============================================================================
# CONFIGURATION HOTELIA PMS
# ============================================================================

# Port d'écoute du serveur web
PORT=3000

# Paramètres de connexion MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hotelia_db
DB_USER=root
DB_PASSWORD=VotreMotDePasseMySQL
DB_CHARSET=utf8mb4

# URL de l'application
APP_URL=http://localhost:3000

# Clé API Google Gemini (optionnel, pour fonctionnalités intelligentes)
GEMINI_API_KEY=votre_clef_gemini_api
```

---

## 🗄️ Déploiement de la Base de Données MySQL

Le script complet de création des tables, index, triggers et données initiales se trouve dans :  
📁 `scripts/schema_mysql.sql`

### Option A : Import direct en ligne de commande MySQL

C'est la méthode la plus rapide et la plus fiable.

1. **Créer la base et exécuter le script SQL en une seule commande** :
```bash
mysql -u root -p < scripts/schema_mysql.sql
```
*(Saisissez votre mot de passe MySQL root lorsque le terminal vous le demande)*.

2. **Vérifier l'importation** :
```bash
mysql -u root -p -e "USE hotelia_db; SHOW TABLES; SELECT id_chambre, numero, nom_coutumier, statut FROM chambres;"
```

---

### Option B : Déploiement rapide avec Docker

Si vous ne souhaitez pas installer MySQL localement, vous pouvez lancer une instance MySQL 8.0 dans un conteneur Docker :

1. **Démarrer le conteneur MySQL** :
```bash
docker run -d \
  --name hotelia-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=hotelia_db \
  mysql:8.0 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

2. **Injecter le schéma SQL dans le conteneur** :
```bash
docker exec -i hotelia-mysql mysql -u root -prootpassword hotelia_db < scripts/schema_mysql.sql
```

3. **Vérification** :
```bash
docker exec -it hotelia-mysql mysql -u root -prootpassword -e "USE hotelia_db; SELECT COUNT(*) AS total_chambres FROM chambres;"
```

---

### Option C : Import via phpMyAdmin ou DBeaver

1. Ouvrez votre outil graphique (**phpMyAdmin**, **MySQL Workbench**, **DBeaver**, **HeidiSQL**).
2. Connectez-vous à votre serveur MySQL.
3. Cliquez sur **Importer** (Import).
4. Sélectionnez le fichier `scripts/schema_mysql.sql`.
5. Assurez-vous que le jeu de caractères est défini sur `utf8mb4`.
6. Cliquez sur **Exécuter** (Go).

---

### Option D : Déploiement Cloud (VPS / Cloud SQL)

Pour un déploiement en production sur un serveur Ubuntu / Debian :

```bash
# 1. Mise à jour des paquets et installation de MySQL
sudo apt update && sudo apt install -y mysql-server

# 2. Sécurisation de l'installation MySQL
sudo mysql_secure_installation

# 3. Création de l'utilisateur dédié et de la base
sudo mysql -u root -p
```

Dans la console MySQL :
```sql
CREATE DATABASE hotelia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hotelia_prod'@'localhost' IDENTIFIED BY 'SuperMotDePasseFort2026!';
GRANT ALL PRIVILEGES ON hotelia_db.* TO 'hotelia_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Puis importez le schéma :
```bash
mysql -u hotelia_prod -p hotelia_db < scripts/schema_mysql.sql
```

---

## 🛡️ Architecture de la Base MySQL & Triggers Anti-Surbooking

### Schéma Relationnel Principal

```
  [hotels] 1───* [chambres] 1───* [reservations] *───1 [clients]
     │                 │                  │
     ├───* [utilisateurs]                 └───* [paiements_partiels]
     ├───* [types_chambre]
     ├───* [articles_stock] 1───* [lignes_commande_restaurant] *───1 [commandes_restaurant]
     └───* [audit_logs]
```

### Mécanisme Anti-Surbooking MySQL (Triggers)
Pour garantir l'impossibilité mathématique d'avoir deux clients dans la même chambre sur un même intervalle de temps, deux triggers MySQL natifs sont déployés :
- `trg_anti_surbooking_insert`
- `trg_anti_surbooking_update`

Ces triggers calculent les bornes temporelles exactes en combinant :
- Pour les **nuitées** : `date_debut` à `15:00:00` jusqu'à `date_fin` à `11:00:00`.
- Pour le **day-use** : `date_debut` + `heure_debut` jusqu'à `date_fin` + `heure_fin`.

Si une intersection temporelle est détectée sur une réservation active (`statut_reservation != 'annulee'`), le trigger lève une exception MySQL `SIGNAL SQLSTATE '45000'`, ce qui annule immédiatement la transaction et protège la base.

---

## 🏃 Lancement et Exécution

### Mode Développement
Lance le serveur de développement Vite avec rechargement instantané sur le port 3000 :
```bash
npm run dev
```
Accédez à l'application dans votre navigateur :  
👉 **http://localhost:3000**

### Compilation de Production
Génère les fichiers optimisés dans le dossier `dist/` :
```bash
npm run build
```

### Prévisualisation de Production
Permet de tester le build de production localement :
```bash
npm run preview
```

### Vérification TypeScript & Lint
Valide l'intégrité du typage et l'absence d'erreurs :
```bash
npm run lint
```

---

## 👥 Comptes et Données de Test (Seed Data)

Le script `scripts/schema_mysql.sql` insère automatiquement les données de test représentatives de l'Hôtel Refuge Bananeraie :

### Comptes Back-Office

| Identifiant | Rôle | Accès & Permissions |
| :--- | :--- | :--- |
| `admin@bananeraie.ci` | **ADMINISTRATEUR** | Accès total : Hébergement, Restaurant, Caisse, Stock, Utilisateurs, Paramètres |
| `reception@bananeraie.ci` | **RECEPTIONNISTE** | Accès ciblé : Réservations, Planning Gantt, Calendrier, Caisse hébergement |
| `caisse.resto@bananeraie.ci` | **CAISSIER_RESTO** | Accès dédié : Prise de commandes restaurant, Caisse POS, Stock boissons & plats |

### Chambres Configurées

| N° Chambre | Nom Coutumier | Tarif Nuitée | Tarif Heure (Day-use) |
| :---: | :--- | :---: | :---: |
| **101** | Chambre Confort Éco Standard | 10 000 FCFA | 2 500 FCFA |
| **102** | Chambre Classique Supérieure | 13 000 FCFA | 2 500 FCFA |
| **103** | Chambre Deluxe Harmonie | 15 000 FCFA | 2 500 FCFA |
| **201** | Suite Exécutive Dekouassi | 20 000 FCFA | 2 500 FCFA |
| **202** | Suite Prestige Bananeraie | 22 000 FCFA | 2 500 FCFA |
| **301** | Suite Royale Panoramique VIP | 25 000 FCFA | 2 500 FCFA |

---

## 💾 Sauvegardes & Maintenance MySQL

### 1. Effectuer une sauvegarde complète (Dump)
```bash
mysqldump -u root -p \
  --routines --triggers --events \
  --single-transaction \
  hotelia_db > backup_hotelia_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Restaurer une sauvegarde
```bash
mysql -u root -p hotelia_db < backup_hotelia_20261102_120000.sql
```

### 3. Automatisation via Crontab (Optionnel sous Linux)
Pour sauvegarder la base tous les jours à 02h00 du matin :
```bash
0 2 * * * mysqldump -u root -p'VotreMotDePasse' --single-transaction --routines --triggers hotelia_db | gzip > /var/backups/mysql/hotelia_$(date +\%F).sql.gz
```

---

## 📂 Structure du Projet

```text
├── .env.example              # Gabarit des variables d'environnement
├── README.md                 # Documentation d'installation et d'exploitation
├── index.html                # Point d'entrée HTML
├── package.json              # Dépendances et scripts npm
├── scripts/
│   └── schema_mysql.sql      # Schéma DDL, Triggers et Seed Data MySQL 8.0+
├── src/
│   ├── App.tsx               # Orchestrateur principal de navigation
│   ├── components/
│   │   ├── AdminGanttDashboard.tsx   # Planning Gantt des chambres
│   │   ├── AntiOverbookingCode.tsx   # Visualiseur d'algorithmes de collision
│   │   ├── BoutiqueClientDashboard.tsx # Espace réservation client
│   │   ├── SqlViewer.tsx             # Explorateur SQL interactif
│   │   ├── backend/                  # Modules du Back-Office (Chambres, Caisse, Stock, Users)
│   │   └── frontend/                 # Vitrine publique et réservation
│   ├── data/
│   │   ├── initialData.ts            # Données initiales client
│   │   └── sqlScript.ts              # Références SQL & requêtes analytiques
│   └── types.ts                      # Interfaces et types TypeScript
└── vite.config.ts            # Configuration du bundler Vite
```

---

## 📞 Support & Assistance
- **Exploitant** : HÔTEL REFUGE BANANERAIE (Bongouanou, Côte d'Ivoire)
- **Groupe** : Dekouassi Holding
- **Système** : Hotelia PMS v2.4
