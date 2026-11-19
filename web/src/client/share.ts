export async function shareProposal(p: { text: string; url: string }): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: p.text, url: p.url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${p.text} ${p.url}`)}`, '_blank', 'noopener');
}
