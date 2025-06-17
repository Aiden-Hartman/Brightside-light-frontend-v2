export function redirectParent(url: string): void {
  window.parent.postMessage({ type: 'redirect', url }, '*');
} 