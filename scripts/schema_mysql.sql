-- ============================================================================
-- SCRIPT OFFICIEL DDL & DML MYSQL 8.0+ / MARIADB 10.5+
-- APPLICATION : HOTELIA PMS - HÔTEL REFUGE BANANERAIE (BONGOUANOU)
-- Modèle relationnel complet : Hébergement multi-modal (Nuitée & Day-Use),
-- Restauration / POS, Gestion des Stocks, Utilisateurs & Rôles ACL, Triggers Anti-Surbooking.
-- ============================================================================

-- 1. CRÉATION ET SÉLECTION DE LA BASE DE DONNÉES
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS hotelia_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hotelia_db;

-- Désactivation temporaire des contraintes de clés pour réinitialisation propre
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS paiements_partiels;
DROP TABLE IF EXISTS lignes_commande_restaurant;
DROP TABLE IF EXISTS commandes_restaurant;
DROP TABLE IF EXISTS mouvements_stock;
DROP TABLE IF EXISTS articles_stock;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS chambres;
DROP TABLE IF EXISTS types_chambre;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS hotels;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 2. TABLE DES HÔTELS / ÉTABLISSEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE hotels (
    id_hotel INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL COMMENT 'Nom commercial ou raison sociale',
    adresse TEXT NOT NULL COMMENT 'Adresse physique complète',
    ville VARCHAR(100) NOT NULL DEFAULT 'Bongouanou',
    pays VARCHAR(100) NOT NULL DEFAULT 'Côte d''Ivoire',
    telephone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    etoiles TINYINT UNSIGNED DEFAULT 3,
    devise VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entités hôtelières gérées par le PMS';

-- ----------------------------------------------------------------------------
-- 3. TABLE DES UTILISATEURS & PERMISSIONS (RBAC / ACL)
-- ----------------------------------------------------------------------------
CREATE TABLE utilisateurs (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    nom_complet VARCHAR(150) NOT NULL,
    identifiant VARCHAR(80) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'ADMINISTRATEUR',
        'DIRECTEUR',
        'RECEPTIONNISTE',
        'CAISSIER_RESTO',
        'SERVEUR',
        'GOUVERNANTE',
        'MAINTENANCE'
    ) NOT NULL DEFAULT 'RECEPTIONNISTE',
    permissions JSON NOT NULL COMMENT 'Grille dynamique des permissions granulaires (ACL)',
    statut ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif',
    dernier_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_utilisateurs_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLE DES TYPES DE CHAMBRES
-- ----------------------------------------------------------------------------
CREATE TABLE types_chambre (
    id_type INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    code_type VARCHAR(50) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    prix_nuit_defaut DECIMAL(12, 2) NOT NULL DEFAULT 15000.00,
    prix_heure_defaut DECIMAL(12, 2) NOT NULL DEFAULT 2500.00,
    capacite_personnes SMALLINT NOT NULL DEFAULT 2,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_types_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE,
    CONSTRAINT uq_hotel_code_type UNIQUE (id_hotel, code_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLE DES CHAMBRES PHYSIQUES
-- ----------------------------------------------------------------------------
CREATE TABLE chambres (
    id_chambre INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    id_type INT NULL,
    numero VARCHAR(20) NOT NULL,
    nom_coutumier VARCHAR(100) NOT NULL,
    etage TINYINT NOT NULL DEFAULT 1,
    statut ENUM('disponible', 'occupee', 'maintenance', 'nettoyage') NOT NULL DEFAULT 'disponible',
    prix_nuit DECIMAL(12, 2) NOT NULL,
    prix_heure DECIMAL(12, 2) NOT NULL,
    capacite SMALLINT NOT NULL DEFAULT 2,
    commodites JSON NULL COMMENT 'Liste des commodités : Wifi, Climatisation, Minibar, TV Canal+',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chambres_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE,
    CONSTRAINT fk_chambres_type FOREIGN KEY (id_type)
        REFERENCES types_chambre(id_type) ON DELETE SET NULL,
    CONSTRAINT uq_chambre_hotel_numero UNIQUE (id_hotel, numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLE DU FICHIER CLIENTS
-- ----------------------------------------------------------------------------
CREATE TABLE clients (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    nom_complet VARCHAR(150) NOT NULL,
    email VARCHAR(150) NULL,
    telephone VARCHAR(50) NOT NULL,
    numero_piece VARCHAR(100) NULL COMMENT 'CNI, Passeport ou Permis de conduire',
    nationalite VARCHAR(80) NOT NULL DEFAULT 'Ivoirienne',
    adresse TEXT NULL,
    est_vip BOOLEAN NOT NULL DEFAULT FALSE,
    notes_preferences TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLE DES RÉSERVATIONS MULTI-MODALES (NUITÉE & HEURE / DAY-USE)
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    id_client INT NOT NULL,
    id_chambre INT NOT NULL,
    code_reservation VARCHAR(30) NOT NULL UNIQUE,
    type_reservation ENUM('nuit', 'heure') NOT NULL DEFAULT 'nuit',
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME NULL,
    heure_fin TIME NULL,
    nombre_personnes SMALLINT NOT NULL DEFAULT 1,
    statut_reservation ENUM('confirmee', 'en_cours', 'terminee', 'annulee') NOT NULL DEFAULT 'confirmee',
    statut_paiement ENUM('en_attente', 'acompte', 'paye', 'rembourse', 'annule') NOT NULL DEFAULT 'en_attente',
    montant_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    montant_paye DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    reste_a_payer DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    mode_reglement VARCHAR(50) NOT NULL DEFAULT 'Especes' COMMENT 'Especes, Wave, Orange Money, Moov, MTN, CB, Virement',
    commentaires TEXT NULL,
    id_agent_createur INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_res_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE RESTRICT,
    CONSTRAINT fk_res_client FOREIGN KEY (id_client)
        REFERENCES clients(id_client) ON DELETE RESTRICT,
    CONSTRAINT fk_res_chambre FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre) ON DELETE RESTRICT,
    CONSTRAINT fk_res_agent FOREIGN KEY (id_agent_createur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,

    -- Cohérence temporelle
    CONSTRAINT chk_dates_ordre CHECK (date_fin >= date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLE DES PAIEMENTS ET ACOMPTES
-- ----------------------------------------------------------------------------
CREATE TABLE paiements_partiels (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_reservation INT NOT NULL,
    montant DECIMAL(12, 2) NOT NULL,
    mode_paiement VARCHAR(50) NOT NULL DEFAULT 'Especes',
    reference_transaction VARCHAR(100) NULL,
    date_paiement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recu_par INT NULL,
    commentaire VARCHAR(255) NULL,
    CONSTRAINT fk_paiement_reservation FOREIGN KEY (id_reservation)
        REFERENCES reservations(id_reservation) ON DELETE CASCADE,
    CONSTRAINT fk_paiement_agent FOREIGN KEY (recu_par)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLE DES ARTICLES DE RESTAURATION & DU STOCK
-- ----------------------------------------------------------------------------
CREATE TABLE articles_stock (
    id_article INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    code_article VARCHAR(50) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    categorie ENUM('restaurant', 'bar_boisson', 'snack', 'entretien', 'linge', 'autre') NOT NULL,
    prix_vente DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cout_achat DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    quantite_stock DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    seuil_alerte DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    unite_mesure VARCHAR(20) NOT NULL DEFAULT 'Unité',
    est_au_menu_restaurant BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE,
    CONSTRAINT uq_hotel_code_article UNIQUE (id_hotel, code_article)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLE DES COMMANDES RESTAURANT / ROOM SERVICE
-- ----------------------------------------------------------------------------
CREATE TABLE commandes_restaurant (
    id_commande INT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    id_reservation INT NULL COMMENT 'Liaison optionnelle vers chambre pour note globale',
    numero_table VARCHAR(30) NULL,
    nom_client VARCHAR(100) NULL,
    statut ENUM('en_attente', 'en_cuisine', 'prete', 'servie', 'encaissee', 'annulee') NOT NULL DEFAULT 'en_attente',
    montant_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    mode_reglement VARCHAR(50) NOT NULL DEFAULT 'Especes',
    id_serveur INT NULL,
    date_commande DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cmd_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE,
    CONSTRAINT fk_cmd_res FOREIGN KEY (id_reservation)
        REFERENCES reservations(id_reservation) ON DELETE SET NULL,
    CONSTRAINT fk_cmd_serveur FOREIGN KEY (id_serveur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lignes_commande_restaurant (
    id_ligne INT AUTO_INCREMENT PRIMARY KEY,
    id_commande INT NOT NULL,
    id_article INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(12, 2) NOT NULL,
    sous_total DECIMAL(12, 2) NOT NULL,
    instructions_cuisson VARCHAR(255) NULL,
    CONSTRAINT fk_ligne_commande FOREIGN KEY (id_commande)
        REFERENCES commandes_restaurant(id_commande) ON DELETE CASCADE,
    CONSTRAINT fk_ligne_article FOREIGN KEY (id_article)
        REFERENCES articles_stock(id_article) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. JOURNAL D'AUDIT SÉCURISÉ (AUDIT LOGS)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_hotel INT NOT NULL,
    id_utilisateur INT NULL,
    action VARCHAR(100) NOT NULL,
    table_affectee VARCHAR(50) NOT NULL,
    id_entite VARCHAR(50) NULL,
    details_json JSON NULL,
    adresse_ip VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. TRIGGERS MÉTIER MYSQL : ANTI-SURBOOKING & INTÉGRITÉ FINANCIÈRE
-- ============================================================================

DELIMITER //

-- ----------------------------------------------------------------------------
-- TRIGGER 1 : Calcul automatique de prix & du reste à payer avant INSERT
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_reservation_before_insert
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
    DECLARE v_px_nuit DECIMAL(12, 2);
    DECLARE v_px_heure DECIMAL(12, 2);
    DECLARE v_diff_jours INT;
    DECLARE v_diff_heures DECIMAL(6, 2);

    -- Récupération des tarifs de la chambre
    SELECT prix_nuit, prix_heure INTO v_px_nuit, v_px_heure
    FROM chambres
    WHERE id_chambre = NEW.id_chambre;

    -- Si montant_total non renseigné ou égal à 0, calcul automatique
    IF NEW.montant_total IS NULL OR NEW.montant_total <= 0 THEN
        IF NEW.type_reservation = 'nuit' THEN
            SET v_diff_jours = DATEDIFF(NEW.date_fin, NEW.date_debut);
            IF v_diff_jours <= 0 THEN
                SET v_diff_jours = 1;
            END IF;
            SET NEW.montant_total = v_diff_jours * v_px_nuit;
        ELSE
            -- Calcul en heures pour les créneaux day-use
            SET v_diff_heures = TIME_TO_SEC(TIMEDIFF(
                TIMESTAMP(NEW.date_fin, COALESCE(NEW.heure_fin, '23:59:59')),
                TIMESTAMP(NEW.date_debut, COALESCE(NEW.heure_debut, '00:00:00'))
            )) / 3600.0;
            IF v_diff_heures <= 0 THEN
                SET v_diff_heures = 1;
            END IF;
            SET NEW.montant_total = CEILING(v_diff_heures) * v_px_heure;
        END IF;
    END IF;

    -- Calcul du reste à payer
    SET NEW.reste_a_payer = GREATEST(0.00, NEW.montant_total - NEW.montant_paye);

    -- Ajustement statut paiement
    IF NEW.montant_paye >= NEW.montant_total AND NEW.montant_total > 0 THEN
        SET NEW.statut_paiement = 'paye';
    ELSEIF NEW.montant_paye > 0 THEN
        SET NEW.statut_paiement = 'acompte';
    END IF;
END;
//

-- ----------------------------------------------------------------------------
-- TRIGGER 2 : Anti-surbooking strict à l'INSERT
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_anti_surbooking_insert
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
    DECLARE v_conflits INT DEFAULT 0;
    DECLARE v_new_start DATETIME;
    DECLARE v_new_end DATETIME;

    IF NEW.statut_reservation != 'annulee' THEN
        -- Calcul des bornes temporelles exactes de la nouvelle réservation
        IF NEW.type_reservation = 'nuit' THEN
            SET v_new_start = TIMESTAMP(NEW.date_debut, COALESCE(NEW.heure_debut, '15:00:00'));
            SET v_new_end   = TIMESTAMP(NEW.date_fin,   COALESCE(NEW.heure_fin,   '11:00:00'));
        ELSE
            SET v_new_start = TIMESTAMP(NEW.date_debut, COALESCE(NEW.heure_debut, '00:00:00'));
            SET v_new_end   = TIMESTAMP(NEW.date_fin,   COALESCE(NEW.heure_fin,   '23:59:59'));
        END IF;

        -- Recherche de collision temporelle avec une réservation active existante
        SELECT COUNT(*) INTO v_conflits
        FROM reservations r
        WHERE r.id_chambre = NEW.id_chambre
          AND r.statut_reservation != 'annulee'
          AND (
              v_new_start < (CASE 
                  WHEN r.type_reservation = 'nuit' THEN TIMESTAMP(r.date_fin, COALESCE(r.heure_fin, '11:00:00'))
                  ELSE TIMESTAMP(r.date_fin, COALESCE(r.heure_fin, '23:59:59'))
              END)
              AND
              v_new_end > (CASE 
                  WHEN r.type_reservation = 'nuit' THEN TIMESTAMP(r.date_debut, COALESCE(r.heure_debut, '15:00:00'))
                  ELSE TIMESTAMP(r.date_debut, COALESCE(r.heure_debut, '00:00:00'))
              END)
          );

        IF v_conflits > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'CONFLIT ANTI-SURBOOKING : La chambre demandée est déjà occupée ou réservée sur ce créneau horaire/date.';
        END IF;
    END IF;
END;
//

-- ----------------------------------------------------------------------------
-- TRIGGER 3 : Anti-surbooking strict à l'UPDATE
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_anti_surbooking_update
BEFORE UPDATE ON reservations
FOR EACH ROW
BEGIN
    DECLARE v_conflits INT DEFAULT 0;
    DECLARE v_new_start DATETIME;
    DECLARE v_new_end DATETIME;

    -- Mise à jour du reste à payer
    SET NEW.reste_a_payer = GREATEST(0.00, NEW.montant_total - NEW.montant_paye);
    IF NEW.montant_paye >= NEW.montant_total AND NEW.montant_total > 0 THEN
        SET NEW.statut_paiement = 'paye';
    ELSEIF NEW.montant_paye > 0 THEN
        SET NEW.statut_paiement = 'acompte';
    END IF;

    IF NEW.statut_reservation != 'annulee' THEN
        IF NEW.type_reservation = 'nuit' THEN
            SET v_new_start = TIMESTAMP(NEW.date_debut, COALESCE(NEW.heure_debut, '15:00:00'));
            SET v_new_end   = TIMESTAMP(NEW.date_fin,   COALESCE(NEW.heure_fin,   '11:00:00'));
        ELSE
            SET v_new_start = TIMESTAMP(NEW.date_debut, COALESCE(NEW.heure_debut, '00:00:00'));
            SET v_new_end   = TIMESTAMP(NEW.date_fin,   COALESCE(NEW.heure_fin,   '23:59:59'));
        END IF;

        SELECT COUNT(*) INTO v_conflits
        FROM reservations r
        WHERE r.id_chambre = NEW.id_chambre
          AND r.id_reservation != NEW.id_reservation
          AND r.statut_reservation != 'annulee'
          AND (
              v_new_start < (CASE 
                  WHEN r.type_reservation = 'nuit' THEN TIMESTAMP(r.date_fin, COALESCE(r.heure_fin, '11:00:00'))
                  ELSE TIMESTAMP(r.date_fin, COALESCE(r.heure_fin, '23:59:59'))
              END)
              AND
              v_new_end > (CASE 
                  WHEN r.type_reservation = 'nuit' THEN TIMESTAMP(r.date_debut, COALESCE(r.heure_debut, '15:00:00'))
                  ELSE TIMESTAMP(r.date_debut, COALESCE(r.heure_debut, '00:00:00'))
              END)
          );

        IF v_conflits > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'CONFLIT ANTI-SURBOOKING : Modification impossible car la chambre est occupée par une autre réservation active.';
        END IF;
    END IF;
END;
//

DELIMITER ;

-- ============================================================================
-- 13. INDEX DE HAUTE PERFORMANCE
-- ============================================================================
CREATE INDEX idx_chambres_statut ON chambres(statut);
CREATE INDEX idx_chambres_etage ON chambres(etage);
CREATE INDEX idx_reservations_dates ON reservations(date_debut, date_fin);
CREATE INDEX idx_reservations_statut ON reservations(statut_reservation);
CREATE INDEX idx_reservations_paiement ON reservations(statut_paiement);
CREATE INDEX idx_reservations_client ON reservations(id_client);
CREATE INDEX idx_reservations_chambre ON reservations(id_chambre);
CREATE INDEX idx_articles_categorie ON articles_stock(categorie);
CREATE INDEX idx_commandes_statut ON commandes_restaurant(statut);

-- ============================================================================
-- 14. VUES MÉTIER POUR TABLEAUX DE BORD & RAPPORTS
-- ============================================================================

-- Vue A : Planning détaillé des réservations avec noms clients et chambres
CREATE OR REPLACE VIEW v_reservations_detaillees AS
SELECT 
    r.id_reservation,
    r.code_reservation,
    h.nom AS hotel_nom,
    c.numero AS chambre_numero,
    c.nom_coutumier AS chambre_nom,
    cl.nom_complet AS client_nom,
    cl.telephone AS client_telephone,
    r.type_reservation,
    r.date_debut,
    r.date_fin,
    r.heure_debut,
    r.heure_fin,
    r.statut_reservation,
    r.statut_paiement,
    r.montant_total,
    r.montant_paye,
    r.reste_a_payer,
    r.mode_reglement,
    r.created_at AS date_creation
FROM reservations r
JOIN chambres c ON r.id_chambre = c.id_chambre
JOIN hotels h ON r.id_hotel = h.id_hotel
JOIN clients cl ON r.id_client = cl.id_client;

-- Vue B : Synthèse du taux d'occupation des chambres
CREATE OR REPLACE VIEW v_taux_occupation_chambres AS
SELECT 
    c.id_chambre,
    c.numero,
    c.nom_coutumier,
    c.statut,
    c.prix_nuit,
    c.prix_heure,
    COUNT(r.id_reservation) AS total_reservations_actives
FROM chambres c
LEFT JOIN reservations r ON c.id_chambre = r.id_chambre 
    AND r.statut_reservation IN ('confirmee', 'en_cours')
    AND CURRENT_DATE BETWEEN r.date_debut AND r.date_fin
GROUP BY c.id_chambre, c.numero, c.nom_coutumier, c.statut, c.prix_nuit, c.prix_heure;

-- ============================================================================
-- 15. JEU DE DONNÉES INITIAL (SEED DATA RÉALISTE)
-- ============================================================================

-- 1. Établissement officiel
INSERT INTO hotels (id_hotel, nom, adresse, ville, pays, telephone, email, etoiles, devise) VALUES
(1, 'Hôtel Refuge Bananeraie', 'Quartier Résidentiel, Route Principale', 'Bongouanou', 'Côte d''Ivoire', '+225 07 00 00 00 00', 'contact@hotelrefuge.ci', 4, 'FCFA');

-- 2. Types de chambres
INSERT INTO types_chambre (id_type, id_hotel, code_type, libelle, prix_nuit_defaut, prix_heure_defaut, capacite_personnes, description) VALUES
(1, 1, 'STD', 'Confort Éco Standard', 10000.00, 2500.00, 2, 'Chambre fonctionnelle, lit double, climatisation, écran plat.'),
(2, 1, 'SUP', 'Classique Supérieure', 13000.00, 2500.00, 2, 'Espace généreux, bureau, douche à l''italienne, wifi haut débit.'),
(3, 1, 'DLX', 'Deluxe Harmonie', 15000.00, 2500.00, 2, 'Finitions soignées, literie premium, coin salon, minibar.'),
(4, 1, 'EXE', 'Suite Exécutive Dekouassi', 20000.00, 2500.00, 3, 'Salon séparé, canapé-lit, terrasse avec vue panoramique.'),
(5, 1, 'PRE', 'Suite Prestige Bananeraie', 22000.00, 2500.00, 3, 'Prestige et grand confort, baignoire balnéo, service VIP.'),
(6, 1, 'VIP', 'Suite Royale Panoramique VIP', 25000.00, 2500.00, 4, 'La plus prestigieuse de l''établissement avec terrasse d''angle et vue 360.');

-- 3. Chambres réelles
INSERT INTO chambres (id_chambre, id_hotel, id_type, numero, nom_coutumier, etage, statut, prix_nuit, prix_heure, capacite) VALUES
(1, 1, 1, '101', 'Chambre Confort Éco Standard', 1, 'disponible', 10000.00, 2500.00, 2),
(2, 1, 2, '102', 'Chambre Classique Supérieure', 1, 'disponible', 13000.00, 2500.00, 2),
(3, 1, 3, '103', 'Chambre Deluxe Harmonie', 1, 'disponible', 15000.00, 2500.00, 2),
(4, 1, 4, '201', 'Suite Exécutive Dekouassi', 2, 'disponible', 20000.00, 2500.00, 3),
(5, 1, 5, '202', 'Suite Prestige Bananeraie', 2, 'disponible', 22000.00, 2500.00, 3),
(6, 1, 6, '301', 'Suite Royale Panoramique VIP', 3, 'disponible', 25000.00, 2500.00, 4);

-- 4. Comptes Utilisateurs Back-Office (avec grille ACL)
INSERT INTO utilisateurs (id_utilisateur, id_hotel, nom_complet, identifiant, mot_de_passe_hash, role, permissions, statut) VALUES
(1, 1, 'Direction Dekouassi', 'admin@bananeraie.ci', '$2a$12$e80yq9gq7aZkFm2J...hashedPasswordExample', 'ADMINISTRATEUR', 
 '{"hebergement": true, "reservations": true, "restaurant": true, "caisse": true, "stock": true, "utilisateurs": true, "gantt": true, "calendrier": true, "statistiques": true, "parametres": true}', 'actif'),
(2, 1, 'Réceptionniste Chef', 'reception@bananeraie.ci', '$2a$12$e80yq9gq7aZkFm2J...hashedPasswordExample', 'RECEPTIONNISTE', 
 '{"hebergement": true, "reservations": true, "restaurant": false, "caisse": true, "stock": false, "utilisateurs": false, "gantt": true, "calendrier": true, "statistiques": false, "parametres": false}', 'actif'),
(3, 1, 'Responsable Restaurant & Bar', 'caisse.resto@bananeraie.ci', '$2a$12$e80yq9gq7aZkFm2J...hashedPasswordExample', 'CAISSIER_RESTO', 
 '{"hebergement": false, "reservations": false, "restaurant": true, "caisse": true, "stock": true, "utilisateurs": false, "gantt": false, "calendrier": false, "statistiques": false, "parametres": false}', 'actif');

-- 5. Fichier Clients
INSERT INTO clients (id_client, nom_complet, email, telephone, numero_piece, nationalite, est_vip) VALUES
(1, 'Kouassi Jean-Marc', 'jm.kouassi@holding.ci', '+225 07 12 34 56 78', 'CI-ABJ-2022-9874', 'Ivoirienne', TRUE),
(2, 'Touré Aïcha', 'aicha.toure@consulting.ci', '+225 05 98 76 54 32', 'CI-BOU-2023-4512', 'Ivoirienne', FALSE),
(3, 'Yao Franck Olivier', 'f.yao@agrobiz.ci', '+225 01 55 44 33 22', 'CI-BON-2021-3321', 'Ivoirienne', TRUE);

-- 6. Articles du Stock et de Restauration
INSERT INTO articles_stock (id_hotel, code_article, designation, categorie, prix_vente, cout_achat, quantite_stock, seuil_alerte) VALUES
(1, 'BOIS-001', 'Bière Bock 65cl', 'bar_boisson', 1200.00, 800.00, 48.00, 12.00),
(1, 'BOIS-002', 'Eau Minérale Céleste 1.5L', 'bar_boisson', 1000.00, 500.00, 72.00, 24.00),
(1, 'BOIS-003', 'Vin Rouge Bordeaux Grand Cru', 'bar_boisson', 18000.00, 11000.00, 15.00, 5.00),
(1, 'PLAT-001', 'Poulet Braisé Kédjenou', 'restaurant', 6500.00, 3500.00, 20.00, 5.00),
(1, 'PLAT-002', 'Poisson Carpe Braisée Bananeraie', 'restaurant', 7000.00, 4000.00, 18.00, 4.00),
(1, 'PLAT-003', 'Alloco & Brochettes de Mérou', 'restaurant', 4000.00, 2000.00, 30.00, 6.00);

-- 7. Réservations initiales de démonstration
INSERT INTO reservations (id_hotel, id_client, id_chambre, code_reservation, type_reservation, date_debut, date_fin, heure_debut, heure_fin, statut_reservation, statut_paiement, montant_total, montant_paye, mode_reglement) VALUES
(1, 1, 1, 'RES-BAN-001', 'nuit', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00:00', '11:00:00', 'en_cours', 'paye', 20000.00, 2000.00, 'Wave'),
(1, 2, 4, 'RES-BAN-002', 'nuit', DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), '15:00:00', '11:00:00', 'confirmee', 'acompte', 60000.00, 30000.00, 'Orange Money'),
(1, 3, 3, 'RES-BAN-003', 'heure', CURDATE(), CURDATE(), '13:00:00', '17:00:00', 'terminee', 'paye', 10000.00, 10000.00, 'Especes');

-- ============================================================================
-- FIN DU SCRIPT MYSQL OFFICIEL HOTELIA PMS
-- ============================================================================
