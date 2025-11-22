export async function register() {
  // Validate environment variables at startup
  const { validateEnv } = await import('./lib/env');
  validateEnv();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource: string;
    revalidateReason?: string;
    renderType: string;
  }
) => {
  const Sentry = await import('@sentry/nextjs');

  Sentry.captureException(error, {
    extra: {
      request: {
        path: request.path,
        method: request.method,
      },
      context,
    },
  });
};
