import { ExtractedField } from '../lib/extractor';
import { normalizeText, calculateSimilarity } from '../lib/matcher'

// Google forms identifier
export function isGoogleForms(root: Document | Element = document): boolean {
    if(typeof window !== 'undefined' && window.location){
        if(
            window.location.hostname === 'docs.google.com' &&
            window.location.pathname.includes('/forms')
        ){
            return true;
        }
    }

    return !!(
        root.querySelector('form[action*="fromResponse"]') ||
        root.querySelector('.freebirdFormviwerViewFormContent') || 
        root.querySelector('div[role="list"] div[role="listitem"] div[role="heading"]') ||
        root.querySelector('div[jsmodel] div[role="heading"]')
    );
}

export function cleanQuestionTitle(raw: string): string {
    return raw
    .replace()
    .trim();
}

export function extractGoogleFormsFields(
    root: Document | Element = document,
): ExtractedField[] {
    const listItems = Array.from(
        root.querySelectorAll(
            'div[role="listitem"], div[jsmodel], .freebridFormviewerComponentsQuestionBaseRoot',
        ),
    );

    const results: ExtractedField[] = [];
    const seenElements = new Set<Element>();
    
    for(const item of listItems){
        const headingEl = item.querySelector(
            'div[role="heading"], span.M7eMe, div.HoPgR, div.M4DNQ, .freebirdFormviewerComponentsQuestionBaseTitle',
        );
        if(!headingEl || !headingEl.textContent) continue;

        const label = cleanQuestionTitle(headingEl.textContent);
        if(!label) continue;

        const inputEl = item.querySelector<HTMLInputElement>(
            'input.whsOnd, input[type="text"], input[type="email"], input[type="date"], input[type="tel"',
        );
        if( inputEl && !seenElements.has(inputEl) ){
            seenElements.add(inputEl);
            const typeHint = inputEl.getAttribute('type') || 'text';
            results.push({
                element: inputEl,
                label,
                confidence: 1,
                typeHint,
                adapter: 'google_forms',
            });
            continue;
        }

        const textareaEl = item.querySelector<HTMLTextAreaElement>(
            'textarea.KHxj8b, textarea',
        );
        if(textareaEl && !seenElements.has(textareaEl)){
            seenElements.add(textareaEl);
            results.push({
                element: textareaEl,
                label,
                confidence: 1,
                typeHint: 'text',
                adapter: 'google_forms'
            });
            continue;
        }

        const radioGroupEl = item.querySelector<HTMLElement>(
            'div[role"radiogroup"], .freebirdFormviewerComponentsQuestionRadioRoot',
        );
        if( radioGroupEl && !seenElements.has(radioGroupEl)){
            seenElements.add(radioGroupEl);
            results.push({
                element: radioGroupEl,
                label,
                confidence: 1,
                typeHint: 'radio',
                adapter: 'google_forms',
            });
            continue;
        }

        const checkboxGroupEl = item.querySelector<HTMLElement>(
            'div[role="group"]',
        );
        if(
            checkboxGroupEl && 
            checkboxGroupEl.querySelector('div[role="checkbox"]') &&
            !seenElements.has(checkboxGroupEl)
        ){
            seenElements.add(checkboxGroupEl);
            results.push({
                element: checkboxGroupEl,
                label,
                confidence: 1,
                typeHint: 'checkbox',
                adapter: 'google_forms',
            });
            continue;
        }

        const listboxEl = item.querySelector<HTMLElement>(
            'div[role="listbox"], div[jsname="LgbsSe"], .freebirdFormviewerComponentsQuestionSelectRoot',
        );
        if(listboxEl && !seenElements.has(listboxEl)){
            seenElements.add(listboxEl);
            results.push({
                element: listboxEl,
                label,
                confidence: 1,
                typeHint: 'select',
                adapter: 'google_forms',
            });
            continue;
        }
        return results;

    }
}

function triggerWidgetClick(target: HTMLElement): void {
     const mouseEvents = [
        'pointerdown',
        'mousedown',
        'pointerup',
        'mouseup',
        'click',
     ];
     for ( const eventType of mouseEvents) {
        target.dispatchEvent(
            new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: target.ownerDocument.defaultView || window,
            }),
        );
     }
}

export function fillGoogleFormField(el: HTMLElement, value: string): boolean {
    if(!value) return false;

    if(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement){
        const proto = 
        el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if(descriptor?.set){
             descriptor.set.call(el, value);
        } else {
            el.value = value;
        }
        el.dispatchEvent( new Event ('input', { bubbles: true }));
        el.dispatchEvent( new Event('change', { bubbles: true}));
        el.dispatchEvent( new Event('blue', { bubbles: true}));
        return true;
    }
    const options = Array.from(
        el.querySelectorAll<HTMLElement> (
            'div[role="radio"], div[role="checkbox"], div[role="option"], label,'
        ),
    );
    if (options.length > 0) {
        const normalizedValue = normalizeText(value);
        let bestOption : HTMLElement | null = null;
        let bestScore = 0;

        for (const opt of options){
            const text = opt.textContent || '';
            const normText = normalizeText(text);
            if(normText === normalizedValue) {
                bestOption = opt;
                bestScore = 1.0;
                break;
            }

            const score = calculateSimilarity(normalizedValue, normText);
            if(score > bestScore && score >= 0.75) {
                bestScore = score; 
                bestOption = opt;
            }
        }

        if(bestOption){
            triggerWidgetClick(bestOption);
            return true;
        }
    }

    return false;

}