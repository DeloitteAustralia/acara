/* eslint-disable */
/* global WebImporter */

/**
 * NAP (nap.edu.au) cleanup transformer.
 * Removes non-authorable site chrome and ASP.NET/Sitefinity junk.
 * Selectors taken from migration-work/cleaned.html.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Global header and navigation
    WebImporter.DOMUtils.remove(element, [
      'div.container.logo-header',
      'section.navigation-top',
    ]);

    // Global footer
    WebImporter.DOMUtils.remove(element, [
      '#footer1',
      'div.footer',
      'div.bottom-bar',
    ]);

    // ASP.NET hidden state fields and stray form inputs
    WebImporter.DOMUtils.remove(element, [
      'div.aspNetHidden',
      'input',
      'button',
      'select',
      'textarea',
    ]);

    // Empty/hidden placeholder controls
    WebImporter.DOMUtils.remove(element, ['article.hideCtrl', '.hidectrl']);

    // Carousel indicator dots (non-authorable UI)
    WebImporter.DOMUtils.remove(element, [
      'ol.carousel-indicators',
      '.carousel-control',
    ]);

    // Scripts, styles, embeds
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Unwrap the page-level ASP.NET form so content is not nested in a <form>
    element.querySelectorAll('form#form1').forEach((form) => {
      form.replaceWith(...form.childNodes);
    });
  }

  if (hookName === 'afterTransform') {
    // Final safety pass for any residual non-authorable elements
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'input',
      'form',
    ]);

    // Strip tracking / framework attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-') && !n.startsWith('data-excat-')) el.removeAttribute(n);
        if (n.startsWith('on')) el.removeAttribute(n);
      });
    });
  }
}
