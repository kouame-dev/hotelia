export const ANTI_OVERBOOKING_SQL = `-- ============================================================================
-- SCRIPT POSTGRESQL OPTIMISÉ : PRÉVENTION ABSOLUE DU SURBOOKING (ANTI-OVERBOOKING)
-- Solution d'élite : Contrainte d'Exclusion Native GiST + Plages Temporelles (tsrange)
-- Compatibilité : PostgreSQL 12, 13, 14, 15, 16
-- ============================================================================

-- 1. ACTIVATION DE L'EXTENSION GIST B-TREE
-- Indispensable pour combiner une clé d'égalité (= sur id_chambre) et un chevauchement (&& sur tsrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. CRÉATION DE LA TABLE AVEC COLONNE D'INTERVALLE DÉDIÉE
CREATE TABLE IF NOT EXISTS reservations_anti_surbooking (
    id_reservation SERIAL PRIMARY KEY,
    id_chambre INT NOT NULL REFERENCES chambres(id_chambre) ON DELETE RESTRICT,
    id_client INT NOT NULL REFERENCES clients(id_client) ON DELETE RESTRICT,
    type_reservation type_reservation_enum NOT NULL, -- 'nuit' ou 'heure'
    
    -- Plages brutes fournies par le client / l'interface
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    
    -- Plage temporelle exacte normalisée [timestamp_debut, timestamp_fin)
    periode_reservation tsrange NOT NULL,
    
    statut_reservation statut_reservation_enum NOT NULL DEFAULT 'confirmee',
    statut_paiement statut_paiement_enum NOT NULL DEFAULT 'en_attente',
    prix_total NUMERIC(10, 2) NOT NULL CHECK (prix_total >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- CONTRAINTE NATIVE D'EXCLUSION GIST (ANTI-SURBOOKING ABSOLU AU NIVEAU DU MOTEUR)
    -- Évite 100% des conditions de course (Race Conditions) sans verrou global de table
    CONSTRAINT uq_anti_surbooking_chambre EXCLUDE USING gist (
        id_chambre WITH =,
        periode_reservation WITH &&
    ) WHERE (statut_reservation != 'annulee')
);

-- ----------------------------------------------------------------------------
-- 3. TRIGGER DE POPULATION AUTOMATIQUE DE L'INTERVALLE TEMPOREL
-- Garantit que 'periode_reservation' est toujours cohérente et impossible à fausser
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_populate_periode_reservation()
RETURNS TRIGGER AS $$
DECLARE
    v_start TIMESTAMP;
    v_end TIMESTAMP;
BEGIN
    IF NEW.type_reservation = 'nuit' THEN
        -- Heures standards hôtelières : Check-in 15h00, Check-out 11h00
        v_start := NEW.date_debut + COALESCE(NEW.heure_debut, TIME '15:00:00');
        v_end   := NEW.date_fin   + COALESCE(NEW.heure_fin,   TIME '11:00:00');
        
        IF NEW.date_fin <= NEW.date_debut THEN
            RAISE EXCEPTION 'Pour une nuitée, date_fin doit être supérieure à date_debut'
                USING ERRCODE = '22000';
        END IF;
    ELSE
        -- Réservation à l'heure (Day-use) : créneau précis
        IF NEW.heure_debut IS NULL OR NEW.heure_fin IS NULL THEN
            RAISE EXCEPTION 'Pour une réservation à l''heure, heure_debut et heure_fin sont requises'
                USING ERRCODE = '22000';
        END IF;
        
        v_start := NEW.date_debut + NEW.heure_debut;
        v_end   := NEW.date_fin   + NEW.heure_fin;
        
        IF v_end <= v_start THEN
            RAISE EXCEPTION 'L''heure de fin (%) doit être postérieure à l''heure de début (%)'
                , NEW.heure_fin, NEW.heure_debut
                USING ERRCODE = '22000';
        END IF;
    END IF;

    -- Affectation de l'intervalle semi-ouvert canonique [start, end)
    NEW.periode_reservation := tsrange(v_start, v_end, '[)');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_reservation_range
    BEFORE INSERT OR UPDATE OF type_reservation, date_debut, date_fin, heure_debut, heure_fin
    ON reservations_anti_surbooking
    FOR EACH ROW
    EXECUTE FUNCTION trg_populate_periode_reservation();

-- ----------------------------------------------------------------------------
-- 4. INDEXATION STRATÉGIQUE HAUTE PERFORMANCE
-- ----------------------------------------------------------------------------

-- A. Index GiST composite pour accélérer la recherche des chambres libres
CREATE INDEX idx_gist_reservations_recherche 
    ON reservations_anti_surbooking USING gist (id_chambre, periode_reservation)
    WHERE statut_reservation != 'annulee';

-- B. Index B-tree sur les clés étrangères (crucial pour les jointures rapides)
CREATE INDEX idx_reservations_client_btree 
    ON reservations_anti_surbooking(id_client);

CREATE INDEX idx_reservations_chambre_btree 
    ON reservations_anti_surbooking(id_chambre);

-- C. Index B-tree sur la date pour les plannings et l'historique
CREATE INDEX idx_reservations_date_debut_btree 
    ON reservations_anti_surbooking(date_debut);

-- ----------------------------------------------------------------------------
-- 5. TRANSACTION TYPE AVEC CONTRÔLE DE CONCURRENCE (API BACKEND)
-- Exemple de requête de réservation protégée avec verrous optimisés
-- ----------------------------------------------------------------------------

-- Fonction de réservation atomique sécurisée
CREATE OR REPLACE FUNCTION reserver_chambre_securisee(
    p_id_client INT,
    p_id_chambre INT,
    p_type type_reservation_enum,
    p_date_debut DATE,
    p_date_fin DATE,
    p_heure_debut TIME DEFAULT NULL,
    p_heure_fin TIME DEFAULT NULL,
    p_prix_total NUMERIC DEFAULT 0.00
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
BEGIN
    -- Insertion directe : la contrainte GiST 'uq_anti_surbooking_chambre' 
    -- bloquera instantanément toute tentative concurrente avec l'erreur 23P01
    INSERT INTO reservations_anti_surbooking (
        id_client, id_chambre, type_reservation,
        date_debut, date_fin, heure_debut, heure_fin,
        prix_total, statut_reservation, statut_paiement
    ) VALUES (
        p_id_client, p_id_chambre, p_type,
        p_date_debut, p_date_fin, p_heure_debut, p_heure_fin,
        p_prix_total, 'confirmee', 'paye'
    )
    RETURNING id_reservation INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN exclusion_violation THEN
        RAISE EXCEPTION 'Surbooking détecté ! La chambre % est déjà occupée sur ce créneau.'
            USING ERRCODE = '23P01';
END;
$$ LANGUAGE plpgsql;
`;
