export const POSTGRES_FULL_SCRIPT = `-- ============================================================================
-- SCRIPT D'ARCHITECTURE POSTGRESQL : GESTION HÔTELIÈRE MULTI-MODALE
-- Réservations à la nuitée et à l'heure (Day-use / Hourly Booking)
-- Auteur : Architecte Base de Données Senior
-- Version : 1.2 (PostgreSQL 14+)
-- ============================================================================

-- 0. PRÉREQUIS & EXTENSIONS
-- L'extension btree_gist permet les contraintes d'exclusion temporelles (anti-chevauchement)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Nettoyage préventif si réinitialisation
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS chambres CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

DROP TYPE IF EXISTS type_reservation_enum CASCADE;
DROP TYPE IF EXISTS statut_chambre_enum CASCADE;
DROP TYPE IF EXISTS statut_paiement_enum CASCADE;
DROP TYPE IF EXISTS statut_reservation_enum CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TYPES ÉNUMÉRÉS (ENUMS)
-- ----------------------------------------------------------------------------

-- Type de réservation : à la nuitée classique ou à l'heure (créneau court / day-use)
CREATE TYPE type_reservation_enum AS ENUM ('nuit', 'heure');

-- Statut opérationnel de la chambre
CREATE TYPE statut_chambre_enum AS ENUM ('disponible', 'occupee', 'maintenance', 'nettoyage');

-- Statut financier de la réservation
CREATE TYPE statut_paiement_enum AS ENUM ('en_attente', 'paye', 'annule', 'rembourse');

-- Statut du cycle de vie de la réservation
CREATE TYPE statut_reservation_enum AS ENUM ('confirmee', 'en_cours', 'terminee', 'annulee');

-- ----------------------------------------------------------------------------
-- 2. TABLE DES HÔTELS
-- Entité racine regroupant les établissements hôteliers
-- ----------------------------------------------------------------------------
CREATE TABLE hotels (
    id_hotel SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    adresse TEXT NOT NULL,
    telephone VARCHAR(30),
    email VARCHAR(150),
    etoiles SMALLINT CHECK (etoiles BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE hotels IS 'Établissements hôteliers gérés par la plateforme';
COMMENT ON COLUMN hotels.nom IS 'Raison sociale ou nom commercial de l''hôtel';
COMMENT ON COLUMN hotels.adresse IS 'Adresse physique complète';

-- ----------------------------------------------------------------------------
-- 3. TABLE DES CHAMBRES
-- Unités louables rattachées à un hôtel avec tarification double (nuitée & heure)
-- ----------------------------------------------------------------------------
CREATE TABLE chambres (
    id_chambre SERIAL PRIMARY KEY,
    id_hotel INT NOT NULL,
    numero VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Ex: 'Standard', 'Deluxe', 'Suite Exécutive'
    statut statut_chambre_enum NOT NULL DEFAULT 'disponible',
    prix_nuit NUMERIC(10, 2) NOT NULL CHECK (prix_nuit >= 0.00),
    prix_heure NUMERIC(10, 2) NOT NULL CHECK (prix_heure >= 0.00),
    capacite SMALLINT NOT NULL DEFAULT 2 CHECK (capacite > 0),
    etage SMALLINT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Clé étrangère vers l'hôtel
    CONSTRAINT fk_chambres_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotels(id_hotel)
        ON DELETE CASCADE,

    -- Unicité du numéro de chambre par hôtel
    CONSTRAINT uq_chambre_hotel_numero UNIQUE (id_hotel, numero)
);

COMMENT ON TABLE chambres IS 'Chambres disponibles avec double grille tarifaire nuitée / heure';
COMMENT ON COLUMN chambres.prix_nuit IS 'Tarif d''une nuitée en devise locale';
COMMENT ON COLUMN chambres.prix_heure IS 'Tarif horaire pour créneaux day-use';

-- ----------------------------------------------------------------------------
-- 4. TABLE DES CLIENTS
-- Informations des clients effectuant les réservations
-- ----------------------------------------------------------------------------
CREATE TABLE clients (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clients IS 'Fichier clients avec coordonnées uniques de contact';
COMMENT ON COLUMN clients.email IS 'Adresse courriel unique servant d''identifiant de contact';

-- ----------------------------------------------------------------------------
-- 5. TABLE DES RÉSERVATIONS
-- Cœur transactionnel gérant les deux modes temporels : nuitée et heure
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    id_reservation SERIAL PRIMARY KEY,
    id_client INT NOT NULL,
    id_chambre INT NOT NULL,
    type_reservation type_reservation_enum NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    statut_paiement statut_paiement_enum NOT NULL DEFAULT 'en_attente',
    statut_reservation statut_reservation_enum NOT NULL DEFAULT 'confirmee',
    prix_total NUMERIC(10, 2) NOT NULL CHECK (prix_total >= 0.00),
    commentaires TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Clés étrangères avec sécurité d'intégrité (RESTRICT pour empêcher suppression accidentelle)
    CONSTRAINT fk_reservations_client FOREIGN KEY (id_client)
        REFERENCES clients(id_client)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reservations_chambre FOREIGN KEY (id_chambre)
        REFERENCES chambres(id_chambre)
        ON DELETE RESTRICT,

    -- ------------------------------------------------------------------------
    -- CONTRAINTE MÉTIER 1 : Cohérence temporelle selon le type de réservation
    -- ------------------------------------------------------------------------
    CONSTRAINT chk_coherence_dates_heures CHECK (
        -- Cas A : Réservation à la nuitée
        (
            type_reservation = 'nuit'
            AND date_fin > date_debut
            -- Les heures sont optionnelles ou représentent les heures de check-in / check-out
        )
        OR
        -- Cas B : Réservation à l'heure (créneau court / journée)
        (
            type_reservation = 'heure'
            AND heure_debut IS NOT NULL
            AND heure_fin IS NOT NULL
            AND (
                -- Créneau sur la même journée : heure_fin doit être postérieure à heure_debut
                (date_fin = date_debut AND heure_fin > heure_debut)
                OR
                -- Créneau nocturne à cheval sur minuit : date_fin = date_debut + 1 jour
                (date_fin = date_debut + 1)
            )
        )
    )
);

COMMENT ON TABLE reservations IS 'Réservations hybrides : séjours à la nuitée ou créneaux horaires';

-- ----------------------------------------------------------------------------
-- 6. FONCTION DE CALCUL D'HORODATAGE COMPLET (TIMESTAMP INTERVAL)
-- Convertit (date, heure) en TIMESTAMPTZ absolu pour chaque réservation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_reservation_range(
    p_type type_reservation_enum,
    p_date_debut DATE,
    p_date_fin DATE,
    p_heure_debut TIME,
    p_heure_fin TIME
) RETURNS tsrange AS $$
DECLARE
    v_start TIMESTAMP;
    v_end TIMESTAMP;
BEGIN
    IF p_type = 'nuit' THEN
        -- Heure standard de check-in nuitée : 15:00, check-out : 11:00
        v_start := p_date_debut + COALESCE(p_heure_debut, TIME '15:00:00');
        v_end   := p_date_fin   + COALESCE(p_heure_fin,   TIME '11:00:00');
    ELSE
        -- Réservation à l'heure : heures exactes requises
        v_start := p_date_debut + p_heure_debut;
        v_end   := p_date_fin   + p_heure_fin;
    END IF;

    -- Intervalle semi-ouvert [start, end)
    RETURN tsrange(v_start, v_end, '[)');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 7. VÉRIFICATION D'ANTI-CHEVAUCHEMENT (COLLISION PREVENTION)
-- Empêche qu'une chambre soit louée deux fois sur le même intervalle
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_check_reservation_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_nouveau_range tsrange;
    v_collision_id INT;
BEGIN
    -- Ne pas vérifier les réservations annulées
    IF NEW.statut_reservation = 'annulee' THEN
        RETURN NEW;
    END IF;

    -- Calculer la plage temporelle de la nouvelle réservation
    v_nouveau_range := get_reservation_range(
        NEW.type_reservation,
        NEW.date_debut,
        NEW.date_fin,
        NEW.heure_debut,
        NEW.heure_fin
    );

    -- Recherche de conflit avec une réservation active existante sur la même chambre
    SELECT r.id_reservation INTO v_collision_id
    FROM reservations r
    WHERE r.id_chambre = NEW.id_chambre
      AND r.id_reservation != COALESCE(NEW.id_reservation, -1)
      AND r.statut_reservation != 'annulee'
      AND v_nouveau_range && get_reservation_range(
          r.type_reservation,
          r.date_debut,
          r.date_fin,
          r.heure_debut,
          r.heure_fin
      )
    LIMIT 1;

    IF v_collision_id IS NOT NULL THEN
        RAISE EXCEPTION 'Conflit de réservation pour la chambre % : chevauchement avec la réservation active #%',
            NEW.id_chambre, v_collision_id
            USING ERRCODE = '23P01'; -- exclusion_violation
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_reservation_overlap
    BEFORE INSERT OR UPDATE OF id_chambre, date_debut, date_fin, heure_debut, heure_fin, statut_reservation
    ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_reservation_overlap();

-- ----------------------------------------------------------------------------
-- 8. TRIGGER DE CALCUL AUTOMATIQUE DU PRIX TOTAL (OPTIONNEL / SÉCURISANT)
-- Assure la conformité financière selon la durée et les tarifs de la chambre
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_calculate_reservation_price()
RETURNS TRIGGER AS $$
DECLARE
    v_prix_nuit NUMERIC(10, 2);
    v_prix_heure NUMERIC(10, 2);
    v_nb_nuits INT;
    v_nb_heures NUMERIC(5, 2);
BEGIN
    -- Récupération des tarifs de la chambre sélectionnée
    SELECT prix_nuit, prix_heure INTO v_prix_nuit, v_prix_heure
    FROM chambres
    WHERE id_chambre = NEW.id_chambre;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Chambre introuvable ID %', NEW.id_chambre;
    END IF;

    -- Si prix_total n'est pas renseigné ou égal à 0, calcul automatique :
    IF NEW.prix_total IS NULL OR NEW.prix_total = 0 THEN
        IF NEW.type_reservation = 'nuit' THEN
            v_nb_nuits := NEW.date_fin - NEW.date_debut;
            NEW.prix_total := v_nb_nuits * v_prix_nuit;
        ELSE
            -- Calcul de la durée en heures décimales
            v_nb_heures := EXTRACT(EPOCH FROM (
                (NEW.date_fin + NEW.heure_fin) - (NEW.date_debut + NEW.heure_debut)
            )) / 3600.0;
            
            -- Facturation au prorata horaire ou arrondie au supérieur
            NEW.prix_total := CEIL(v_nb_heures) * v_prix_heure;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_calculate_price
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trg_calculate_reservation_price();

-- ----------------------------------------------------------------------------
-- 9. INDEX DE PERFORMANCE
-- Optimisés pour les recherches fréquentes, filtrages et clés étrangères
-- ----------------------------------------------------------------------------

-- Index sur clés étrangères pour des jointures ultra-rapides
CREATE INDEX idx_chambres_id_hotel ON chambres(id_hotel);
CREATE INDEX idx_reservations_id_client ON reservations(id_client);
CREATE INDEX idx_reservations_id_chambre ON reservations(id_chambre);

-- Index composite pour la recherche de réservations par date et statut
CREATE INDEX idx_reservations_dates ON reservations(date_debut, date_fin);
CREATE INDEX idx_reservations_statut ON reservations(statut_reservation);

-- Index partiel pour les réservations actives en cours ou à venir
CREATE INDEX idx_reservations_actives ON reservations(id_chambre, date_debut, date_fin)
WHERE statut_reservation IN ('confirmee', 'en_cours');

-- ----------------------------------------------------------------------------
-- 10. VUE MÉTIER : PLANNING & DÉTAILS DES RÉSERVATIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_reservations_detaillees AS
SELECT 
    r.id_reservation,
    h.nom AS hotel_nom,
    c.numero AS chambre_numero,
    c.type AS chambre_type,
    cl.nom AS client_nom,
    cl.email AS client_email,
    cl.telephone AS client_telephone,
    r.type_reservation,
    r.date_debut,
    r.date_fin,
    r.heure_debut,
    r.heure_fin,
    r.statut_paiement,
    r.statut_reservation,
    r.prix_total,
    r.created_at AS date_creation
FROM reservations r
JOIN chambres c ON r.id_chambre = c.id_chambre
JOIN hotels h ON c.id_hotel = h.id_hotel
JOIN clients cl ON r.id_client = cl.id_client;

-- ----------------------------------------------------------------------------
-- 11. JEU DE DONNÉES DE TEST (SEED DATA)
-- ----------------------------------------------------------------------------

-- A. Insertion d'hôtels
INSERT INTO hotels (nom, adresse, telephone, email, etoiles) VALUES
('Hôtel Le Grand Marais', '14 Rue de Rivoli, 75004 Paris', '+33 1 42 68 00 01', 'contact@grandmarais.fr', 4),
('Azur Palace & Spa', '28 Promenade des Anglais, 06000 Nice', '+33 4 93 16 00 02', 'booking@azurpalace.fr', 5);

-- B. Insertion de chambres avec tarifs Nuit & Heure
INSERT INTO chambres (id_hotel, numero, type, statut, prix_nuit, prix_heure, capacite, etage) VALUES
(1, '101', 'Standard Double', 'disponible', 120.00, 30.00, 2, 1),
(1, '102', 'Deluxe Balcon', 'disponible', 180.00, 45.00, 2, 1),
(1, '201', 'Suite Junior Day-Use', 'disponible', 240.00, 60.00, 3, 2),
(2, 'A10', 'Chambre Vue Mer', 'disponible', 210.00, 50.00, 2, 1),
(2, 'A11', 'Suite Prestige', 'disponible', 380.00, 95.00, 4, 1);

-- C. Insertion de clients
INSERT INTO clients (nom, email, telephone) VALUES
('Jean Dupont', 'jean.dupont@email.com', '+33 6 12 34 56 78'),
('Sophie Martin', 'sophie.martin@pro-consulting.fr', '+33 6 98 76 54 32'),
('Alexandre Chen', 'alex.chen@techglobal.com', '+33 7 45 67 89 01'),
('Fatou Diop', 'fatou.diop@afrique-art.org', '+33 6 55 44 33 22');

-- D. Insertion de réservations (Nuitées et À l'heure)
INSERT INTO reservations 
(id_client, id_chambre, type_reservation, date_debut, date_fin, heure_debut, heure_fin, statut_paiement, statut_reservation, prix_total) 
VALUES
-- 1. Réservation classique de 2 nuitées
(1, 1, 'nuit', CURRENT_DATE + 1, CURRENT_DATE + 3, '15:00:00', '11:00:00', 'paye', 'confirmee', 240.00),

-- 2. Réservation à l'heure (Day-use professionnel de 14h à 18h)
(2, 2, 'heure', CURRENT_DATE, CURRENT_DATE, '14:00:00', '18:00:00', 'paye', 'confirmee', 180.00),

-- 3. Réservation à l'heure en matinée
(3, 3, 'heure', CURRENT_DATE + 4, CURRENT_DATE + 4, '09:00:00', '12:00:00', 'en_attente', 'confirmee', 180.00),

-- 4. Réservation longue durée à la nuitée (5 nuits)
(4, 4, 'nuit', CURRENT_DATE + 5, CURRENT_DATE + 10, '15:00:00', '11:00:00', 'paye', 'confirmee', 1050.00);

-- ============================================================================
-- FIN DU SCRIPT ARCHITECTE
-- ============================================================================
`;

export const SQL_QUERY_EXAMPLES = `-- ============================================================================
-- REQUÊTES TYPES UTILES EN GESTION HÔTELIÈRE
-- ============================================================================

-- 1. VÉRIFIER LA DISPONIBILITÉ D'UNE CHAMBRE POUR UN CRÉNEAU HORAIRE (DAY-USE)
SELECT c.id_chambre, c.numero, c.type, c.prix_heure
FROM chambres c
WHERE c.id_hotel = 1
  AND c.statut = 'disponible'
  AND NOT EXISTS (
      SELECT 1 
      FROM reservations r
      WHERE r.id_chambre = c.id_chambre
        AND r.statut_reservation != 'annulee'
        AND tsrange('2026-09-15 14:00:00', '2026-09-15 18:00:00', '[)') && 
            get_reservation_range(r.type_reservation, r.date_debut, r.date_fin, r.heure_debut, r.heure_fin)
  );

-- 2. CHIFFRE D'AFFAIRES PAR TYPE DE RÉSERVATION (NUITÉES VS HEURES)
SELECT 
    type_reservation,
    COUNT(id_reservation) AS nb_reservations,
    SUM(prix_total) AS total_chiffre_affaires,
    ROUND(AVG(prix_total), 2) AS panier_moyen
FROM reservations
WHERE statut_paiement = 'paye'
GROUP BY type_reservation;

-- 3. PLANNING DES RÉSERVATIONS DU JOUR DANS UN HÔTEL
SELECT 
    r.id_reservation,
    c.numero AS chambre,
    cl.nom AS client,
    r.type_reservation,
    r.heure_debut,
    r.heure_fin,
    r.statut_reservation
FROM reservations r
JOIN chambres c ON r.id_chambre = c.id_chambre
JOIN clients cl ON r.id_client = cl.id_client
WHERE c.id_hotel = 1
  AND CURRENT_DATE BETWEEN r.date_debut AND r.date_fin
ORDER BY c.numero, r.heure_debut;
`;
