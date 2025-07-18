// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

// Input validation and sanitization
export const VALIDATION = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB limit
    ALLOWED_FILE_TYPES: ['.l5x', '.xml'],
    MAX_TREE_DEPTH: 10,
    MAX_SEARCH_LENGTH: 100,
    SANITIZE_REGEX: /[<>\"'&]/g,
    XML_ENTITIES: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    }
};

// Error handling and logging
export const ERROR_CODES = {
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    XML_PARSE_ERROR: 'XML_PARSE_ERROR',
    INVALID_L5X_STRUCTURE: 'INVALID_L5X_STRUCTURE',
    TREE_RENDER_ERROR: 'TREE_RENDER_ERROR',
    SECURITY_VIOLATION: 'SECURITY_VIOLATION'
};

// Security settings
export const SECURITY = {
    MAX_VIOLATIONS: 5
};

// Studio 5000 Color Scheme
export const COLORS = {
    PRIMARY_BG: '#1e3a8a',
    SECONDARY_BG: '#f8fafc',
    CONTENT_BG: '#ffffff',
    BORDER_COLOR: '#e2e8f0',
    ACCENT_COLOR: '#2563eb',
    TEXT_COLOR: '#1f2937',
    LIGHT_TEXT: '#f1f5f9',
    MUTED_TEXT: '#6b7280',
    HOVER_BG: '#f1f5f9',
    SELECTED_BG: '#dbeafe',
    ERROR_COLOR: '#dc2626',
    WARNING_COLOR: '#f59e0b',
    SUCCESS_COLOR: '#059669',
    
    // Tree-specific colors
    TREE_BG: '#ffffff',
    TREE_BORDER: '#e2e8f0',
    TREE_HOVER: '#f8fafc',
    TREE_SELECTED: '#eff6ff',
    TREE_SELECTED_BORDER: '#2563eb',
    
    // Element type colors
    TASK_CONTINUOUS: '#059669',
    TASK_PERIODIC: '#f59e0b',
    TASK_EVENT: '#dc2626',
    ROUTINE_RLL: '#2563eb',
    ROUTINE_ST: '#7c3aed',
    ROUTINE_FBD: '#ea580c',
    TAG_BOOL: '#059669',
    TAG_INT: '#2563eb',
    TAG_REAL: '#7c3aed',
    TAG_TIMER: '#f59e0b',
    TAG_COUNTER: '#dc2626',
    TAG_STRING: '#0891b2',
    TAG_GROUP: '#059669'
};

// Icon mappings for different node types
export const ICONS = {
    CONTROLLER: '🏭',
    TAGS_SECTION: '🏷️',
    TASKS_SECTION: '⚡',
    MOTION_SECTION: '🎛️',
    DATATYPES_SECTION: '📊',
    IO_SECTION: '🔌',
    SAFETY_SECTION: '🛡️',
    EVENT_TASKS_SECTION: '⚡',
    TRENDS_SECTION: '📈',
    
    // Task types
    TASK_CONTINUOUS: '🔄',
    TASK_PERIODIC: '⏰',
    TASK_EVENT: '⚡',
    
    // Program and routine types
    PROGRAM: '📋',
    PROGRAMS_SECTION: '📋',
    ROUTINES_SECTION: '🪜',
    PROGRAM_TAGS: '🏷️',
    PARAMETERS_SECTION: '⚙️',
    TASK_PROPERTIES: '⚙️',
    
    // Routine types
    ROUTINE_RLL: '🪜',
    ROUTINE_ST: '📄',
    ROUTINE_FBD: '🔧',
    ROUTINE_SFC: '⚡',
    
    // Tag types
    TAG_BOOL: '🔘',
    TAG_DINT: '🔢',
    TAG_REAL: '📊',
    TAG_STRING: '📝',
    TAG_TIMER: '⏱️',
    TAG_COUNTER: '🔢',
    TAG_UDT: '📋',
    TAG_ARRAY: '📦',
    TAG_TYPE_GROUP: '🏷️',
    PRODUCED_CONSUMED_TAGS: '🔄',
    
    // Motion types
    MOTION_GROUP: '🎛️',
    MOTION_INSTRUCTIONS: '📊',
    MOTION_INSTRUCTION: '📊',
    
    // Data types
    DATATYPE: '📋',
    ADDON_INSTRUCTIONS: '🔗',
    ADDON_INSTRUCTION: '🔗',
    
    // I/O types
    LOCAL_IO: '🔌',
    ETHERNET_IP: '🌐',
    DEVICENET: '🔗',
    CONTROLNET: '📡',
    OTHER_NETWORKS: '🏭',
    NETWORK: '🏭',
    IO_MODULE: '📟',
    
    // Safety types
    SAFETY_TASK: '🛡️',
    SAFETY_IO: '🚨',
    SAFETY_CONFIG: '⚠️',
    SAFETY_MODULE: '🚨',
    
    // Event types
    EVENT_TASK: '⚡',
    EVENT_CONFIG: '📋',
    
    // Trends and diagnostics
    TREND_CONFIG: '📈',
    TREND: '📈',
    DIAGNOSTIC_LOGS: '🔍',
    DIAGNOSTIC_LOG: '🔍',
    PERFORMANCE_DATA: '📊',
    
    // Default
    DEFAULT: '📄'
};

// Default configuration
export const DEFAULT_CONFIG = {
    AUTO_EXPAND_CONTROLLER: true,
    SHOW_WELCOME_MESSAGE: true,
    ENABLE_SEARCH: true,
    ENABLE_KEYBOARD_NAVIGATION: true,
    ENABLE_ACCESSIBILITY: true
}; 