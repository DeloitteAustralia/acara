import { createOptimizedPicture } from '../../scripts/aem.js';

const B = 'carousel-side-caption';
let carouselId = 0;

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
  });
}

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;
  block.querySelectorAll(`.${B}-slide`).forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((link) => {
      if (active) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll(`.${B}-indicator button`).forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll(`.${B}-slide`);
  if (!slides.length) return;
  let idx = slideIndex;
  if (idx < 0) idx = slides.length - 1;
  if (idx >= slides.length) idx = 0;
  block.querySelector(`.${B}-slides`).scrollTo({
    top: 0,
    left: slides[idx].offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, idx);
}

function bindEvents(block) {
  block.querySelectorAll(`.${B}-indicator button`).forEach((button) => {
    button.addEventListener('click', () => {
      showSlide(block, parseInt(button.parentElement.dataset.targetSlide, 10));
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll(`.${B}-slide`).forEach((slide) => observer.observe(slide));
}

// Source carousel auto-rotates every 5s (Bootstrap data-interval="5000") and pauses on hover.
const AUTOPLAY_INTERVAL = 5000;

function startAutoplay(block, nav) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer;
  let userPaused = false;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const start = () => {
    if (timer || userPaused) return;
    timer = setInterval(() => {
      showSlide(block, (parseInt(block.dataset.activeSlide, 10) || 0) + 1);
    }, AUTOPLAY_INTERVAL);
  };

  // WCAG 2.2.2: auto-rotating content needs a persistent pause control.
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `${B}-toggle`;
  const setLabel = () => {
    toggle.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    toggle.classList.toggle('paused', userPaused);
  };
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    setLabel();
    if (userPaused) stop();
  });
  setLabel();
  nav.append(toggle);

  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', (e) => {
    if (!block.contains(e.relatedTarget)) start();
  });
  start();
}

// First slide is the LCP candidate; hidden slides must not compete for bandwidth.
function prioritizeImages(slidesWrapper) {
  slidesWrapper.querySelectorAll(`.${B}-slide`).forEach((slide, idx) => {
    slide.querySelectorAll('img').forEach((img) => {
      if (idx === 0) {
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', 'high');
      } else {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('fetchpriority', 'low');
      }
    });
  });
}

function createSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = `${B}-slide`;
  slide.dataset.slideIndex = idx;
  slide.id = `${B}-${id}-slide-${idx}`;

  const cells = [...row.querySelectorAll(':scope > div')];
  // Image cell: first cell holding a picture; caption: everything else with content.
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  cells.forEach((cell) => {
    if (cell === imageCell) {
      cell.className = `${B}-slide-image`;
      slide.append(cell);
    } else if (cell.textContent.trim() || cell.children.length) {
      cell.className = `${B}-slide-caption`;
      slide.append(cell);
    }
  });
  if (!slide.querySelector(`.${B}-slide-caption`)) slide.classList.add('no-caption');

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);
  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.id = `${B}-${id}`;
  const rows = [...block.querySelectorAll(':scope > div')];

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.className = `${B}-slides-container`;
  const slidesWrapper = document.createElement('ul');
  slidesWrapper.className = `${B}-slides`;

  let indicators;
  let nav;
  if (rows.length > 1) {
    nav = document.createElement('nav');
    nav.className = `${B}-indicators-nav`;
    nav.setAttribute('aria-label', 'Carousel Slide Controls');
    indicators = document.createElement('ol');
    indicators.className = `${B}-indicators`;
    nav.append(indicators);
    container.append(nav);
  }

  rows.forEach((row, idx) => {
    slidesWrapper.append(createSlide(row, idx, id));
    if (indicators) {
      const li = document.createElement('li');
      li.className = `${B}-indicator`;
      li.dataset.targetSlide = idx;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Show Slide ${idx + 1} of ${rows.length}`);
      li.append(btn);
      indicators.append(li);
    }
    row.remove();
  });

  optimizeImages(slidesWrapper);
  prioritizeImages(slidesWrapper);
  container.prepend(slidesWrapper);
  block.replaceChildren(container);

  if (indicators) {
    updateActiveSlide(block, 0);
    bindEvents(block);
    startAutoplay(block, nav);
  }
}
