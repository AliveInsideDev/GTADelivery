// Limits the freq of function calls
export function throttle(callback, delay) {
    let lastCallTime = 0;

    return function (...args) {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;

        // If enough time has passed, call the callback
        if (timeSinceLastCall >= delay) {
            lastCallTime = currentTime;
            callback(...args);
        }
    };
}

// Defer the execution of the function until the calls stop
export function debounce(callback, delay) {
    let timeoutId = null;

    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}


