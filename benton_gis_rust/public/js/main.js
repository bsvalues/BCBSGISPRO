// TerraFusion Platform - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation toggle
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', function() {
            const nav = document.querySelector('nav ul');
            nav.classList.toggle('active');
        });
    }
    
    // Add active class to current navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        // Check if the link href matches the current path
        // or if it's the home link and we're on the home page
        if (link.getAttribute('href') === currentPath || 
            (link.getAttribute('href') === '/' && currentPath === '/')) {
            link.classList.add('active');
        }
    });
    
    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
            tooltip.style.left = `${rect.left + window.scrollX + (rect.width/2) - (tooltip.offsetWidth/2)}px`;
            
            this.addEventListener('mouseleave', function() {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    });
});