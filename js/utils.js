// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

import { VALIDATION, ERROR_CODES, SECURITY } from './config.js';

// Input sanitization function
export function sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') {
        return '';
    }
    if (input.length > maxLength) {
        input = input.substring(0, maxLength);
    }
    return input.replace(VALIDATION.SANITIZE_REGEX, (match) => {
        return VALIDATION.XML_ENTITIES[match] || match;
    });
}

// File validation
export function validateFile(file) {
    if (!file) {
        throw new Error('No file selected');
    }

    // Check file size
    if (file.size > VALIDATION.MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${VALIDATION.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = VALIDATION.ALLOWED_FILE_TYPES.some(type => fileName.endsWith(type));
    if (!isValidType) {
        throw new Error(`Invalid file type. Allowed types: ${VALIDATION.ALLOWED_FILE_TYPES.join(', ')}`);
    }

    return true;
}

// XML parsing with security
export function parseXMLSafely(xmlString) {
    try {
        // Check for potential XXE attacks
        if (xmlString.includes('<!DOCTYPE') || xmlString.includes('<!ENTITY')) {
            throw new Error('XML external entity processing not allowed');
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parsing failed: Invalid XML structure');
        }

        return xmlDoc;
    } catch (error) {
        throw new Error(`XML parsing error: ${error.message}`);
    }
}

// Error handling with user feedback
export function handleError(error, context = '') {
    const errorMessage = sanitizeInput(error.message || 'Unknown error');
    const errorContext = sanitizeInput(context);
    
    console.error(`Error in ${errorContext}:`, error);
    
    if (errorContext) {
        return `❌ Error in ${errorContext}: ${errorMessage}`;
    } else {
        return `❌ Error: ${errorMessage}`;
    }
}

// Security violation handler
export function handleSecurityViolation(violation, details = '', currentViolations = 0) {
    const newViolations = currentViolations + 1;
    console.warn(`Security violation ${newViolations}: ${violation}`, details);
    
    if (newViolations >= SECURITY.MAX_VIOLATIONS) {
        return { shouldDisable: true, violations: newViolations };
    }
    
    return { shouldDisable: false, violations: newViolations };
}

// Accessibility: screen reader announcement
export function announceToScreenReader(message) {
    try {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = sanitizeInput(message);
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    } catch (error) {
        console.error('Screen reader announcement failed:', error);
    }
}

// DOM element initialization with error handling
export function initializeElements(elementIds) {
    const elements = {};
    
    try {
        Object.entries(elementIds).forEach(([key, id]) => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Required DOM element not found: ${key} (${id})`);
            }
            elements[key] = element;
        });
        
        return elements;
    } catch (error) {
        console.error('DOM initialization failed:', error);
        throw new Error('Application initialization failed. Please refresh the page.');
    }
}

// Debounce function for search
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Deep clone object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate unique ID
export function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if element is visible in viewport
export function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll element into view with smooth animation
export function scrollIntoView(element, options = {}) {
    const defaultOptions = {
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
}

// Escape HTML entities
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Format date for display
export function formatDate(date) {
    if (!date) return 'Unknown';
    try {
        return new Date(date).toLocaleString();
    } catch (error) {
        return 'Invalid Date';
    }
} 