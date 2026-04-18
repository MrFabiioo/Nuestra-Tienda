type GalleryElements = {
  root: HTMLElement;
  viewport: HTMLElement;
  slides: HTMLElement[];
  dots: HTMLButtonElement[];
  prevButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
};

function getGalleryElements(root: HTMLElement): GalleryElements | null {
  const viewport = root.querySelector<HTMLElement>('[data-gallery-viewport]');
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-gallery-slide]'));

  if (!viewport || slides.length === 0) {
    return null;
  }

  return {
    root,
    viewport,
    slides,
    dots: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]')),
    prevButton: root.querySelector<HTMLButtonElement>('[data-gallery-prev]'),
    nextButton: root.querySelector<HTMLButtonElement>('[data-gallery-next]'),
  };
}

function setActiveSlide(elements: GalleryElements, nextIndex: number) {
  elements.dots.forEach((dot, index) => {
    const isActive = index === nextIndex;
    dot.classList.toggle('product-gallery__dot--active', isActive);
    dot.setAttribute('aria-selected', String(isActive));
  });

  if (elements.prevButton) {
    elements.prevButton.disabled = nextIndex === 0;
  }

  if (elements.nextButton) {
    elements.nextButton.disabled = nextIndex === elements.slides.length - 1;
  }

  elements.root.dataset.activeIndex = String(nextIndex);
}

function scrollToIndex(elements: GalleryElements, nextIndex: number) {
  const clampedIndex = Math.max(0, Math.min(nextIndex, elements.slides.length - 1));
  const slide = elements.slides[clampedIndex];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  elements.viewport.scrollTo({
    left: slide.offsetLeft,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });

  setActiveSlide(elements, clampedIndex);
}

function getNearestSlideIndex(elements: GalleryElements) {
  const viewportLeft = elements.viewport.scrollLeft;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  elements.slides.forEach((slide, index) => {
    const distance = Math.abs(slide.offsetLeft - viewportLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function setupGallery(root: HTMLElement) {
  if (root.dataset.galleryReady === 'true') {
    return;
  }

  const elements = getGalleryElements(root);
  if (!elements) {
    return;
  }

  root.dataset.galleryReady = 'true';
  setActiveSlide(elements, 0);

  elements.prevButton?.addEventListener('click', () => {
    const currentIndex = Number(root.dataset.activeIndex ?? 0);
    scrollToIndex(elements, currentIndex - 1);
  });

  elements.nextButton?.addEventListener('click', () => {
    const currentIndex = Number(root.dataset.activeIndex ?? 0);
    scrollToIndex(elements, currentIndex + 1);
  });

  elements.dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      scrollToIndex(elements, Number(dot.dataset.galleryIndex ?? 0));
    });
  });

  let rafId = 0;
  elements.viewport.addEventListener('scroll', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      setActiveSlide(elements, getNearestSlideIndex(elements));
    });
  }, { passive: true });
}

export function initProductGalleries(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-product-gallery]').forEach(setupGallery);
}
