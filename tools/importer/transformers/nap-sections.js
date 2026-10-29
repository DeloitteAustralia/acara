/* eslint-disable */
/* global WebImporter */

/**
 * NAP (nap.edu.au) sections transformer.
 * Inserts section breaks (<hr>) and Section Metadata blocks based on
 * payload.template.sections from tools/importer/page-templates.json.
 */
const MARKER_ATTR = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Walk in reverse so insertions do not affect earlier lookups
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = findSectionElement(element, section);
      if (!sectionEl) continue;

      if (i > 0 || section.style) {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
        if (i === 0) hr.setAttribute('data-excat-first-section', 'true');
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);

      if (section.style) {
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });

        const sectionEl = findSectionElement(element, section);
        if (sectionEl && sectionEl.parentNode) {
          sectionEl.after(metadata);
        } else if (marker && marker.nextElementSibling) {
          marker.nextElementSibling.after(metadata);
        } else if (marker) {
          marker.after(metadata);
        }
      }

      if (marker) {
        if (marker.hasAttribute('data-excat-first-section')) {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER_ATTR);
        }
      }
    }

    // Remove any leftover first-section temp markers
    element.querySelectorAll('hr[data-excat-first-section]').forEach((hr) => hr.remove());
  }
}
