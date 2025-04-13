"use strict";

const body = document.body;
const bgColorsBody = ["#1d1d27", "#1d1d27", "#1d1d27"];
const contentUrls = [
    
    //"https://kiki-vad.vercel.app/",
    //"https://dynamic-firmware-1pfdaz.sandbox.livekit.io/",
    //"https://martinmyburgh.com",
    "https://www.canva.com/design/DAGgSanASzI/80HJUq62so6lI1L8lvKRdQ/view?utm_content=DAGgSanASzI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8551f64472&embed",
    "https://kiki-vad.vercel.app/",
    "https://expanded-hours-714045.framer.app/",
    //"https://dynamic-firmware-1pfdaz.sandbox.livekit.io/",
    //"https://kiki-frontend.vercel.app/",
    //"https://cleverkiki.com/",
    //"https://www.canva.com/design/DAGgMiILC-E/_SR0tXhCR6VoXWvAmSLC3Q/view?utm_content=DAGgMiILC-E&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hb391574f53&embed"
    //"https://expanded-hours-714045.framer.app/",
    //"https://martinmyburgh.com"
    
];

window.wakeLock = null;
let wakeLockTimer = null;

// Function to request wake lock
async function requestWakeLock() {
    try {
        window.wakeLock = await navigator.wakeLock.request('screen');
        resetWakeLockTimer();
    } catch (err) {
        console.error('Wake Lock request failed:', err);
    }
}

// Function to release wake lock
async function releaseWakeLock() {
    if (window.wakeLock) {
        try {
            await window.wakeLock.release();
            window.wakeLock = null;
        } catch (err) {
            console.error('Wake Lock release failed:', err);
        }
    }
}

// Function to reset the wake lock timer
function resetWakeLockTimer() {
    if (wakeLockTimer) {
        clearTimeout(wakeLockTimer);
    }
    wakeLockTimer = setTimeout(() => {
        releaseWakeLock();
    }, 60000); // 60 seconds
}

// Function to handle menu animation
function handleMenuAnimation(menu, button) {
    if (!menu || !button) return;

    // Remove active class from all buttons
    menu.querySelectorAll('.menu__item').forEach(item => {
        item.classList.remove('active');
    });

    // Remove any existing timeOut property and reset duration
    menu.style.setProperty('--duration', '0.7s');
    menu.style.removeProperty('--timeOut');

    // Force a reflow to ensure the animation triggers
    void menu.offsetWidth;

    // Add active class to trigger animation
    button.classList.add('active');

    // Trigger animation for the menu border
    const menuBorder = menu.querySelector('.menu__border');
    if (menuBorder) {
        const offsetActiveItem = button.getBoundingClientRect();
        const left = Math.floor(
            offsetActiveItem.left -
            menu.offsetLeft -
            (menuBorder.offsetWidth - offsetActiveItem.width) / 2
        ) + "px";
        menuBorder.style.transform = `translate3d(${left}, 0 , 0)`;
    }
}

// Function to update state
function updateState(index, pushState = true) {
    const menu = document.querySelector('.menu');
    if (!menu) return;

    const buttons = Array.from(menu.querySelectorAll('.menu__item'));
    const button = buttons[index];
    if (!button) return;

    // Update iframe source
    const menuContentIframe = document.getElementById('view');
    if (menuContentIframe && menuContentIframe.src !== contentUrls[index]) {
        menuContentIframe.src = contentUrls[index];
    }

    // Update background color
    body.style.backgroundColor = bgColorsBody[index];

    // Handle menu animation
    handleMenuAnimation(menu, button);

    // Update URL and history state
    const url = new URL(window.location.href);
    url.searchParams.set('tab', index);
    
    if (pushState) {
        // When pushing a new state, include both the index and the previous URL
        const state = {
            index,
            previousUrl: window.location.href
        };
        history.pushState(state, '', url.toString());
    } else {
        // When replacing state (like during initialization), just include the index
        history.replaceState({ index }, '', url.toString());
    }
}

// Function to handle button clicks
function handleButtonClick(event) {
    const button = event.currentTarget;
    if (!button) return;

    const menu = button.closest('.menu');
    if (!menu) return;

    const index = Array.from(menu.querySelectorAll('.menu__item')).indexOf(button);
    if (index === -1) return;

    updateState(index, true);
}

// Function to get initial tab from URL
function getInitialTab() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab ? parseInt(tab) : 0;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers to menu items
    const menuItems = document.querySelectorAll('.menu__item');
    menuItems.forEach(item => {
        item.addEventListener('click', handleButtonClick);
    });

    // Set up wake lock event listeners
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, resetWakeLockTimer);
    });

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await requestWakeLock();
        } else {
            await releaseWakeLock();
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        // Get the index from the state, fallback to URL params if state is empty
        const index = event.state?.index ?? getInitialTab();
        
        // Update the state without pushing to history
        updateState(index, false);
    });

    // Set initial state
    const initialTab = getInitialTab();
    
    // Initialize with a clean history state
    const initialState = { index: initialTab };
    history.replaceState(initialState, '', window.location.href);
    
    // Update the UI
    updateState(initialTab, false);

    // Initial wake lock request
    requestWakeLock();
});
