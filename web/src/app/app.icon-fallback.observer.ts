import { dd } from "./doro/helpers/dd";

export function initializeIconFallback() {
	return () => {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === 1) {
						processElement(node as HTMLElement);
					}
				});
			});
		});
    
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
    
		// Process existing elements
		setTimeout(() => {
			document.querySelectorAll('i').forEach(processElement);
		}, 1000);
    
		function processElement(element: HTMLElement) {
			if (element.tagName === 'I') {
				setTimeout(() => checkAndApplyFallback(element), 500);
			}
			element.querySelectorAll?.('i').forEach(el => {
				setTimeout(() => checkAndApplyFallback(el), 500);
			});
		}
    
		function checkAndApplyFallback(element: HTMLElement) {
			const className = element.className || '';
			
			if (element.hasAttribute('data-fallback-applied')) return;
      
			const rect = element.getBoundingClientRect();
			if (rect.width <= 1) {
				applyFallback(element);
			}
		}
    
		function applyFallback(element: HTMLElement) {
			element.setAttribute('data-fallback-applied', 'true');
			const text = element.getAttribute('title') || 'Action';
			element.textContent = text;
			element.style.cssText = `
		        border-radius: 4px;
				padding: 0px 3px;
				border-width: thin;
				border-style: solid;
				font-family: monospace;
				cursor: pointer;
		    `;
		}
    
		return Promise.resolve();
	};
}