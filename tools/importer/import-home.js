/* eslint-disable */
/* global WebImporter */

import carouselSideCaptionParser from './parsers/carousel-side-caption.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsNewsParser from './parsers/cards-news.js';
import napCleanupTransformer from './transformers/nap-cleanup.js';
import napSectionsTransformer from './transformers/nap-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.nap.edu.au/home"
  ],
  "representativeUrl": "https://www.nap.edu.au/home",
  "description": "NAP home page: banner carousel with side caption, three article cards and a What's New news panel",
  "urlPattern": "/*",
  "blocks": [
    {
      "name": "carousel-side-caption",
      "instances": [
        "#home-carousel",
        "section.banner .carousel"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        "#content1 .divarticle",
        ".bottom-section .divarticle"
      ]
    },
    {
      "name": "cards-news",
      "instances": [
        "#content1 .whatsnew",
        "article.divNewsContent .whatsnew"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc4",
      "name": "Banner carousel",
      "selector": [
        "section.banner",
        "#form1 > section.banner"
      ],
      "style": "blue",
      "blocks": [
        "carousel-side-caption"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "Featured articles and What's New",
      "selector": [
        "#content1",
        ".bottom-section"
      ],
      "style": "split",
      "blocks": [
        "cards-article",
        "cards-news"
      ],
      "defaultContent": [
        "article.divNewsContent > h3"
      ]
    }
  ]
};

const parsers = {
  'carousel-side-caption': carouselSideCaptionParser,
  'cards-article': cardsArticleParser,
  'cards-news': cardsNewsParser,
};
const transformers = [napCleanupTransformer, napSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
