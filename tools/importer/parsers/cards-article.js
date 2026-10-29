/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-article (NAP home article teasers).
 * Output: one row per card -> [ image | h3 + paragraph(s) + Read more link ].
 * The three .divarticle elements live in separate col-lg-3 columns, so the first
 * call gathers every .divarticle in the scope (#content1 / .bottom-section / document)
 * into a single block and removes the others. Later calls on removed elements no-op.
 */
export default function parse(element, { document }) {
  // Already consumed by a previous call
  if (!element.parentNode || (element.isConnected === false)) return;

  const scope = element.closest('#content1, .bottom-section') || document;
  let articles = [...scope.querySelectorAll('.divarticle')];
  if (!articles.includes(element)) articles = [element, ...articles];

  const cells = [];
  articles.forEach((article) => {
    const img = article.querySelector('.divArticleImage img, img');
    let imageCell = '';
    if (img) {
      const pic = document.createElement('img');
      pic.src = img.getAttribute('src') || img.src;
      pic.alt = img.getAttribute('alt') || img.getAttribute('title') || '';
      imageCell = pic;
    }

    const content = article.querySelector('.divArticleContent .sfContentBlock')
      || article.querySelector('.divArticleContent')
      || article;
    const bodyCell = [];
    [...content.children].forEach((child) => {
      if (child.tagName === 'BR') return;
      if (!child.textContent.trim() && !child.querySelector('img, a')) return;
      if (child.tagName === 'P') {
        // Split a trailing "Read more" link into its own paragraph.
        const link = child.querySelector(':scope > a:last-of-type');
        if (link && child.lastElementChild === link) {
          link.remove();
          // trim trailing <br> elements left behind
          while (child.lastChild && (child.lastChild.nodeName === 'BR'
            || (child.lastChild.nodeType === 3 && !child.lastChild.textContent.trim()))) {
            child.lastChild.remove();
          }
          if (child.textContent.trim()) bodyCell.push(child);
          const p = document.createElement('p');
          p.append(link);
          bodyCell.push(p);
          return;
        }
      }
      bodyCell.push(child);
    });

    if (!imageCell && !bodyCell.length) return;
    cells.push([imageCell, bodyCell.length ? bodyCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
  articles.forEach((article) => {
    if (article !== element && article.parentNode) article.remove();
  });
}
