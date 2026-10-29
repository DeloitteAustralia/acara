/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-news (NAP home "What's New" panel).
 * Output: one row per news item -> [ h4 title + date (p > strong) + summary + read more link ].
 * Source: article.divNewsContent .whatsnew. The preceding "What's New" h3 stays outside
 * the block as default content. If several .whatsnew items share a parent, the first call
 * gathers them into one block and removes the rest; later calls on removed items no-op.
 */
export default function parse(element, { document }) {
  if (!element.parentNode || (element.isConnected === false)) return;

  let items = [...element.parentNode.querySelectorAll(':scope > .whatsnew')];
  if (!items.includes(element)) items = [element, ...items];

  const cells = [];
  items.forEach((item) => {
    const contentCell = [];

    const title = item.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      const h4 = document.createElement('h4');
      h4.innerHTML = title.innerHTML.trim();
      contentCell.push(h4);
    }

    const dateEl = item.querySelector(':scope > div strong, :scope > div b, :scope > div');
    if (dateEl && dateEl.textContent.trim()) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = dateEl.textContent.trim();
      p.append(strong);
      contentCell.push(p);
    }

    item.querySelectorAll(':scope > p').forEach((p) => {
      if (p.textContent.trim()) contentCell.push(p);
    });

    const link = item.querySelector(':scope > a[href]');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      if (link.getAttribute('title')) a.title = link.getAttribute('title');
      a.textContent = link.textContent.trim() || 'read more';
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    }

    if (contentCell.length) cells.push([contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
  items.forEach((item) => {
    if (item !== element && item.parentNode) item.remove();
  });
}
