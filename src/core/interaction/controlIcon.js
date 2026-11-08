// A single stroke-based icon set shared by standalone and grouped controls.
const paths = {
    wifi: '<path d="M2 8.8a16 16 0 0 1 20 0M5 12.2a11 11 0 0 1 14 0M8.5 15.7a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
    bluetooth: '<path d="m7 7 10 10-5 4V3l5 4L7 17"/>',
    darkMode: '<path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z"/>',
    colorMode: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16" fill="currentColor" stroke="none"/>',
    doNotDisturb: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    volume: '<path d="m4 9 4 0 5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/>',
    brightness: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    microphone: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3m-4 0h8"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};

export function setControlIcon(element, id) {
    if (!paths[id]) return false;
    element.innerHTML = `<svg class="cherry-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[id]}</svg>`;
    element.setAttribute('aria-hidden', 'true');
    return true;
}
