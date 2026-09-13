/**
 * machine-translation.ts
 *
 * @version 1.0.9
 * @author Yusuke Kamiyamane
 * @license MIT
 * @copyright Copyright (c) Yusuke Kamiyamane
 * @see {@link https://github.com/y14e/machine-translation-ts}
 */

// -----------------------------------------------------------------------------
// APIs
// -----------------------------------------------------------------------------

let isInitialized = false;

export function detectMachineTranslation(): () => void {
  if (isInitialized) {
    console.warn('Already initialized');
    return () => {};
  }

  const html = document.documentElement;
  const title = document.querySelector('title');

  if (!title) {
    throw new Error('Missing <title> element');
  }

  const language = new Intl.Locale(navigator.language).language;
  const strategies = [
    {
      attribute: 'class',
      element: html,
      test: () =>
        [...html.classList].some((c: string) => /translated-(ltr|rtl)/.test(c)),
    },
    {
      attribute: '_msttexthash',
      element: title,
      test: () => title.hasAttribute('_msttexthash'),
    },
    {
      attribute: 'lang',
      element: html,
      test: () => new Intl.Locale(html.lang).language !== language,
    },
  ];

  const map = new Map<Element, string[]>();

  for (const { attribute: a, element: e } of strategies) {
    (map.has(e) ? map.get(e) : map.set(e, []).get(e))?.push(a);
  }

  let timer: number | undefined;

  function onMutate(): void {
    if (timer !== undefined) {
      return;
    }

    timer = requestAnimationFrame(() => {
      if (!strategies.some((s) => s.test())) {
        return;
      }

      window.dispatchEvent(new CustomEvent('machinetranslationdetected'));
      observer?.disconnect();
      observer = null;
    });
  }

  let observer: MutationObserver | null = new MutationObserver(onMutate);

  for (const [e, a] of map) {
    observer.observe(e, { attributeFilter: a });
  }

  isInitialized = true;

  return () => {
    observer?.disconnect();
    observer = null;

    if (timer !== undefined) {
      cancelAnimationFrame(timer);
      timer = undefined;
    }

    isInitialized = false;
  };
}
