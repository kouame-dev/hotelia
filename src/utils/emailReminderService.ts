import { ReservationItem, EmailReminderLog } from '../types.ts';

/**
 * Génère le modèle d'email de confirmation automatique 24h pour une réservation
 */
export function generateConfirmationEmail(
  reservation: ReservationItem,
  hotelConfig?: {
    appName?: string;
    hotelName?: string;
    brandSubtitle?: string;
    holdingName?: string;
    phone?: string;
    email?: string;
    address?: string;
    currency?: string;
  }
): { subject: string; textBody: string; htmlBody: string } {
  const hotelName = hotelConfig?.hotelName || hotelConfig?.appName || 'HOTELIA Resort & Suites';
  const holding = hotelConfig?.holdingName || 'DEKOUASSI HOLDING';
  const phone = hotelConfig?.phone || '+225 07 00 00 00 00';
  const emailContact = hotelConfig?.email || 'contact@hotelia.ci';
  const currency = hotelConfig?.currency || 'FCFA';

  const isDayUse = reservation.typeReservation === 'heure';
  const typeLabel = isDayUse ? 'Courte Durée (Day-Use en journée)' : 'Séjour Hôtelier (Nuitée)';
  const reference = `HTL-${reservation.id_reservation || reservation.id.replace('res-', '').slice(-6).toUpperCase()}`;

  const arrivalFormatted = isDayUse
    ? `Le ${reservation.dateDebut} de ${reservation.heureDebut || '10:00'} à ${reservation.heureFin || '14:00'}`
    : `Du ${reservation.dateDebut} (dès ${reservation.heureDebut || '14:00'}) au ${reservation.dateFin} (départ ${reservation.heureFin || '11:00'})`;

  const montantTotalFormatted = `${Number(reservation.montantTotal || 0).toLocaleString('fr-FR')} ${currency}`;
  const acompteFormatted = `${Number(reservation.acompteVerse || 0).toLocaleString('fr-FR')} ${currency}`;
  const resteFormatted = `${Number(reservation.resteAPayer || 0).toLocaleString('fr-FR')} ${currency}`;

  const subject = `Confirmation & Rappel de Séjour - Chambre ${reservation.chambreNumero} (Réf: ${reference}) • ${hotelName}`;

  const textBody = `
CHÈRE / CHER ${reservation.clientNom.toUpperCase()},

Nous vous confirmons avec plaisir votre réservation au sein de notre établissement ${hotelName} (${holding}).

Ce message automatique de suivi vous est transmis 24 heures après l'enregistrement de votre réservation dans notre système central.

RÉCAPITULATIF DE VOTRE DOSSIER :
- Référence : ${reference}
- Formule : ${typeLabel}
- Chambre attribuée : Chambre ${reservation.chambreNumero} (${reservation.chambreType})
- Période : ${arrivalFormatted}
- Nombre de personnes : ${reservation.nbPersonnes || 1}
- Statut de la réservation : Confirmée

RÈGLEMENT & FACTURATION :
- Montant Total : ${montantTotalFormatted}
- Mode de paiement : ${reservation.modePaiement}
- Acompte versé : ${acompteFormatted}
- Reste à régler à l'arrivée : ${resteFormatted}

SERVICES & ACCUEIL :
- Réception et conciergerie ouvertes 24h/24
- Connexion Wi-Fi Fibre Très Haut Débit offerte
- Climatisation autonome, Smart TV et service en chambre
- Boissons de bienvenue et mignardises d'accueil

Pour toute demande particulière (check-in personnalisé, navette ou note diététique), notre équipe de conciergerie se tient à votre entière disposition par téléphone ou WhatsApp au ${phone} ou par email à ${emailContact}.

Au plaisir de vous recevoir très prochainement,
La Direction & l'Équipe de Réception
${hotelName} • ${holding}
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1c1917; margin: 0; padding: 24px; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
    .header { background: #1C1B18; padding: 28px 32px; color: #ffffff; border-bottom: 3px solid #C5A880; }
    .badge-top { font-size: 10px; font-family: monospace; letter-spacing: 2px; text-transform: uppercase; color: #C5A880; font-weight: bold; }
    .title { font-family: Georgia, serif; font-size: 22px; font-weight: bold; margin: 8px 0 0 0; color: #ffffff; }
    .content { padding: 32px; line-height: 1.6; font-size: 14px; }
    .greeting { font-size: 16px; font-weight: bold; color: #1c1917; margin-bottom: 16px; }
    .reminder-pill { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-bottom: 20px; border: 1px solid #fde68a; }
    .box { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px 20px; margin: 18px 0; }
    .box-title { font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #78716c; font-weight: bold; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e7e5e4; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #78716c; }
    .value { font-weight: bold; color: #1c1917; text-align: right; }
    .highlight-val { color: #C5A880; font-family: monospace; font-size: 14px; }
    .footer { background: #f5f5f4; padding: 20px 32px; font-size: 12px; color: #78716c; text-align: center; border-top: 1px solid #e7e5e4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge-top">${holding} • CONCIERGERIE PMS</div>
      <div class="title">${hotelName}</div>
    </div>
    <div class="content">
      <div class="reminder-pill">✉️ Confirmation Automatique de Séjour (24h après saisie)</div>
      <div class="greeting">Cher(ère) ${reservation.clientNom},</div>
      <p>
        Nous avons l'honneur de vous confirmer les détails de votre réservation enregistrée avec succès auprès de notre conciergerie. Ce message automatique vous récapitule l'ensemble des éléments de votre séjour.
      </p>

      <div class="box">
        <div class="box-title">Détails de la Réservation (${reference})</div>
        <div class="row"><span class="label">Formule :</span><span class="value">${typeLabel}</span></div>
        <div class="row"><span class="label">Chambre :</span><span class="value">Chambre ${reservation.chambreNumero} (${reservation.chambreType})</span></div>
        <div class="row"><span class="label">Période &amp; Horaires :</span><span class="value">${arrivalFormatted}</span></div>
        <div class="row"><span class="label">Voyageurs :</span><span class="value">${reservation.nbPersonnes || 1} personne(s)</span></div>
        <div class="row"><span class="label">Statut :</span><span class="value" style="color: #16a34a;">● Confirmée &amp; Sécurisée</span></div>
      </div>

      <div class="box">
        <div class="box-title">Règlement Financier</div>
        <div class="row"><span class="label">Montant Total :</span><span class="value highlight-val">${montantTotalFormatted}</span></div>
        <div class="row"><span class="label">Mode de règlement :</span><span class="value">${reservation.modePaiement}</span></div>
        <div class="row"><span class="label">Acompte enregistré :</span><span class="value" style="color: #16a34a;">${acompteFormatted}</span></div>
        <div class="row"><span class="label">Reste dû à l'arrivée :</span><span class="value" style="color: ${reservation.resteAPayer && reservation.resteAPayer > 0 ? '#ea580c' : '#16a34a'};">${resteFormatted}</span></div>
      </div>

      <p style="font-size: 12px; color: #78716c; margin-top: 20px;">
        Nos équipes de réception vous accueillent 24h/24. Pour toute assistance ou modification, contactez-nous au <strong>${phone}</strong> ou par email à <strong>${emailContact}</strong>.
      </p>
    </div>
    <div class="footer">
      ${hotelName} • ${holding}<br>
      Ce message automatique certifie votre réservation hôtelière 24 heures après sa validation.
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, textBody, htmlBody };
}

/**
 * Calcule le statut et l'échéance du rappel 24h pour une réservation
 */
export function get24hReminderTiming(res: ReservationItem): {
  isEligible: boolean;
  isSent: boolean;
  hasEmail: boolean;
  scheduledTimeMs: number;
  isPast24h: boolean;
  remainingHours: number;
  remainingMinutes: number;
  scheduledDateFormatted: string;
} {
  const hasEmail = Boolean(res.clientEmail && res.clientEmail.trim().length > 3);
  const isSent = Boolean(res.rappelEmailEnvoye);
  const isConfirmed = res.statutReservation === 'confirmee';
  const isEligible = isConfirmed && hasEmail;

  // Date de création de la réservation (point de départ des 24h)
  const createdDate = res.dateCreation ? new Date(res.dateCreation) : new Date();
  const scheduledTimeMs = createdDate.getTime() + 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const diffMs = scheduledTimeMs - nowMs;

  const isPast24h = diffMs <= 0;
  const remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const remainingMinutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  const scheduledDateObj = new Date(scheduledTimeMs);
  const scheduledDateFormatted = `${scheduledDateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })} à ${scheduledDateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  return {
    isEligible,
    isSent,
    hasEmail,
    scheduledTimeMs,
    isPast24h,
    remainingHours,
    remainingMinutes,
    scheduledDateFormatted
  };
}
