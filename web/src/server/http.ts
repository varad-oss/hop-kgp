export class HttpError extends Error {
  constructor(public status: number, public error: string) {
    super(error);
    this.name = 'HttpError';
  }
}

export function toResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.error }, { status: e.status });
  if (e instanceof Response) return e;
  console.error(e);
  return Response.json({ error: 'server_error' }, { status: 500 });
}
