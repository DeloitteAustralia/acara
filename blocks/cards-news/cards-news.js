import { createOptimizedPicture } from '../../scripts/aem.js';

const B = 'cards-news';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = `${B}-item`;
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (!div.textContent.trim() && !div.querySelector('picture, img')) {
        div.remove();
      } else if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = `${B}-item-image`;
      } else {
        div.className = `${B}-item-body`;
      }
    });
    if (!li.children.length) return;

    // Date: a paragraph whose only content is strong/bold text.
    li.querySelectorAll(`.${B}-item-body > p`).forEach((p) => {
      const strong = p.querySelector(':scope > strong, :scope > b');
      if (strong && p.children.length === 1 && p.textContent.trim() === strong.textContent.trim()) {
        p.classList.add(`${B}-item-date`);
      }
      const a = p.querySelector(':scope > a');
      if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
        p.classList.add(`${B}-item-link`);
        p.classList.remove('button-container');
        a.classList.remove('button');
        // Disambiguate repeated "read more" links for screen readers.
        const heading = li.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          const context = document.createElement('span');
          context.className = 'visually-hidden';
          context.textContent = ` about ${heading.textContent.trim()}`;
          a.append(context);
        }
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
