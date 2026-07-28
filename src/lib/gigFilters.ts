const CLOSED_GIG_STATUSES = ['completed', 'cancelled'];

export function isActiveWorkerGig(gig: { worker_id: string | null; status: string }, workerId?: string | null) {
  return Boolean(workerId && gig.worker_id === workerId && !CLOSED_GIG_STATUSES.includes(gig.status));
}

export function isAvailableGig(gig: { worker_id: string | null; status: string }, workerId?: string | null) {
  return gig.status === 'open' && (!workerId || gig.worker_id !== workerId);
}
