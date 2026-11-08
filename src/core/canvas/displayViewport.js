// Keep widget geometry in display pixels; fit only the browser presentation.
export function getDisplayScale(width, height, viewportWidth, viewportHeight) {
    if (![width, height, viewportWidth, viewportHeight].every(value => Number.isFinite(value) && value > 0)) return 1;
    return Math.min(1, viewportWidth / width, viewportHeight / height);
}

export function fitDisplayViewport(width, height) {
    const update = () => {
        const scale = getDisplayScale(width, height, window.innerWidth, window.innerHeight);
        document.documentElement.style.setProperty('--cherry-display-scale', String(scale));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
}
