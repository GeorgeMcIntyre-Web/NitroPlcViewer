// ============================================================================
// TREE RENDERER MODULE
// ============================================================================

import { ICONS } from './config.js';
import { sanitizeInput } from './utils.js';

// Enhanced icon mapping for all Studio 5000 node types
export function getNodeIcon(nodeType, subType = '') {
    const type = nodeType?.toLowerCase() || '';
    const sub = subType?.toLowerCase() || '';
    
    // Controller and main sections
    if (type === 'controller') return ICONS.CONTROLLER;
    if (type === 'tags-section') return ICONS.TAGS_SECTION;
    if (type === 'tasks-section') return ICONS.TASKS_SECTION;
    if (type === 'motion-section') return ICONS.MOTION_SECTION;
    if (type === 'datatypes-section') return ICONS.DATATYPES_SECTION;
    if (type === 'io-section') return ICONS.IO_SECTION;
    if (type === 'safety-section') return ICONS.SAFETY_SECTION;
    if (type === 'event-tasks-section') return ICONS.EVENT_TASKS_SECTION;
    if (type === 'trends-section') return ICONS.TRENDS_SECTION;
    
    // Task types
    if (type.startsWith('task-')) {
        if (sub.includes('continuous')) return ICONS.TASK_CONTINUOUS;
        if (sub.includes('periodic')) return ICONS.TASK_PERIODIC;
        if (sub.includes('event')) return ICONS.TASK_EVENT;
        return ICONS.TASK_EVENT;
    }
    
    // Program and routine types
    if (type === 'program') return ICONS.PROGRAM;
    if (type === 'programs-section') return ICONS.PROGRAMS_SECTION;
    if (type === 'routines-section') return ICONS.ROUTINES_SECTION;
    if (type === 'program-tags') return ICONS.PROGRAM_TAGS;
    if (type === 'parameters-section') return ICONS.PARAMETERS_SECTION;
    if (type === 'task-properties') return ICONS.TASK_PROPERTIES;
    
    if (type.startsWith('routine-')) {
        if (sub.includes('rll') || sub.includes('ladder')) return ICONS.ROUTINE_RLL;
        if (sub.includes('st') || sub.includes('structured')) return ICONS.ROUTINE_ST;
        if (sub.includes('fbd') || sub.includes('function')) return ICONS.ROUTINE_FBD;
        if (sub.includes('sfc') || sub.includes('sequential')) return ICONS.ROUTINE_SFC;
        return ICONS.ROUTINE_ST;
    }
    
    // Tag types
    if (type.startsWith('tag-')) {
        if (sub.includes('bool')) return ICONS.TAG_BOOL;
        if (sub.includes('int') || sub.includes('dint')) return ICONS.TAG_DINT;
        if (sub.includes('real') || sub.includes('float')) return ICONS.TAG_REAL;
        if (sub.includes('timer')) return ICONS.TAG_TIMER;
        if (sub.includes('counter')) return ICONS.TAG_COUNTER;
        if (sub.includes('string')) return ICONS.TAG_STRING;
        if (sub.includes('udt') || sub.includes('user_defined')) return ICONS.TAG_UDT;
        if (sub.includes('array')) return ICONS.TAG_ARRAY;
        return ICONS.TAG_TYPE_GROUP;
    }
    
    if (type === 'tag-type-group') return ICONS.TAG_TYPE_GROUP;
    if (type === 'produced-consumed-tags') return ICONS.PRODUCED_CONSUMED_TAGS;
    
    // Motion types
    if (type === 'motion-group') return ICONS.MOTION_GROUP;
    if (type === 'motion-instructions') return ICONS.MOTION_INSTRUCTIONS;
    if (type === 'motion-instruction') return ICONS.MOTION_INSTRUCTION;
    
    // Data types
    if (type === 'datatype') return ICONS.DATATYPE;
    if (type === 'addon-instructions') return ICONS.ADDON_INSTRUCTIONS;
    if (type === 'addon-instruction') return ICONS.ADDON_INSTRUCTION;
    
    // I/O types
    if (type === 'local-io') return ICONS.LOCAL_IO;
    if (type === 'ethernet-ip') return ICONS.ETHERNET_IP;
    if (type === 'devicenet') return ICONS.DEVICENET;
    if (type === 'controlnet') return ICONS.CONTROLNET;
    if (type === 'other-networks') return ICONS.OTHER_NETWORKS;
    if (type === 'network') return ICONS.NETWORK;
    if (type === 'io-module') return ICONS.IO_MODULE;
    
    // Safety types
    if (type === 'safety-task') return ICONS.SAFETY_TASK;
    if (type === 'safety-io') return ICONS.SAFETY_IO;
    if (type === 'safety-config') return ICONS.SAFETY_CONFIG;
    if (type === 'safety-module') return ICONS.SAFETY_MODULE;
    
    // Event types
    if (type === 'event-task') return ICONS.EVENT_TASK;
    if (type === 'event-config') return ICONS.EVENT_CONFIG;
    
    // Trends and diagnostics
    if (type === 'trend-config') return ICONS.TREND_CONFIG;
    if (type === 'trend') return ICONS.TREND;
    if (type === 'diagnostic-logs') return ICONS.DIAGNOSTIC_LOGS;
    if (type === 'diagnostic-log') return ICONS.DIAGNOSTIC_LOG;
    if (type === 'performance-data') return ICONS.PERFORMANCE_DATA;
    
    // Default fallback
    return ICONS.DEFAULT;
}

// Create tree node with security validation
export function createTreeNode({ id, name, type, icon, meta, children = [] }) {
    try {
        console.log('createTreeNode called with:', { id, name, type, icon, meta, children });
        
        // Validate inputs
        if (!id || !name || !type) {
            throw new Error('Invalid tree node parameters');
        }

        // Sanitize all inputs
        const sanitizedId = sanitizeInput(id, 50);
        const sanitizedName = sanitizeInput(name, 100);
        const sanitizedType = sanitizeInput(type, 30);
        const sanitizedIcon = sanitizeInput(icon || getNodeIcon(type), 10);
        const sanitizedMeta = sanitizeInput(meta, 100);

        // Create list item
        const li = document.createElement('li');
        li.className = 'tree-node';

        // Create tree item
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.setAttribute('data-id', sanitizedId);
        item.setAttribute('data-type', sanitizedType);
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'treeitem');
        item.setAttribute('aria-label', `${sanitizedName} ${sanitizedMeta}`);

        // Create toggle if children parameter is provided (even empty array means we want expandable)
        console.log('Checking children for toggle:', children, 'children !== undefined:', children !== undefined);
        if (children !== undefined) {
            console.log('Creating toggle for node:', sanitizedName);
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.textContent = '▶';
            toggle.setAttribute('aria-label', 'Expand');
            toggle.onclick = (e) => {
                e.stopPropagation();
                toggleNode(item);
            };
            item.appendChild(toggle);
        }

        // Create icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tree-icon';
        iconSpan.textContent = sanitizedIcon;
        iconSpan.setAttribute('aria-hidden', 'true');
        item.appendChild(iconSpan);

        // Create text
        const textSpan = document.createElement('span');
        textSpan.className = 'tree-text';
        textSpan.textContent = sanitizedName;
        item.appendChild(textSpan);

        // Create meta
        if (sanitizedMeta) {
            const metaSpan = document.createElement('span');
            metaSpan.className = 'tree-meta';
            metaSpan.textContent = sanitizedMeta;
            item.appendChild(metaSpan);
        }

        // Add click handler
        item.onclick = () => selectNode(item);
        item.onkeydown = (e) => handleTreeKeyboard(e, item);

        li.appendChild(item);

        // Add children container if children parameter is provided (even if empty)
        console.log('Checking children for container:', children, 'children !== undefined:', children !== undefined);
        if (children !== undefined) {
            console.log('Creating children container for node:', sanitizedName);
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'tree-children collapsed';
            childrenContainer.setAttribute('role', 'group');
            
            // Add any existing children
            children.forEach(child => {
                childrenContainer.appendChild(child);
            });
            
            li.appendChild(childrenContainer);
        }

        return li;

    } catch (error) {
        console.error('Tree node creation failed:', error);
        return document.createElement('li'); // Return empty node on error
    }
}

// Helper function to add children to an existing tree node
export function addChildrenToNode(parentNode, childNodes) {
    try {
        if (!parentNode || !childNodes || childNodes.length === 0) {
            return;
        }

        // Check if parent already has a children container
        let childrenContainer = parentNode.querySelector('.tree-children');
        
        if (!childrenContainer) {
            // Create children container
            childrenContainer = document.createElement('ul');
            childrenContainer.className = 'tree-children collapsed';
            childrenContainer.setAttribute('role', 'group');
            parentNode.appendChild(childrenContainer);
            
            // Add toggle button to parent if it doesn't have one
            const parentItem = parentNode.querySelector('.tree-item');
            if (parentItem && !parentItem.querySelector('.tree-toggle')) {
                const toggle = document.createElement('span');
                toggle.className = 'tree-toggle';
                toggle.textContent = '▶';
                toggle.setAttribute('aria-label', 'Expand');
                toggle.onclick = (e) => {
                    e.stopPropagation();
                    toggleNode(parentItem);
                };
                parentItem.insertBefore(toggle, parentItem.firstChild);
            }
        }

        // Add children to the container
        childNodes.forEach(child => {
            childrenContainer.appendChild(child);
        });

    } catch (error) {
        console.error('Adding children to node failed:', error);
    }
}

// Tree interaction functions
export function toggleNode(item) {
    try {
        const children = item.parentElement.querySelector('.tree-children');
        const toggle = item.querySelector('.tree-toggle');
        
        if (children && toggle) {
            const isCollapsed = children.classList.contains('collapsed');
            
            if (isCollapsed) {
                children.classList.remove('collapsed');
                toggle.textContent = '▼';
                toggle.classList.add('expanded');
                toggle.setAttribute('aria-label', 'Collapse');
                item.setAttribute('aria-expanded', 'true');
            } else {
                children.classList.add('collapsed');
                toggle.textContent = '▶';
                toggle.classList.remove('expanded');
                toggle.setAttribute('aria-label', 'Expand');
                item.setAttribute('aria-expanded', 'false');
            }
        }
    } catch (error) {
        console.error('Node toggle failed:', error);
    }
}

export function selectNode(item) {
    try {
        // Remove previous selection
        document.querySelectorAll('.tree-item.selected').forEach(selected => {
            selected.classList.remove('selected');
        });

        // Add selection to current item
        item.classList.add('selected');
        
        // Trigger custom event for content display
        const event = new CustomEvent('nodeSelected', {
            detail: {
                nodeType: item.getAttribute('data-type'),
                nodeName: item.querySelector('.tree-text')?.textContent || '',
                nodeId: item.getAttribute('data-id')
            }
        });
        document.dispatchEvent(event);

    } catch (error) {
        console.error('Node selection failed:', error);
    }
}

export function handleTreeKeyboard(event, item) {
    try {
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                selectNode(item);
                break;
            case 'ArrowRight':
                event.preventDefault();
                const toggle = item.querySelector('.tree-toggle');
                if (toggle) {
                    toggle.click();
                }
                break;
            case 'ArrowLeft':
                event.preventDefault();
                const parent = item.parentElement.parentElement;
                if (parent && parent.classList.contains('tree-children')) {
                    const parentItem = parent.previousElementSibling;
                    if (parentItem) {
                        parentItem.focus();
                    }
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                const next = item.parentElement.nextElementSibling;
                if (next && next.querySelector('.tree-item')) {
                    next.querySelector('.tree-item').focus();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                const prev = item.parentElement.previousElementSibling;
                if (prev && prev.querySelector('.tree-item')) {
                    prev.querySelector('.tree-item').focus();
                }
                break;
        }
    } catch (error) {
        console.error('Tree keyboard navigation failed:', error);
    }
}

// Tree management functions
export function expandAll() {
    try {
        document.querySelectorAll('.tree-children.collapsed').forEach(children => {
            children.classList.remove('collapsed');
            const toggle = children.previousElementSibling?.querySelector('.tree-toggle');
            if (toggle) {
                toggle.textContent = '▼';
                toggle.classList.add('expanded');
            }
        });
    } catch (error) {
        console.error('Expand all operation failed:', error);
    }
}

export function collapseAll() {
    try {
        document.querySelectorAll('.tree-children:not(.collapsed)').forEach(children => {
            children.classList.add('collapsed');
            const toggle = children.previousElementSibling?.querySelector('.tree-toggle');
            if (toggle) {
                toggle.textContent = '▶';
                toggle.classList.remove('expanded');
            }
        });
    } catch (error) {
        console.error('Collapse all operation failed:', error);
    }
}

// Search and filter functions
export function filterTree(query) {
    try {
        const items = document.querySelectorAll('.tree-item');
        const queryLower = query.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const node = item.closest('li');
            const matches = text.includes(queryLower);
            
            if (node) {
                node.style.display = matches || query === '' ? '' : 'none';
                
                if (matches && query !== '') {
                    // Expand parents to show matching items
                    expandParents(node);
                }
            }
        });
        
    } catch (error) {
        console.error('Tree filtering failed:', error);
    }
}

export function expandParents(node) {
    try {
        let parent = node.parentElement;
        while (parent && parent.classList.contains('tree-children')) {
            parent.classList.remove('collapsed');
            const parentItem = parent.previousElementSibling;
            if (parentItem) {
                const toggle = parentItem.querySelector('.tree-toggle');
                if (toggle) {
                    toggle.textContent = '▼';
                    toggle.classList.add('expanded');
                }
                parentItem.setAttribute('aria-expanded', 'true');
            }
            parent = parent.parentElement?.parentElement;
        }
    } catch (error) {
        console.error('Parent expansion failed:', error);
    }
} 