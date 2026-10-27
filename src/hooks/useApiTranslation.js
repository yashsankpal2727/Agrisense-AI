import { useEffect, useRef, useState } from 'react';

const BATCH_SIZE = 30;
const MAX_BATCH_CHARACTERS = 8000;
const MAX_TEXT_LENGTH = 2000;
const TRANSLATABLE_ATTRIBUTES = ['alt', 'aria-label', 'placeholder', 'title'];
const IGNORED_ELEMENTS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'CODE',
  'PRE',
]);

export function useApiTranslation(language) {
  const [status, setStatus] = useState('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const generation = useRef(0);
  const translations = useRef(new Map());
  const textNodes = useRef(new Map());
  const attributeNodes = useRef(new Map());
  const failedTranslations = useRef(new Set());

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const cache = translations.current;
    const trackedTextNodes = textNodes.current;
    const trackedAttributes = attributeNodes.current;
    const root = document.getElementById('root');
    const languageCode = {
      English: 'en',
      Hindi: 'hi',
      Marathi: 'mr',
    }[language] || 'en';

    document.documentElement.lang = languageCode;

    if (!root) return undefined;

    trackedTextNodes.forEach((entry, node) => {
      if (node.isConnected && entry.translated && node.nodeValue === entry.translated) {
        node.nodeValue = entry.source;
      }
      entry.translated = '';
      if (!node.isConnected) trackedTextNodes.delete(node);
    });

    trackedAttributes.forEach((attributes, element) => {
      attributes.forEach((entry, name) => {
        if (element.isConnected && entry.translated && element.getAttribute(name) === entry.translated) {
          element.setAttribute(name, entry.source);
        }
        entry.translated = '';
        if (!element.isConnected) attributes.delete(name);
      });
      if (!element.isConnected || attributes.size === 0) {
        trackedAttributes.delete(element);
      }
    });

    if (language === 'English') {
      setStatus('ready');
      setErrorMessage('');
      return undefined;
    }

    let timer;
    let stopped = false;
    let quotaBlocked = false;
    let requestInFlight = false;
    const pending = new Set();

    const queueEntry = (kind, node, name, entry) => {
      const source = entry.source.trim();
      if (!source || source.length > MAX_TEXT_LENGTH) return;
      const key = `${language}\u0000${source}`;
      if (cache.has(key)) {
        const translated = cache.get(key);
        if (kind === 'text') {
          if (node.nodeValue === translated) {
            entry.translated = translated;
            return;
          }
          if (node.nodeValue === entry.source || node.nodeValue === entry.translated) {
            node.nodeValue = translated;
            entry.translated = translated;
          }
        } else {
          const current = node.getAttribute(name);
          if (current === translated) {
            entry.translated = translated;
            return;
          }
          if (current === entry.source || current === entry.translated) {
            node.setAttribute(name, translated);
            entry.translated = translated;
          }
        }
        return;
      }
      if (!failedTranslations.current.has(key)) {
        pending.add({ kind, node, name, entry, source });
      }
    };

    const collectText = (node) => {
      const current = node.nodeValue || '';
      if (!current.trim()) return;

      let entry = trackedTextNodes.get(node);
      if (!entry) {
        entry = { source: current, translated: '' };
        trackedTextNodes.set(node, entry);
      } else if (entry.translated && current !== entry.translated) {
        entry.source = current;
        entry.translated = '';
      }

      queueEntry('text', node, null, entry);
    };

    const collectAttributes = (element) => {
      if (IGNORED_ELEMENTS.has(element.tagName) || element.isContentEditable) return;

      let attributes = trackedAttributes.get(element);
      if (!attributes) {
        attributes = new Map();
        trackedAttributes.set(element, attributes);
      }

      TRANSLATABLE_ATTRIBUTES.forEach((name) => {
        const current = element.getAttribute(name);
        if (!current?.trim()) return;

        let entry = attributes.get(name);
        if (!entry) {
          entry = { source: current, translated: '' };
          attributes.set(name, entry);
        } else if (entry.translated && current !== entry.translated) {
          entry.source = current;
          entry.translated = '';
        }

        queueEntry('attribute', element, name, entry);
      });
    };

    const collect = (container) => {
      if (container.nodeType === Node.TEXT_NODE) {
        collectText(container);
        return;
      }
      if (container.nodeType !== Node.ELEMENT_NODE) return;

      const element = container;
      if (element.closest('svg') || element.closest('[translate="no"]')) return;
      collectAttributes(element);
      if (IGNORED_ELEMENTS.has(element.tagName) || element.isContentEditable) return;

      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
        acceptNode(node) {
          if (
            node.parentElement?.closest('svg, script, style, noscript, textarea, code, pre, [translate="no"]') ||
            (node.nodeType === Node.ELEMENT_NODE &&
              (IGNORED_ELEMENTS.has(node.tagName) || node.isContentEditable))
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          collectAttributes(node);
        } else {
          collectText(node);
        }
      }
    };

    const applyCachedTranslations = (entries) => {
      entries.forEach(({ kind, node, name, entry, source }) => {
        const translated = cache.get(`${language}\u0000${source}`);
        if (!translated) return;
        if (kind === 'text') {
          if (node.nodeValue === translated) {
            entry.translated = translated;
            return;
          }
          if (node.nodeValue === entry.source || node.nodeValue === entry.translated) {
            node.nodeValue = translated;
            entry.translated = translated;
          }
        } else {
          const current = node.getAttribute(name);
          if (current === translated) {
            entry.translated = translated;
            return;
          }
          if (current === entry.source || current === entry.translated) {
            node.setAttribute(name, translated);
            entry.translated = translated;
          }
        }
      });
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(translatePending, 120);
    };

    const translatePending = async () => {
      if (quotaBlocked || requestInFlight || pending.size === 0) return;

      const entries = Array.from(pending);
      pending.clear();
      const sources = [...new Set(entries.map((entry) => entry.source))];
      const batches = [];
      let batch = [];
      let batchCharacters = 0;

      sources.forEach((source) => {
        if (
          batch.length >= BATCH_SIZE ||
          batchCharacters + source.length > MAX_BATCH_CHARACTERS
        ) {
          batches.push(batch);
          batch = [];
          batchCharacters = 0;
        }
        batch.push(source);
        batchCharacters += source.length;
      });
      if (batch.length) batches.push(batch);

      requestInFlight = true;
      try {
        for (const texts of batches) {
          if (stopped || generation.current !== currentGeneration) return;
          setStatus('loading');
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, texts }),
          });
          const data = await response.json();
          if (!response.ok || data.status !== 'success') {
            const requestError = new Error(data.error || 'Translation request failed');
            requestError.retryable = data.retryable !== false;
            throw requestError;
          }

          texts.forEach((source, index) => {
            cache.set(`${language}\u0000${source}`, data.translations[index]);
          });
          applyCachedTranslations(entries);
        }

        if (!stopped && generation.current === currentGeneration) {
          setStatus('ready');
          setErrorMessage('');
        }
      } catch (error) {
        sources.forEach((source) => {
          failedTranslations.current.add(`${language}\u0000${source}`);
        });
        if (error.retryable === false) quotaBlocked = true;

        if (!stopped && generation.current === currentGeneration) {
          console.error('Language translation failed:', error);
          setErrorMessage(error.message || 'Translation service is temporarily unavailable.');
          setStatus(error.retryable === false ? 'quota' : 'error');
        }
      } finally {
        requestInFlight = false;
        if (pending.size && !quotaBlocked && !stopped) schedule();
      }
    };

    collect(root);
    collect(document.head);
    schedule();

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'characterData') {
          collectText(record.target);
        } else if (record.type === 'attributes') {
          collectAttributes(record.target);
        } else {
          record.addedNodes.forEach(collect);
          record.removedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) trackedTextNodes.delete(node);
            if (node.nodeType === Node.ELEMENT_NODE) {
              trackedAttributes.delete(node);
              node.querySelectorAll('*').forEach((child) => trackedAttributes.delete(child));
              const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
              let textNode;
              while ((textNode = walker.nextNode())) trackedTextNodes.delete(textNode);
            }
          });
        }
      });
      if (pending.size) schedule();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });
    observer.observe(document.head, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [language, retryToken]);

  const retry = () => {
    failedTranslations.current.clear();
    setErrorMessage('');
    setRetryToken((current) => current + 1);
  };

  return { status, errorMessage, retry };
}
