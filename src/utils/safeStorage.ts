/**
 * Safe Storage & Chrome / Chromium Compatibility Diagnostic Utility
 * 
 * Résout les crashs et exceptions DOMException (QuotaExceededError, SecurityError, etc.)
 * fréquents sur Google Chrome (Desktop, Android, WebViews, sandboxed iframes).
 * Fournit une API sécurisée pour le stockage local et un diagnostic complet du cycle de vie.
 */

export interface StorageDiagnosticResult {
  isSupported: boolean;
  isAccessible: boolean;
  browser: {
    isChrome: boolean;
    isChromium: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    userAgent: string;
    platform: string;
  };
  storageQuota: {
    totalKeys: number;
    hoteliaKeys: number;
    estimatedSizeBytes: number;
    estimatedSizeKb: string;
    keysDetail: Array<{ key: string; sizeKb: string }>;
  };
  lastError: string | null;
  timestamp: string;
}

/**
 * Détection précise de l'environnement de navigation Chrome / Chromium / Android
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isChrome: false,
      isChromium: false,
      isAndroid: false,
      isMobile: false,
      userAgent: 'SSR',
      platform: 'unknown'
    };
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  const isEdge = /edg\//i.test(ua);
  const isOpera = /opr\//i.test(ua);
  const isSamsung = /samsungbrowser/i.test(ua);
  const isChrome = (/chrome|crios/i.test(ua)) && !isEdge && !isOpera && !isSamsung;
  const isChromium = /chrome|crios|edg|opr|samsungbrowser/i.test(ua);

  return {
    isChrome,
    isChromium,
    isAndroid,
    isMobile,
    userAgent: ua,
    platform: navigator.platform || 'unknown'
  };
}

/**
 * Vérification de la disponibilité et de l'accessibilité de localStorage
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__hotelia_test_storage__';
    window.localStorage.setItem(testKey, testKey);
    const read = window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    return read === testKey;
  } catch {
    return false;
  }
}

/**
 * Nettoyage préventif des données temporaires ou volumineuses en cas de saturation de quota
 */
function tryFreeStorageSpace() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    console.warn('[Hotelia SafeStorage] Tentative de libération d\'espace de stockage local (Chrome Quota Guard)...');
    
    // 1. Purger les logs d'audit anciens s'ils sont volumineux
    const audit = window.localStorage.getItem('hotelia_audit_logs');
    if (audit && audit.length > 50000) {
      try {
        const parsed = JSON.parse(audit);
        if (Array.isArray(parsed) && parsed.length > 20) {
          window.localStorage.setItem('hotelia_audit_logs', JSON.stringify(parsed.slice(0, 20)));
        }
      } catch {
        window.localStorage.removeItem('hotelia_audit_logs');
      }
    }

    // 2. Nettoyer les clés temporaires
    const tempKeys = ['hotelia_simulate_offline', 'hotelia_email_reminders'];
    tempKeys.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {}
    });
  } catch (err) {
    console.warn('[Hotelia SafeStorage] Erreur lors du nettoyage défensif :', err);
  }
}

/**
 * Lecture sécurisée de localStorage avec tolérance de panne
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.warn(`[Hotelia SafeStorage] Échec lecture sécurisée "${key}" :`, e);
    return null;
  }
}

/**
 * Écriture sécurisée de localStorage avec protection de quota Chrome et reprise sur erreur
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    const isQuotaError =
      e && (
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e.code === 22 ||
        e.code === 1014
      );

    console.warn(
      `[Hotelia SafeStorage] Échec écriture sécurisée "${key}" (Quota: ${isQuotaError ? 'OUI' : 'NON'}) :`,
      e
    );

    if (isQuotaError) {
      tryFreeStorageSpace();
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error(`[Hotelia SafeStorage] Ré-écriture impossible après libération pour "${key}" :`, retryErr);
        return false;
      }
    }
    return false;
  }
}

/**
 * Suppression sécurisée de localStorage
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`[Hotelia SafeStorage] Échec suppression sécurisée "${key}" :`, e);
    return false;
  }
}

/**
 * Diagnostic approfondi du stockage local et des particularités du navigateur Chrome/Android
 */
export function getStorageDiagnosticInfo(): StorageDiagnosticResult {
  const browser = getBrowserInfo();
  const isSupported = typeof window !== 'undefined' && 'localStorage' in window;
  let isAccessible = false;
  let lastError: string | null = null;
  const keysDetail: Array<{ key: string; sizeKb: string }> = [];
  let totalSizeBytes = 0;
  let hoteliaKeysCount = 0;

  if (isSupported) {
    try {
      const testKey = '__hotelia_diag_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      isAccessible = true;

      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k) {
          const val = window.localStorage.getItem(k) || '';
          const keySize = (k.length + val.length) * 2; // UTF-16 approx 2 octets par caractère
          totalSizeBytes += keySize;
          if (k.startsWith('hotelia_')) {
            hoteliaKeysCount++;
            keysDetail.push({
              key: k,
              sizeKb: (keySize / 1024).toFixed(2)
            });
          }
        }
      }
    } catch (e: any) {
      isAccessible = false;
      lastError = e?.message || String(e);
    }
  }

  // Trier les clés de la plus volumineuse à la plus légère
  keysDetail.sort((a, b) => parseFloat(b.sizeKb) - parseFloat(a.sizeKb));

  return {
    isSupported,
    isAccessible,
    browser,
    storageQuota: {
      totalKeys: typeof window !== 'undefined' ? window.localStorage?.length || 0 : 0,
      hoteliaKeys: hoteliaKeysCount,
      estimatedSizeBytes: totalSizeBytes,
      estimatedSizeKb: (totalSizeBytes / 1024).toFixed(2),
      keysDetail
    },
    lastError,
    timestamp: new Date().toISOString()
  };
}

/**
 * Nettoyage préventif des données temporaires ou volumineuses
 */
export function cleanTemporaryStorage(): { freedBytes: number; message: string } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { freedBytes: 0, message: 'Stockage indisponible sur cet environnement.' };
  }
  const beforeInfo = getStorageDiagnosticInfo();
  tryFreeStorageSpace();
  const afterInfo = getStorageDiagnosticInfo();
  const freed = Math.max(0, beforeInfo.storageQuota.estimatedSizeBytes - afterInfo.storageQuota.estimatedSizeBytes);
  return {
    freedBytes: freed,
    message: freed > 0
      ? `Nettoyage réussi : ${(freed / 1024).toFixed(2)} Ko libérés (Taille restante : ${afterInfo.storageQuota.estimatedSizeKb} Ko).`
      : 'Espace de stockage déjà optimisé (aucune donnée temporaire superflue).'
  };
}

export interface DiagnosticLogEntry {
  id: string;
  context: string;
  action: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  extra?: Record<string, any>;
}

const RECENT_LOGS_MAX = 60;
const recentLogsBuffer: DiagnosticLogEntry[] = [];

/**
 * Obtenir l'historique des derniers logs de diagnostic capturés
 */
export function getRecentDiagnosticLogs(): DiagnosticLogEntry[] {
  return [...recentLogsBuffer];
}

/**
 * Réinitialiser l'historique des logs
 */
export function clearRecentDiagnosticLogs(): void {
  recentLogsBuffer.length = 0;
}

/**
 * Logger spécialisé pour tracer les événements et cycles de vie sur Chromium / Android
 */
export function logChromeDiagnostic(
  context: string,
  action: string,
  extra?: Record<string, any>
) {
  const browser = getBrowserInfo();
  const prefix = `[Chrome/Chromium Diagnostic][${context}]`;
  const level: 'info' | 'warn' | 'error' = extra?.error ? 'error' : extra?.warning ? 'warn' : 'info';
  
  const payload = {
    action,
    timestamp: new Date().toISOString(),
    browser: {
      isChrome: browser.isChrome,
      isAndroid: browser.isAndroid,
      isMobile: browser.isMobile,
      platform: browser.platform
    },
    ...extra
  };

  // Ajout au buffer circulaire interne pour affichage direct dans l'interface
  const entry: DiagnosticLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    context,
    action,
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
    level,
    extra: payload
  };
  recentLogsBuffer.unshift(entry);
  if (recentLogsBuffer.length > RECENT_LOGS_MAX) {
    recentLogsBuffer.pop();
  }

  if (level === 'error') {
    console.error(`${prefix} ❌ ${action}`, payload);
  } else if (level === 'warn') {
    console.warn(`${prefix} ⚠️ ${action}`, payload);
  } else {
    console.log(`${prefix} ℹ️ ${action}`, payload);
  }
}

