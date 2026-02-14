/**
 * Categorizes client-side errors into user-friendly messages with suggested actions.
 */

type ErrorAction = 'retry' | 'relogin' | 'wait';

interface CategorizedError {
  message: string;
  action: ErrorAction;
}

export function categorizeError(error: unknown): CategorizedError {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('timeout') || lower.includes('abort')) {
    return {
      message: 'El servicio esta ocupado. Intenta de nuevo en un momento.',
      action: 'wait',
    };
  }

  if (lower.includes('401') || lower.includes('auth') || lower.includes('session')) {
    return {
      message: 'Tu sesion expiro. Inicia sesion de nuevo.',
      action: 'relogin',
    };
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return {
      message: 'Sin conexion. Verifica tu internet e intenta de nuevo.',
      action: 'retry',
    };
  }

  return {
    message: 'Ocurrio un error. Intenta de nuevo.',
    action: 'retry',
  };
}
