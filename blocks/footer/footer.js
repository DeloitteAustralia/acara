/**
 * Fetches the footer fragment. Metadata-independent: /content first (local preview),
 * then the site root (DA / EDS preview + publish).
 * @returns {Promise<HTMLElement|null>} container holding the footer sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location, not the current page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return container;
}

/** A list whose every link wraps only an image (social icons, badges). */
function isImageLinkList(ul) {
  const links = [...ul.querySelectorAll('a')];
  return links.length > 0 && links.every((a) => a.querySelector('img') && !a.textContent.trim());
}

// own-site hosts open in the same tab; includes the live site while pages are still being migrated
const SITE_HOSTS = [window.location.hostname, 'www.nap.edu.au', 'nap.edu.au'];

function openExternalInNewTab(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (!SITE_HOSTS.includes(url.hostname)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const links = document.createElement('div');
  links.className = 'footer-links';
  const columns = document.createElement('div');
  columns.className = 'footer-links-inner';
  links.append(columns);

  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const bottomInner = document.createElement('div');
  bottomInner.className = 'footer-bottom-inner';
  bottom.append(bottomInner);

  // sections with a heading are link columns; the rest form the bottom bar
  [...fragment.children].forEach((section) => {
    if (section.querySelector('h1, h2, h3, h4, h5, h6')) {
      section.className = 'footer-column';
      section.querySelectorAll(':scope > ul').forEach((ul) => {
        if (isImageLinkList(ul)) ul.classList.add('footer-social');
      });
      columns.append(section);
    } else {
      const list = section.querySelector(':scope > ul');
      section.className = list && isImageLinkList(list) ? 'footer-badges' : 'footer-legal';
      bottomInner.append(section);
    }
  });

  block.append(links, bottom);
  openExternalInNewTab(block);
}
