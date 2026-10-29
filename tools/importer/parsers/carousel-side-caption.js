/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-side-caption (NAP home banner, #home-carousel).
 * Output: one row per slide -> [ image (wrapped in its link, if any) | caption content ].
 * Source: .carousel-inner > .item; image in .col-md-9 column, caption in .carousel-caption.
 * Empty anchors in the image column are ignored; only the anchor that wraps the img is kept.
 */
function isEmptyNode(el) {
  if (!el) return true;
  if (el.querySelector && el.querySelector('img, picture, video, iframe')) return false;
  return !(el.textContent || '').replace(/ /g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];

  let slides = [...element.querySelectorAll(':scope > .carousel-inner > .item')];
  if (!slides.length) slides = [...element.querySelectorAll('.item')];

  slides.forEach((slide) => {
    // Image cell
    const imageCol = slide.querySelector('[class*="col-md-9"]') || slide;
    const img = imageCol.querySelector('img');
    let imageCell = '';
    if (img) {
      const pic = document.createElement('img');
      pic.src = img.getAttribute('src') || img.src;
      pic.alt = img.getAttribute('alt') || img.getAttribute('title') || '';
      const link = img.closest('a');
      if (link && link.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href').trim();
        a.append(pic);
        imageCell = a;
      } else {
        imageCell = pic;
      }
    }

    // Caption cell
    const captionRoot = slide.querySelector('.carousel-caption .sfContentBlock')
      || slide.querySelector('.carousel-caption');
    const captionCell = [];
    if (captionRoot) {
      [...captionRoot.children].forEach((child) => {
        if (child.tagName === 'BR' || isEmptyNode(child)) return;
        if (child.tagName === 'DIV') {
          // wrap bare div text into a paragraph
          const p = document.createElement('p');
          p.innerHTML = child.innerHTML;
          captionCell.push(p);
        } else {
          captionCell.push(child);
        }
      });
    }

    if (!imageCell && !captionCell.length) return;
    cells.push([imageCell, captionCell.length ? captionCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-side-caption', cells });
  element.replaceWith(block);
}
