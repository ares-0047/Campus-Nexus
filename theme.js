// Grab the toggle button if it exists on the page
const themeToggleBtn = document.getElementById('themeToggle');

// 1. Check if the user already chose a theme in the past
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    // Apply the saved theme to the entire HTML document
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // If it's dark, make sure the button shows the Sun icon
    if (currentTheme === 'dark' && themeToggleBtn) {
        themeToggleBtn.innerText = '☀️';
    }
}

// 2. Listen for clicks on the toggle switch
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        
        if (theme === 'dark') {
            // Switch to Light Mode
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerText = '🌙';
        } else {
            // Switch to Dark Mode
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerText = '☀️';
        }
    });
}