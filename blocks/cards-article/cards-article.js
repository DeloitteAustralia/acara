import { createOptimizedPicture } from '../../scripts/aem.js';

const B = 'cards-article';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = `${B}-card`;
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (!div.textContent.trim() && !div.querySelector('picture, img')) {
        div.remove();
      } else if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = `${B}-card-image`;
      } else {
        div.className = `${B}-card-body`;
      }
    });
    if (li.children.length) ul.append(li);
  });

  // Mark the trailing "Read more" link paragraph so it can be styled as a text CTA.
  ul.querySelectorAll(`.${B}-card-body`).forEach((body) => {
    const last = body.lastElementChild;
    if (last && last.tagName === 'P' && last.children.length === 1
      && last.firstElementChild.tagName === 'A'
      && last.textContent.trim() === last.firstElementChild.textContent.trim()) {
      last.classList.add(`${B}-card-link`);
      last.firstElementChild.classList.remove('button');
      last.classList.remove('button-container');
      // Disambiguate repeated "Read more" links for screen readers.
      const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const context = document.createElement('span');
        context.className = 'visually-hidden';
        context.textContent = ` about ${heading.textContent.trim()}`;
        last.firstElementChild.append(context);
      }
    }
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
