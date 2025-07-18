// ============================================================================
// MAIN APPLICATION MODULE
// ============================================================================

import { VALIDATION, SECURITY } from './config.js';
import { 
    sanitizeInput, 
    validateFile, 
    parseXMLSafely, 
    handleError, 
    handleSecurityViolation, 
    announceToScreenReader,
    initializeElements,
    debounce
} from './utils.js';
import { parseL5X } from './parser.js';
import { 
    createTreeNode, 
    addChildrenToNode, 
    expandAll, 
    collapseAll, 
    filterTree 
} from './treeRenderer.js';
import { 
    showNodeContent, 
    setProjectData, 
    showProjectInfo 
} from './contentDisplay.js';

// Application state
let projectData = null;
let selectedItem = null;
let searchQuery = '';
let treeState = new Map();
let securityViolations = 0;

// DOM elements
let elements = {};

// Initialize DOM elements
function setupElements() {
    const elementIds = {
        fileInput: 'fileInput',
        searchInput: 'searchInput',
        statusText: 'statusText',
        statusDetails: 'statusDetails',
        treePanel: 'treePanel',
        treeContent: 'treeContent',
        contentHeader: 'contentHeader',
        contentTitle: 'contentTitle',
        contentMeta: 'contentMeta',
        rungContainer: 'rungContainer',
        resizer: 'resizer'
    };

    elements = initializeElements(elementIds);
}

// Setup event listeners
function setupEventListeners() {
    try {
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileSelect);
        }
        
        if (elements.searchInput) {
            const debouncedSearch = debounce(handleSearch, 300);
            elements.searchInput.addEventListener('input', debouncedSearch);
            elements.searchInput.addEventListener('keydown', handleSearchKeyboard);
        }

        // Setup resizer functionality
        setupResizer();

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });

        // Node selection event listener
        document.addEventListener('nodeSelected', (event) => {
            const { nodeType, nodeName, nodeId } = event.detail;
            showNodeContent(nodeType, nodeName, nodeId);
        });

    } catch (error) {
        console.error('Event listener setup failed:', error);
    }
}

// File handling functions
export function openFile() {
    try {
        if (!elements.fileInput) {
            throw new Error('File input element not available');
        }
        elements.fileInput.click();
    } catch (error) {
        console.error('File open operation failed:', error);
        updateStatus(handleError(error, 'File open operation'));
    }
}



function handleFileSelect(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        validateFile(file);

        updateStatus(`Loading ${sanitizeInput(file.name)}...`);
        showLoading();

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const xmlString = e.target.result;
                
                // Validate XML string
                if (typeof xmlString !== 'string' || xmlString.length === 0) {
                    throw new Error('Invalid file content');
                }

                // Parse XML safely
                const xmlDoc = parseXMLSafely(xmlString);
                
                // Validate L5X structure
                const controller = xmlDoc.querySelector('Controller');
                if (!controller) {
                    throw new Error('Invalid L5X file - No Controller element found');
                }

                // Parse project data
                projectData = parseL5X(xmlDoc);
                if (!projectData || !projectData.controller) {
                    throw new Error('Failed to parse L5X file structure');
                }

                // Set project data for content display
                setProjectData(projectData);

                // Render project tree
                renderProjectTree(projectData);
                updateStatus(`✅ ${sanitizeInput(projectData.controller.name)} loaded successfully`);
                showProjectInfo();
                
                // Reset security violations on successful load
                securityViolations = 0;
                
            } catch (error) {
                const errorMessage = handleError(error, 'File processing');
                updateStatus(errorMessage);
                showError(errorMessage);
            }
        };
        
        reader.onerror = () => {
            const errorMessage = handleError(new Error('Failed to read file'), 'File reading');
            updateStatus(errorMessage);
            showError(errorMessage);
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        const errorMessage = handleError(error, 'File selection');
        updateStatus(errorMessage);
        showError(errorMessage);
    }
}

// Search functionality
function handleSearch() {
    try {
        const query = elements.searchInput.value;
        
        // Validate search query
        if (query.length > VALIDATION.MAX_SEARCH_LENGTH) {
            elements.searchInput.value = query.substring(0, VALIDATION.MAX_SEARCH_LENGTH);
            return;
        }
        
        searchQuery = sanitizeInput(query);
        filterTree(searchQuery);
        
    } catch (error) {
        console.error('Search operation failed:', error);
    }
}

function handleSearchKeyboard(event) {
    if (event.key === 'Escape') {
        clearSearch();
    }
}

// Clear search function
function clearSearch() {
    try {
        if (elements.searchInput) {
            elements.searchInput.value = '';
            searchQuery = '';
            filterTree('');
            elements.searchInput.blur();
        }
    } catch (error) {
        console.error('Clear search failed:', error);
    }
}

// Tree rendering functions
function renderProjectTree(data) {
    try {
        if (!data || !data.controller) {
            throw new Error('Invalid project data for tree rendering');
        }

        // Clear existing tree
        if (elements.treeContent) {
            elements.treeContent.innerHTML = '';
        }

        // Create root controller node
        const controllerNode = createTreeNode({
            id: 'controller',
            name: data.controller.name,
            type: 'controller',
            icon: '🏭',
            meta: `${data.controller.processortype || 'Unknown'} - v${data.controller.majorrev || '0'}.${data.controller.minorrev || '0'}`
        });

        // Render all sections
        renderControllerTags(controllerNode, data);
        renderTasks(controllerNode, data);
        renderMotionGroups(controllerNode, data);
        renderDataTypes(controllerNode, data);
        renderIOConfiguration(controllerNode, data);
        renderSafety(controllerNode, data);
        renderEventTasks(controllerNode, data);
        renderTrendsAndDiagnostics(controllerNode, data);

        // Add to tree content
        if (elements.treeContent) {
            elements.treeContent.appendChild(controllerNode);
            
            // Expand the controller node by default
            setTimeout(() => {
                const controllerItem = controllerNode.querySelector('.tree-item');
                if (controllerItem) {
                    toggleNode(controllerItem);
                }
            }, 50);
        }

        // Show tree panel and resizer
        if (elements.treePanel) {
            elements.treePanel.style.display = 'flex';
        }
        if (elements.resizer) {
            elements.resizer.style.display = 'block';
        }

        // Reset tree state
        treeState.clear();

    } catch (error) {
        console.error('Tree rendering failed:', error);
        throw error;
    }
}

// Section rendering functions
function renderControllerTags(controllerNode, data) {
    if (data.controllerTags && data.controllerTags.length > 0) {
        const tagsNode = createTreeNode({
            id: 'controller-tags',
            name: 'Controller Tags',
            type: 'tags-section',
            icon: '🏷️',
            meta: `${data.controllerTags.length} tags`
        });

        // Create tag type groups
        const tagTypeGroups = organizeTagsByType(data.controllerTags);
        Object.entries(tagTypeGroups).forEach(([type, tags]) => {
            const typeNode = createTreeNode({
                id: `tag-type-${type}`,
                name: `${type} Tags`,
                type: 'tag-type-group',
                icon: getTagTypeIcon(type),
                meta: `${tags.length} tags`
            });

            const tagNodes = [];
            tags.forEach(tag => {
                const tagNode = createTreeNode({
                    id: `tag-${tag.name}`,
                    name: tag.name,
                    type: `tag-${tag.datatype?.toLowerCase() || 'unknown'}`,
                    icon: getTagIcon(tag.datatype),
                    meta: `${tag.datatype || 'Unknown'}${tag.usage ? ` - ${tag.usage}` : ''}`
                });
                tagNodes.push(tagNode);
            });
            
            addChildrenToNode(typeNode, tagNodes);
            addChildrenToNode(tagsNode, [typeNode]);
        });

        // Add Produced/Consumed Tags subsection
        const producedConsumedTags = data.controllerTags.filter(tag => 
            tag.usage?.toLowerCase().includes('produced') || 
            tag.usage?.toLowerCase().includes('consumed')
        );
        
        if (producedConsumedTags.length > 0) {
            const producedConsumedNode = createTreeNode({
                id: 'produced-consumed-tags',
                name: 'Produced/Consumed Tags',
                type: 'produced-consumed-tags',
                icon: '🔄',
                meta: `${producedConsumedTags.length} tags`
            });

            const pcTagNodes = [];
            producedConsumedTags.forEach(tag => {
                const tagNode = createTreeNode({
                    id: `pc-tag-${tag.name}`,
                    name: tag.name,
                    type: `tag-${tag.datatype?.toLowerCase() || 'unknown'}`,
                    icon: getTagIcon(tag.datatype),
                    meta: `${tag.usage || 'Unknown'} - ${tag.datatype || 'Unknown'}`
                });
                pcTagNodes.push(tagNode);
            });

            addChildrenToNode(producedConsumedNode, pcTagNodes);
            addChildrenToNode(tagsNode, [producedConsumedNode]);
        }

        addChildrenToNode(controllerNode, [tagsNode]);
    }
}

// Helper functions for tag organization
function organizeTagsByType(tags) {
    const typeGroups = {
        'BOOL': [],
        'DINT': [],
        'REAL': [],
        'STRING': [],
        'TIMER': [],
        'COUNTER': [],
        'UDT': [],
        'Array': [],
        'Other': []
    };
    
    tags.forEach(tag => {
        const dataType = tag.datatype?.toUpperCase() || '';
        
        if (dataType.includes('BOOL')) {
            typeGroups['BOOL'].push(tag);
        } else if (dataType.includes('DINT') || dataType.includes('INT')) {
            typeGroups['DINT'].push(tag);
        } else if (dataType.includes('REAL') || dataType.includes('FLOAT')) {
            typeGroups['REAL'].push(tag);
        } else if (dataType.includes('STRING')) {
            typeGroups['STRING'].push(tag);
        } else if (dataType.includes('TIMER')) {
            typeGroups['TIMER'].push(tag);
        } else if (dataType.includes('COUNTER')) {
            typeGroups['COUNTER'].push(tag);
        } else if (dataType.includes('UDT') || dataType.includes('USER_DEFINED')) {
            typeGroups['UDT'].push(tag);
        } else if (dataType.includes('ARRAY') || tag.name?.includes('[')) {
            typeGroups['Array'].push(tag);
        } else {
            typeGroups['Other'].push(tag);
        }
    });
    
    // Remove empty groups and sort tags within each group
    const result = {};
    Object.entries(typeGroups).forEach(([type, tags]) => {
        if (tags.length > 0) {
            result[type] = tags.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    });
    
    return result;
}

function getTagTypeIcon(tagType) {
    const type = tagType?.toUpperCase() || '';
    switch (type) {
        case 'BOOL': return '🔘';
        case 'DINT': return '🔢';
        case 'REAL': return '📊';
        case 'STRING': return '📝';
        case 'TIMER': return '⏱️';
        case 'COUNTER': return '🔢';
        case 'UDT': return '📋';
        case 'ARRAY': return '📦';
        default: return '🏷️';
    }
}

function getTagIcon(dataType) {
    const type = dataType?.toLowerCase() || '';
    if (type.includes('bool')) return '🔘';
    if (type.includes('int') || type.includes('dint')) return '🔢';
    if (type.includes('real') || type.includes('float')) return '📊';
    if (type.includes('timer')) return '⏱️';
    if (type.includes('counter')) return '🔢';
    if (type.includes('string')) return '📝';
    if (type.includes('udt') || type.includes('user_defined')) return '📋';
    if (type.includes('array')) return '📦';
    return '🏷️';
}

// Placeholder functions for other sections (to be implemented)
function renderTasks(controllerNode, data) {
    if (data.tasks && data.tasks.length > 0) {
        const tasksNode = createTreeNode({
            id: 'tasks-section',
            name: 'Tasks',
            type: 'tasks-section',
            icon: '⚡',
            meta: `${data.tasks.length} tasks`
        });

        data.tasks.forEach(task => {
            const taskNode = createTreeNode({
                id: `task-${task.name}`,
                name: task.name,
                type: `task-${task.type?.toLowerCase() || 'event'}`,
                icon: getTaskIcon(task.type),
                meta: getTaskMeta(task)
            });

            // Add Programs subsection WITHIN this task
            if (task.programs && task.programs.length > 0) {
                const programsNode = createTreeNode({
                    id: `task-${task.name}-programs`,
                    name: 'Programs',
                    type: 'programs-section',
                    icon: '📁',
                    meta: `${task.programs.length} programs`
                });

                task.programs.forEach(program => {
                    const programNode = createTreeNode({
                        id: `program-${task.name}-${program.name}`,
                        name: program.name,
                        type: 'program',
                        icon: '📋',
                        meta: `Main Routine: ${program.mainroutinename || 'MainRoutine'}`
                    });

                    // Add Program Tags subsection
                    if (program.tags && program.tags.length > 0) {
                        const programTagsNode = createTreeNode({
                            id: `program-${task.name}-${program.name}-tags`,
                            name: 'Program Tags',
                            type: 'program-tags',
                            icon: '🏷️',
                            meta: `${program.tags.length} tags`
                        });

                        const tagNodes = [];
                        program.tags.forEach(tag => {
                            const tagNode = createTreeNode({
                                id: `program-tag-${task.name}-${program.name}-${tag.name}`,
                                name: tag.name,
                                type: `tag-${tag.datatype?.toLowerCase() || 'unknown'}`,
                                icon: getTagIcon(tag.datatype),
                                meta: `${tag.datatype || 'Unknown'}${tag.usage ? ` - ${tag.usage}` : ''}`
                            });
                            tagNodes.push(tagNode);
                        });
                        addChildrenToNode(programTagsNode, tagNodes);
                        addChildrenToNode(programNode, [programTagsNode]);
                    }

                    // Add Routines subsection
                    if (program.routines && program.routines.length > 0) {
                        const routinesNode = createTreeNode({
                            id: `program-${task.name}-${program.name}-routines`,
                            name: 'Routines',
                            type: 'routines-section',
                            icon: '🪜',
                            meta: `${program.routines.length} routines`
                        });

                        const routineNodes = [];
                        program.routines.forEach(routine => {
                            const routineNode = createTreeNode({
                                id: `routine-${task.name}-${program.name}-${routine.name}`,
                                name: routine.name,
                                type: `routine-${routine.type?.toLowerCase() || 'rll'}`,
                                icon: getRoutineIcon(routine.type),
                                meta: `${routine.type || 'RLL'}${routine.description ? ` - ${routine.description}` : ''}`
                            });
                            routineNodes.push(routineNode);
                        });
                        addChildrenToNode(routinesNode, routineNodes);
                        addChildrenToNode(programNode, [routinesNode]);
                    }

                    // Add Parameters & Local Tags subsection
                    if (program.parameters && program.parameters.length > 0) {
                        const parametersNode = createTreeNode({
                            id: `program-${task.name}-${program.name}-parameters`,
                            name: 'Parameters & Local Tags',
                            type: 'parameters-section',
                            icon: '⚙️',
                            meta: `${program.parameters.length} parameters`
                        });

                        const parameterNodes = [];
                        program.parameters.forEach(param => {
                            const paramNode = createTreeNode({
                                id: `parameter-${task.name}-${program.name}-${param.name}`,
                                name: param.name,
                                type: 'parameter',
                                icon: '⚙️',
                                meta: `${param.datatype || 'Unknown'}${param.required === 'true' ? ' (Required)' : ''}`
                            });
                            parameterNodes.push(paramNode);
                        });
                        addChildrenToNode(parametersNode, parameterNodes);
                        addChildrenToNode(programNode, [parametersNode]);
                    }

                    addChildrenToNode(programsNode, [programNode]);
                });
                addChildrenToNode(taskNode, [programsNode]);
            }

            // Add Task Properties subsection
            const taskPropertiesNode = createTreeNode({
                id: `task-${task.name}-properties`,
                name: 'Task Properties',
                type: 'task-properties',
                icon: '⚙️',
                meta: 'Task configuration'
            });
            addChildrenToNode(taskNode, [taskPropertiesNode]);

            addChildrenToNode(tasksNode, [taskNode]);
        });

        addChildrenToNode(controllerNode, [tasksNode]);
    }
}

function renderMotionGroups(controllerNode, data) {
    if (data.motionGroups && data.motionGroups.length > 0) {
        const motionNode = createTreeNode({
            id: 'motion-section',
            name: 'Motion Groups',
            type: 'motion-section',
            icon: '🎛️',
            meta: `${data.motionGroups.length} groups`
        });

        data.motionGroups.forEach(group => {
            const groupNode = createTreeNode({
                id: `motion-group-${group.name}`,
                name: group.name,
                type: 'motion-group',
                icon: '🎛️',
                meta: `${group.type || 'Unknown'}${group.description ? ` - ${group.description}` : ''}`
            });

            // Add motion instructions subsection
            if (group.instructions && group.instructions.length > 0) {
                const instructionsNode = createTreeNode({
                    id: `motion-group-${group.name}-instructions`,
                    name: 'Motion Instructions',
                    type: 'motion-instructions',
                    icon: '📊',
                    meta: `${group.instructions.length} instructions`
                });

                const instructionNodes = [];
                group.instructions.forEach(instruction => {
                    const instructionNode = createTreeNode({
                        id: `motion-instruction-${group.name}-${instruction.name}`,
                        name: instruction.name,
                        type: 'motion-instruction',
                        icon: '📊',
                        meta: `${instruction.type || 'Unknown'}${instruction.axis ? ` - Axis: ${instruction.axis}` : ''}`
                    });
                    instructionNodes.push(instructionNode);
                });
                addChildrenToNode(instructionsNode, instructionNodes);
                addChildrenToNode(groupNode, [instructionsNode]);
            }

            addChildrenToNode(motionNode, [groupNode]);
        });

        addChildrenToNode(controllerNode, [motionNode]);
    }
}

function renderDataTypes(controllerNode, data) {
    const hasDataTypes = data.dataTypes && data.dataTypes.length > 0;
    const hasAddOnInstructions = data.addOnInstructions && data.addOnInstructions.length > 0;

    if (hasDataTypes || hasAddOnInstructions) {
        const dataTypesNode = createTreeNode({
            id: 'datatypes-section',
            name: 'Module Defined Data Types',
            type: 'datatypes-section',
            icon: '📊',
            meta: `${(data.dataTypes?.length || 0) + (data.addOnInstructions?.length || 0)} items`
        });

        // Add User Defined Types
        if (hasDataTypes) {
            data.dataTypes.forEach(dt => {
                const dtNode = createTreeNode({
                    id: `datatype-${dt.name}`,
                    name: dt.name,
                    type: 'datatype',
                    icon: '📋',
                    meta: `${dt.family || 'Unknown'}${dt.description ? ` - ${dt.description}` : ''}`
                });
                addChildrenToNode(dataTypesNode, [dtNode]);
            });
        }

        // Add Add-On Instructions
        if (hasAddOnInstructions) {
            const aoiNode = createTreeNode({
                id: 'addon-instructions',
                name: 'Add-On Instructions',
                type: 'addon-instructions',
                icon: '🔗',
                meta: `${data.addOnInstructions.length} instructions`
            });

            const aoiNodes = [];
            data.addOnInstructions.forEach(aoi => {
                const aoiItemNode = createTreeNode({
                    id: `addon-instruction-${aoi.name}`,
                    name: aoi.name,
                    type: 'addon-instruction',
                    icon: '🔗',
                    meta: `Rev ${aoi.revision || '0'}${aoi.vendor ? ` - ${aoi.vendor}` : ''}`
                });
                aoiNodes.push(aoiItemNode);
            });
            addChildrenToNode(aoiNode, aoiNodes);
            addChildrenToNode(dataTypesNode, [aoiNode]);
        }

        addChildrenToNode(controllerNode, [dataTypesNode]);
    }
}

function renderIOConfiguration(controllerNode, data) {
    if (data.ioConfiguration) {
        const ioNode = createTreeNode({
            id: 'io-section',
            name: 'I/O Configuration',
            type: 'io-section',
            icon: '🔌',
            meta: 'I/O modules and networks'
        });

        // Local I/O
        if (data.ioConfiguration.local && data.ioConfiguration.local.length > 0) {
            const localIONode = createTreeNode({
                id: 'local-io',
                name: 'Local I/O',
                type: 'local-io',
                icon: '🔌',
                meta: `${data.ioConfiguration.local.length} modules`
            });

            const localModuleNodes = [];
            data.ioConfiguration.local.forEach(module => {
                const moduleNode = createTreeNode({
                    id: `local-module-${module.name}`,
                    name: module.name,
                    type: 'io-module',
                    icon: '📟',
                    meta: `${module.catalognumber || 'Unknown'}${module.producttype ? ` - ${module.producttype}` : ''}`
                });
                localModuleNodes.push(moduleNode);
            });
            addChildrenToNode(localIONode, localModuleNodes);
            addChildrenToNode(ioNode, [localIONode]);
        }

        // EtherNet/IP
        if (data.ioConfiguration.ethernet && data.ioConfiguration.ethernet.length > 0) {
            const ethernetNode = createTreeNode({
                id: 'ethernet-ip',
                name: 'EtherNet/IP',
                type: 'ethernet-ip',
                icon: '🌐',
                meta: `${data.ioConfiguration.ethernet.length} devices`
            });

            const ethernetModuleNodes = [];
            data.ioConfiguration.ethernet.forEach(module => {
                const moduleNode = createTreeNode({
                    id: `ethernet-module-${module.name}`,
                    name: module.name,
                    type: 'io-module',
                    icon: '🏭',
                    meta: `${module.catalognumber || 'Unknown'}${module.ipaddress ? ` - ${module.ipaddress}` : ''}`
                });
                ethernetModuleNodes.push(moduleNode);
            });
            addChildrenToNode(ethernetNode, ethernetModuleNodes);
            addChildrenToNode(ioNode, [ethernetNode]);
        }

        // DeviceNet
        if (data.ioConfiguration.devicenet && data.ioConfiguration.devicenet.length > 0) {
            const deviceNetNode = createTreeNode({
                id: 'devicenet',
                name: 'DeviceNet',
                type: 'devicenet',
                icon: '🔗',
                meta: `${data.ioConfiguration.devicenet.length} devices`
            });

            const deviceNetModuleNodes = [];
            data.ioConfiguration.devicenet.forEach(module => {
                const moduleNode = createTreeNode({
                    id: `devicenet-module-${module.name}`,
                    name: module.name,
                    type: 'io-module',
                    icon: '🔘',
                    meta: `${module.catalognumber || 'Unknown'}${module.nodeaddress ? ` - Node ${module.nodeaddress}` : ''}`
                });
                deviceNetModuleNodes.push(moduleNode);
            });
            addChildrenToNode(deviceNetNode, deviceNetModuleNodes);
            addChildrenToNode(ioNode, [deviceNetNode]);
        }

        // ControlNet
        if (data.ioConfiguration.controlnet && data.ioConfiguration.controlnet.length > 0) {
            const controlNetNode = createTreeNode({
                id: 'controlnet',
                name: 'ControlNet',
                type: 'controlnet',
                icon: '📡',
                meta: `${data.ioConfiguration.controlnet.length} devices`
            });

            const controlNetModuleNodes = [];
            data.ioConfiguration.controlnet.forEach(module => {
                const moduleNode = createTreeNode({
                    id: `controlnet-module-${module.name}`,
                    name: module.name,
                    type: 'io-module',
                    icon: '📡',
                    meta: `${module.catalognumber || 'Unknown'}${module.nodeaddress ? ` - Node ${module.nodeaddress}` : ''}`
                });
                controlNetModuleNodes.push(moduleNode);
            });
            addChildrenToNode(controlNetNode, controlNetModuleNodes);
            addChildrenToNode(ioNode, [controlNetNode]);
        }

        // Other Networks subsection (for any additional network types)
        const otherNetworks = [];
        if (data.ioConfiguration) {
            Object.entries(data.ioConfiguration).forEach(([networkType, modules]) => {
                if (!['local', 'ethernet', 'devicenet', 'controlnet'].includes(networkType) && 
                    Array.isArray(modules) && modules.length > 0) {
                    otherNetworks.push({ type: networkType, modules });
                }
            });
        }

        if (otherNetworks.length > 0) {
            const otherNetworksNode = createTreeNode({
                id: 'other-networks',
                name: 'Other Networks',
                type: 'other-networks',
                icon: '🏭',
                meta: `${otherNetworks.length} network types`
            });

            otherNetworks.forEach(network => {
                const networkNode = createTreeNode({
                    id: `network-${network.type}`,
                    name: network.type.charAt(0).toUpperCase() + network.type.slice(1),
                    type: 'network',
                    icon: '🏭',
                    meta: `${network.modules.length} devices`
                });
                addChildrenToNode(otherNetworksNode, [networkNode]);
            });
            addChildrenToNode(ioNode, [otherNetworksNode]);
        }

        addChildrenToNode(controllerNode, [ioNode]);
    }
}

function renderSafety(controllerNode, data) {
    if (data.safetyConfiguration) {
        const safetyNode = createTreeNode({
            id: 'safety-section',
            name: 'Safety',
            type: 'safety-section',
            icon: '🛡️',
            meta: 'Safety configuration'
        });

        // Safety Task
        if (data.safetyConfiguration.safetyTask) {
            const safetyTaskNode = createTreeNode({
                id: 'safety-task',
                name: 'Safety Task',
                type: 'safety-task',
                icon: '🛡️',
                meta: data.safetyConfiguration.safetyTask.name || 'Safety Task'
            });
            addChildrenToNode(safetyNode, [safetyTaskNode]);
        }

        // Safety I/O
        if (data.safetyConfiguration.safetyIO && data.safetyConfiguration.safetyIO.length > 0) {
            const safetyIONode = createTreeNode({
                id: 'safety-io',
                name: 'Safety I/O',
                type: 'safety-io',
                icon: '🚨',
                meta: `${data.safetyConfiguration.safetyIO.length} modules`
            });

            const safetyModuleNodes = [];
            data.safetyConfiguration.safetyIO.forEach(module => {
                const moduleNode = createTreeNode({
                    id: `safety-module-${module.name}`,
                    name: module.name,
                    type: 'safety-module',
                    icon: '🚨',
                    meta: `${module.catalognumber || 'Unknown'}${module.producttype ? ` - ${module.producttype}` : ''}`
                });
                safetyModuleNodes.push(moduleNode);
            });
            addChildrenToNode(safetyIONode, safetyModuleNodes);
            addChildrenToNode(safetyNode, [safetyIONode]);
        }

        // Safety Configuration
        if (data.safetyConfiguration.safetyConfig) {
            const safetyConfigNode = createTreeNode({
                id: 'safety-config',
                name: 'Safety Configuration',
                type: 'safety-config',
                icon: '⚠️',
                meta: 'Safety settings'
            });
            addChildrenToNode(safetyNode, [safetyConfigNode]);
        }

        addChildrenToNode(controllerNode, [safetyNode]);
    }
}

function renderEventTasks(controllerNode, data) {
    if (data.tasks && data.tasks.some(task => task.type?.toLowerCase().includes('event'))) {
        const eventTasksNode = createTreeNode({
            id: 'event-tasks-section',
            name: 'Event Tasks',
            type: 'event-tasks-section',
            icon: '⚡',
            meta: 'Event-driven tasks'
        });

        const eventTasks = data.tasks.filter(task => task.type?.toLowerCase().includes('event'));
        eventTasks.forEach(task => {
            const eventTaskNode = createTreeNode({
                id: `event-task-${task.name}`,
                name: task.name,
                type: 'event-task',
                icon: '⚡',
                meta: getTaskMeta(task)
            });

            // Add event configuration subsection
            const eventConfigNode = createTreeNode({
                id: `event-task-${task.name}-config`,
                name: 'Event Configuration',
                type: 'event-config',
                icon: '📋',
                meta: 'Event settings'
            });
            addChildrenToNode(eventTaskNode, [eventConfigNode]);

            addChildrenToNode(eventTasksNode, [eventTaskNode]);
        });

        addChildrenToNode(controllerNode, [eventTasksNode]);
    }
}

function renderTrendsAndDiagnostics(controllerNode, data) {
    if (data.trendsAndDiagnostics) {
        const trendsNode = createTreeNode({
            id: 'trends-section',
            name: 'Trends & Diagnostics',
            type: 'trends-section',
            icon: '📈',
            meta: 'Monitoring and diagnostics'
        });

        // Trend Configurations
        if (data.trendsAndDiagnostics.trendConfigurations && data.trendsAndDiagnostics.trendConfigurations.length > 0) {
            const trendConfigsNode = createTreeNode({
                id: 'trend-configurations',
                name: 'Trend Configurations',
                type: 'trend-config',
                icon: '📈',
                meta: `${data.trendsAndDiagnostics.trendConfigurations.length} trends`
            });

            const trendNodes = [];
            data.trendsAndDiagnostics.trendConfigurations.forEach(trend => {
                const trendNode = createTreeNode({
                    id: `trend-${trend.name}`,
                    name: trend.name,
                    type: 'trend',
                    icon: '📈',
                    meta: `${trend.type || 'Unknown'}${trend.samplerate ? ` - ${trend.samplerate}` : ''}`
                });
                trendNodes.push(trendNode);
            });
            addChildrenToNode(trendConfigsNode, trendNodes);
            addChildrenToNode(trendsNode, [trendConfigsNode]);
        }

        // Diagnostic Logs
        if (data.trendsAndDiagnostics.diagnosticLogs && data.trendsAndDiagnostics.diagnosticLogs.length > 0) {
            const diagnosticLogsNode = createTreeNode({
                id: 'diagnostic-logs',
                name: 'Diagnostic Logs',
                type: 'diagnostic-logs',
                icon: '🔍',
                meta: `${data.trendsAndDiagnostics.diagnosticLogs.length} logs`
            });

            const logNodes = [];
            data.trendsAndDiagnostics.diagnosticLogs.forEach(log => {
                const logNode = createTreeNode({
                    id: `diagnostic-log-${log.name}`,
                    name: log.name,
                    type: 'diagnostic-log',
                    icon: '🔍',
                    meta: `${log.type || 'Unknown'}${log.level ? ` - ${log.level}` : ''}`
                });
                logNodes.push(logNode);
            });
            addChildrenToNode(diagnosticLogsNode, logNodes);
            addChildrenToNode(trendsNode, [diagnosticLogsNode]);
        }

        // Performance Data
        if (data.trendsAndDiagnostics.performanceData) {
            const performanceNode = createTreeNode({
                id: 'performance-data',
                name: 'Performance Data',
                type: 'performance-data',
                icon: '📊',
                meta: 'Performance monitoring'
            });
            addChildrenToNode(trendsNode, [performanceNode]);
        }

        addChildrenToNode(controllerNode, [trendsNode]);
    }
}

// Helper functions for icons and metadata
function getTaskIcon(taskType) {
    const type = taskType?.toLowerCase() || '';
    if (type.includes('continuous')) return '🔄';
    if (type.includes('periodic')) return '⏰';
    if (type.includes('event')) return '⚡';
    return '⚡';
}

function getTaskMeta(task) {
    const parts = [];
    if (task.type) parts.push(task.type.toUpperCase());
    if (task.priority) parts.push(`Priority: ${task.priority}`);
    if (task.rate && task.type?.toLowerCase() === 'periodic') parts.push(`${task.rate}ms`);
    return parts.join(' - ');
}

function getRoutineIcon(routineType) {
    const type = routineType?.toLowerCase() || '';
    if (type.includes('rll') || type.includes('ladder')) return '🪜';
    if (type.includes('st') || type.includes('structured')) return '📄';
    if (type.includes('fbd') || type.includes('function')) return '🔧';
    if (type.includes('sfc') || type.includes('sequential')) return '⚡';
    return '🪜';
}

// Utility functions
function updateStatus(message, type = 'info') {
    try {
        if (elements.statusText) {
            elements.statusText.textContent = sanitizeInput(message);
        }
    } catch (error) {
        console.error('Status update failed:', error);
    }
}

function showLoading() {
    try {
        if (elements.rungContainer) {
            elements.rungContainer.innerHTML = `
                <div class="loading">
                    <div class="welcome-icon">⚙️</div>
                    <p>Loading project...</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Loading state display failed:', error);
    }
}

function showError(message) {
    try {
        if (elements.rungContainer) {
            elements.rungContainer.innerHTML = `
                <div class="error">
                    <div class="error-icon">❌</div>
                    <h2>Error</h2>
                    <p>${sanitizeInput(message)}</p>
                    <button class="btn" onclick="openFile()" style="margin-top: 1rem;">Try Another File</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error display failed:', error);
    }
}

// Resizer functionality
function setupResizer() {
    try {
        const resizer = elements.resizer;
        const treePanel = elements.treePanel;
        
        if (!resizer || !treePanel) {
            console.warn('Resizer elements not found');
            return;
        }

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const startResize = (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = treePanel.offsetWidth;
            
            resizer.classList.add('dragging');
            document.body.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            
            // Show resizer when tree panel is visible
            resizer.style.display = 'block';
        };

        const doResize = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
            
            treePanel.style.width = `${newWidth}px`;
        };

        const stopResize = () => {
            if (!isResizing) return;
            
            isResizing = false;
            resizer.classList.remove('dragging');
            document.body.classList.remove('resizing');
            document.body.style.cursor = '';
        };

        // Mouse events
        resizer.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

        // Touch events for mobile
        resizer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startResize(e.touches[0]);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            doResize(e.touches[0]);
        });
        
        document.addEventListener('touchend', stopResize);

        // Show/hide resizer based on tree panel visibility
        const observer = new MutationObserver(() => {
            if (treePanel.style.display === 'flex' || treePanel.style.display === 'block') {
                resizer.style.display = 'block';
            } else {
                resizer.style.display = 'none';
            }
        });

        observer.observe(treePanel, { attributes: true, attributeFilter: ['style'] });

    } catch (error) {
        console.error('Resizer setup failed:', error);
    }
}

// Initialize application
function initializeApp() {
    try {
        setupElements();
        setupEventListeners();
        
        // Make functions globally available for HTML onclick handlers
        window.openFile = openFile;
        window.expandAll = expandAll;
        window.collapseAll = collapseAll;
        window.clearSearch = clearSearch;
        
        updateStatus('Ready to load L5X project file');
        announceToScreenReader('Studio 5000 Logix Designer Style PLC Viewer ready. Load an L5X file to begin.');
    } catch (error) {
        console.error('Application initialization failed:', error);
        showError('Application initialization failed');
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 