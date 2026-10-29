// width from which the nav links are shown inline (no menu toggle), as on the source
const isInlineNav = window.matchMedia('(width >= 768px)');

const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="14" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9.2 14.8 3 21" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>';

/**
 * Fetches the nav fragment. Metadata-independent: /content first (local preview),
 * then the site root (DA / EDS preview + publish).
 * @returns {Promise<HTMLElement|null>} container holding the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location, not the current page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return container;
}

// path-based so links still pointing at the live source site mark the matching page
function isCurrentPage(href) {
  const target = new URL(href, window.location.href);
  const strip = (p) => p.replace(/\.html$/, '').replace(/\/$/, '').replace(/^\/content(?=\/)/, '') || '/index';
  return strip(target.pathname) === strip(window.location.pathname);
}

function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const link = section?.querySelector('a');
  if (link) brand.append(link);
  return brand;
}

function buildPartners(section) {
  const partners = document.createElement('div');
  partners.className = 'nav-partners';
  const list = section?.querySelector('ul');
  if (!list) return partners;
  list.querySelectorAll('a').forEach((a) => {
    const external = new URL(a.href, window.location.href).origin !== window.location.origin;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
  partners.append(list);
  return partners;
}

function buildSections(section) {
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  sections.id = 'nav-sections';
  const list = section?.querySelector('ul');
  if (!list) return sections;
  list.querySelectorAll(':scope > li > a').forEach((a) => {
    if (isCurrentPage(a.href)) a.setAttribute('aria-current', 'page');
  });
  sections.append(list);
  return sections;
}

/**
 * Text size toggle: mirrors the source "A A" controls (14px / 16px body text).
 */
function buildTextSize(smallLabel, largeLabel) {
  const group = document.createElement('div');
  group.className = 'nav-text-size';
  const make = (label, size) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `nav-text-size-${size}`;
    btn.textContent = 'A';
    btn.setAttribute('aria-label', label);
    return btn;
  };
  const small = make(smallLabel, 'small');
  const large = make(largeLabel, 'large');
  const setLarge = (on) => {
    document.documentElement.classList.toggle('text-large', on);
    small.setAttribute('aria-pressed', !on);
    large.setAttribute('aria-pressed', on);
  };
  small.addEventListener('click', () => setLarge(false));
  large.addEventListener('click', () => setLarge(true));
  setLarge(false);
  group.append(small, large);
  return group;
}

function buildSearch(searchLink) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-search';
  const label = searchLink?.textContent.trim() || 'Search';
  const action = searchLink?.getAttribute('href') || '/search-results';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-search-panel');
  toggle.innerHTML = SEARCH_ICON;

  const form = document.createElement('form');
  form.className = 'nav-search-panel';
  form.id = 'nav-search-panel';
  form.setAttribute('role', 'search');
  form.action = action;
  form.method = 'get';
  form.hidden = true;
  form.innerHTML = `
    <input type="hidden" name="indexCatalogue" value="napsearchindex">
    <input type="hidden" name="wordsMode" value="0">
    <label class="visually-hidden" for="nav-search-input">${label}</label>
    <input type="search" id="nav-search-input" name="searchQuery" placeholder="${label}" autocomplete="off">
    <button type="submit" aria-label="Submit ${label.toLowerCase()}">&gt;&gt;</button>`;

  // like the source, opening does not move focus; the input is next in tab order
  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.addEventListener('click', () => setOpen(form.hidden));
  wrapper.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !form.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  wrapper.append(toggle, form);
  return wrapper;
}

function buildTools(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const items = [...(section?.querySelectorAll(':scope ul > li') || [])];
  const textItems = items.filter((li) => !li.querySelector('a'));
  const searchLink = items.map((li) => li.querySelector('a')).find(Boolean);
  if (textItems.length >= 2) {
    tools.append(buildTextSize(textItems[0].textContent.trim(), textItems[1].textContent.trim()));
  }
  tools.append(buildSearch(searchLink));
  return tools;
}

function toggleMenu(nav, hamburger, force) {
  const expanded = force !== undefined ? !force : nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  hamburger.querySelector('button').setAttribute('aria-expanded', expanded ? 'false' : 'true');
}

/**
 * Mobile menu toggle with the authored label (e.g. "NAP MENU") beside the button.
 */
function buildHamburger(navSection) {
  const labelText = navSection?.querySelector(':scope > p')?.textContent.trim() || 'Menu';
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const label = document.createElement('span');
  label.className = 'nav-hamburger-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = labelText;
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', 'nav-sections');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', labelText);
  button.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.append(label, button);
  return hamburger;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  const [brandSection, partnerSection, navSection, toolsSection] = [...fragment.children];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  const brandRow = document.createElement('div');
  brandRow.className = 'nav-brand-row';
  brandRow.append(buildBrand(brandSection), buildPartners(partnerSection));

  const hamburger = buildHamburger(navSection);
  hamburger.addEventListener('click', () => toggleMenu(nav, hamburger));

  const mainRow = document.createElement('div');
  mainRow.className = 'nav-main-row';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';
  mainInner.append(hamburger, buildSections(navSection), buildTools(toolsSection));
  mainRow.append(mainInner);

  nav.append(brandRow, mainRow);

  // reset the mobile menu (and close search) when crossing the toggle breakpoint
  isInlineNav.addEventListener('change', () => {
    toggleMenu(nav, hamburger, false);
    const search = nav.querySelector('.nav-search-panel');
    if (search && !search.hidden) nav.querySelector('.nav-search-toggle').click();
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
