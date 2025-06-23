export interface AnimationTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const animateProductImage = (
  sourceElement: HTMLElement,
  targetElement: HTMLElement,
  onComplete?: () => void
) => {
  // Get source image element
  const sourceImage = sourceElement.querySelector('img');
  if (!sourceImage) return;

  // Get source position
  const sourceRect = sourceImage.getBoundingClientRect();
  
  // Find the target image in the summary panel
  const targetImage = targetElement.querySelector('img');
  if (!targetImage) return;
  
  const targetRect = targetImage.getBoundingClientRect();

  // Create flying image element
  const flyingImage = document.createElement('img');
  flyingImage.src = sourceImage.src;
  flyingImage.alt = sourceImage.alt;
  flyingImage.style.cssText = `
    position: fixed;
    top: ${sourceRect.top}px;
    left: ${sourceRect.left}px;
    width: ${sourceRect.width}px;
    height: ${sourceRect.height}px;
    object-fit: contain;
    border-radius: 8px;
    z-index: 9999;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  // Add to DOM
  document.body.appendChild(flyingImage);

  // Force reflow
  flyingImage.offsetHeight;

  // Animate to target
  flyingImage.style.top = `${targetRect.top}px`;
  flyingImage.style.left = `${targetRect.left}px`;
  flyingImage.style.width = `${targetRect.width}px`;
  flyingImage.style.height = `${targetRect.height}px`;
  flyingImage.style.opacity = '0.8';
  flyingImage.style.transform = 'scale(0.8)';

  // Clean up after animation
  setTimeout(() => {
    if (flyingImage.parentNode) {
      flyingImage.parentNode.removeChild(flyingImage);
    }
    if (onComplete) {
      onComplete();
    }
  }, 600);
}; 