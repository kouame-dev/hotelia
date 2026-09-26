/**
 * Convertit un nombre en montant en toutes lettres en français (FCFA)
 * Requis pour la conformité des Factures Normalisées Électroniques (FNE) DGI Côte d'Ivoire
 */

const UNITES = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf'
];

const DIZAINES = [
  '',
  'dix',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante-dix',
  'quatre-vingt',
  'quatre-vingt-dix'
];

function convertirCentaine(n: number): string {
  let texte = '';
  const centaine = Math.floor(n / 100);
  const reste = n % 100;

  if (centaine > 0) {
    if (centaine === 1) {
      texte += 'cent ';
    } else {
      texte += UNITES[centaine] + ' cent' + (reste === 0 ? 's ' : ' ');
    }
  }

  if (reste > 0) {
    if (reste < 20) {
      texte += UNITES[reste] + ' ';
    } else {
      const dizaine = Math.floor(reste / 10);
      const unite = reste % 10;

      if (dizaine === 7) {
        texte += 'soixante-' + (unite === 1 ? 'et-onze ' : UNITES[10 + unite] + ' ');
      } else if (dizaine === 9) {
        texte += 'quatre-vingt-' + UNITES[10 + unite] + ' ';
      } else {
        if (unite === 1 && dizaine !== 8) {
          texte += DIZAINES[dizaine] + '-et-un ';
        } else if (unite === 0 && dizaine === 8) {
          texte += 'quatre-vingts ';
        } else {
          texte += DIZAINES[dizaine] + (unite > 0 ? '-' + UNITES[unite] : '') + ' ';
        }
      }
    }
  }

  return texte.trim();
}

export function numberToWordsFrench(nombre: number): string {
  if (nombre === 0) return 'zéro Franc CFA';

  let entier = Math.floor(Math.abs(nombre));
  let texte = '';

  const milliards = Math.floor(entier / 1000000000);
  entier %= 1000000000;

  const millions = Math.floor(entier / 1000000);
  entier %= 1000000;

  const mille = Math.floor(entier / 1000);
  entier %= 1000;

  if (milliards > 0) {
    texte += convertirCentaine(milliards) + (milliards > 1 ? ' milliards ' : ' milliard ');
  }

  if (millions > 0) {
    texte += convertirCentaine(millions) + (millions > 1 ? ' millions ' : ' million ');
  }

  if (mille > 0) {
    if (mille === 1) {
      texte += 'mille ';
    } else {
      texte += convertirCentaine(mille) + ' mille ';
    }
  }

  if (entier > 0) {
    texte += convertirCentaine(entier);
  }

  const resultat = texte.trim();
  // Mettre première lettre en majuscule
  return (resultat.charAt(0).toUpperCase() + resultat.slice(1)) + ' Francs CFA';
}
