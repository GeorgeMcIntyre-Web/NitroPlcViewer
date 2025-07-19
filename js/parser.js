// ============================================================================
// L5X PARSER MODULE
// ============================================================================

import { sanitizeInput, parseXMLSafely } from './utils.js';

// Enhanced L5X parsing with comprehensive Studio 5000 structure support
export function parseL5X(xmlDoc) {
    try {
        const controller = xmlDoc.querySelector('Controller');
        if (!controller) {
            throw new Error('No Controller element found in L5X file');
        }

        const getAttrs = (node, attrs) => {
            if (!node) return {};
            return attrs.reduce((acc, attr) => ({
                ...acc, 
                [attr.toLowerCase()]: sanitizeInput(node.getAttribute(attr) || '')
            }), {});
        };

        const getTextContent = (node, selector) => {
            const element = node.querySelector(selector);
            return element ? sanitizeInput(element.textContent.trim()) : '';
        };

        // Parse controller info with validation
        const controllerInfo = getAttrs(controller, ['Name', 'ProcessorType', 'MajorRev', 'MinorRev', 'TimeSlice', 'ShareUnusedTimeSlice']);
        if (!controllerInfo.name) {
            throw new Error('Controller name is required');
        }

        // Parse tasks with their nested programs
        const tasks = parseTasks(xmlDoc, getAttrs, getTextContent);

        // Extract all programs from tasks into a separate array
        const programs = [];
        tasks.forEach(task => {
            if (task.programs && task.programs.length > 0) {
                task.programs.forEach(program => {
                    programs.push({
                        ...program,
                        parentTask: task.name // Keep reference to parent task
                    });
                });
            }
        });

        // Parse controller tags with enhanced information
        const controllerTags = parseControllerTags(xmlDoc, getAttrs, getTextContent);

        // Parse data types with enhanced structure
        const dataTypes = parseDataTypes(xmlDoc, getAttrs, getTextContent);

        // Parse Add-On Instructions
        const addOnInstructions = parseAddOnInstructions(xmlDoc, getAttrs, getTextContent);

        // Parse I/O Configuration
        const ioConfiguration = parseIOConfiguration(xmlDoc, getAttrs, getTextContent);

        // Parse Safety Configuration
        const safetyConfiguration = parseSafetyConfiguration(xmlDoc, getAttrs, getTextContent);

        // Parse Motion Groups
        const motionGroups = parseMotionGroups(xmlDoc, getAttrs, getTextContent);

        // Parse Trends & Diagnostics
        const trendsAndDiagnostics = parseTrendsAndDiagnostics(xmlDoc, getAttrs, getTextContent);

        return {
            controller: controllerInfo,
            tasks: tasks,
            programs: programs,
            controllerTags: controllerTags,
            dataTypes: dataTypes,
            addOnInstructions: addOnInstructions,
            ioConfiguration: ioConfiguration,
            safetyConfiguration: safetyConfiguration,
            motionGroups: motionGroups,
            trendsAndDiagnostics: trendsAndDiagnostics
        };
        
    } catch (error) {
        throw new Error(`L5X parsing error: ${error.message}`);
    }
}

// Parse tasks with their nested programs
function parseTasks(xmlDoc, getAttrs, getTextContent) {
    return Array.from(xmlDoc.querySelectorAll('Tasks > Task')).map((task, index) => {
        const taskInfo = getAttrs(task, ['Name', 'Type', 'Priority', 'Watchdog', 'Rate', 'Scheduled']);
        if (!taskInfo.name) {
            throw new Error(`Task ${index + 1} missing name`);
        }
        
        // Parse programs WITHIN this task (not separate)
        const programElements = task.querySelectorAll('Programs > Program');
        taskInfo.programs = Array.from(programElements).map((program, programIndex) => {
            const programInfo = getAttrs(program, ['Name', 'Type', 'TestEdits', 'MainRoutineName', 'UseAsFolder']);
            if (!programInfo.name) {
                throw new Error(`Program ${programIndex + 1} in task ${taskInfo.name} missing name`);
            }
            
            // Parse program tags
            programInfo.tags = Array.from(program.querySelectorAll('Tags > Tag')).map(tag => {
                const tagInfo = getAttrs(tag, ['Name', 'TagType', 'DataType', 'Usage', 'Constant', 'ExternalAccess']);
                if (!tagInfo.name) {
                    throw new Error('Program tag missing name');
                }
                return tagInfo;
            });
            
            // Parse program parameters
            programInfo.parameters = Array.from(program.querySelectorAll('Parameters > Parameter')).map(param => {
                const paramInfo = getAttrs(param, ['Name', 'DataType', 'Required', 'ExternalAccess']);
                if (!paramInfo.name) {
                    throw new Error('Program parameter missing name');
                }
                return paramInfo;
            });
            
            // Parse program routines with enhanced content
            programInfo.routines = parseRoutines(program, getAttrs, getTextContent);
            
            return programInfo;
        });
        
        // Parse scheduled programs (for backward compatibility)
        taskInfo.scheduledPrograms = Array.from(task.querySelectorAll('ScheduledPrograms > ScheduledProgram')).map(sp => 
            sanitizeInput(sp.getAttribute('Name') || '')
        );
        
        // Parse task properties
        taskInfo.properties = {
            description: getTextContent(task, 'Description'),
            rate: taskInfo.rate,
            priority: taskInfo.priority,
            watchdog: taskInfo.watchdog === 'true',
            scheduled: taskInfo.scheduled === 'true'
        };
        
        return taskInfo;
    });
}



// Parse routines
function parseRoutines(program, getAttrs, getTextContent) {
    return Array.from(program.querySelectorAll(':scope > Routines > Routine')).map((routine, routineIndex) => {
        const routineInfo = getAttrs(routine, ['Name', 'Type', 'TestEdits']);
        if (!routineInfo.name) {
            throw new Error(`Routine ${routineIndex + 1} in program missing name`);
        }
        
        routineInfo.description = getTextContent(routine, 'Description');
        
        // Parse RLL content with validation
        const rllContent = routine.querySelector('RLLContent');
        if (rllContent) {
            routineInfo.logic = {
                type: 'RLL',
                content: Array.from(rllContent.querySelectorAll('Rung')).map((rung, rungIndex) => {
                    const textElement = rung.querySelector('Text');
                    const commentElement = rung.querySelector('Comment');
                    
                    return {
                        number: sanitizeInput(rung.getAttribute('Number') || rungIndex.toString()),
                        text: sanitizeInput(textElement ? textElement.textContent.trim() : ''),
                        comment: sanitizeInput(commentElement ? commentElement.textContent.trim() : '')
                    };
                })
            };
        }
        
        // Parse ST content
        const stContent = routine.querySelector('STContent');
        if (stContent) {
            routineInfo.logic = {
                type: 'ST',
                content: sanitizeInput(stContent.textContent.trim())
            };
        }
        
        // Parse FBD content
        const fbdContent = routine.querySelector('FBDContent');
        if (fbdContent) {
            routineInfo.logic = {
                type: 'FBD',
                content: Array.from(fbdContent.querySelectorAll('Block')).map(block => ({
                    name: sanitizeInput(block.getAttribute('Name') || ''),
                    type: sanitizeInput(block.getAttribute('Type') || ''),
                    position: sanitizeInput(block.getAttribute('Position') || '')
                }))
            };
        }
        
        return routineInfo;
    });
}

// Parse controller tags
function parseControllerTags(xmlDoc, getAttrs, getTextContent) {
    return Array.from(xmlDoc.querySelectorAll('Controller > Tags > Tag')).map(tag => {
        const tagInfo = getAttrs(tag, ['Name', 'TagType', 'DataType', 'Usage', 'Constant', 'ExternalAccess', 'Radix']);
        if (!tagInfo.name) {
            throw new Error('Controller tag missing name');
        }
        
        // Parse tag value if present
        const valueElement = tag.querySelector('Value');
        if (valueElement) {
            tagInfo.value = sanitizeInput(valueElement.textContent.trim());
        }
        
        // Parse tag description
        tagInfo.description = getTextContent(tag, 'Description');
        
        return tagInfo;
    });
}

// Parse data types
function parseDataTypes(xmlDoc, getAttrs, getTextContent) {
    return Array.from(xmlDoc.querySelectorAll('DataTypes > DataType')).map(dt => {
        const dtInfo = getAttrs(dt, ['Name', 'Family', 'Class']);
        if (!dtInfo.name) {
            throw new Error('Data type missing name');
        }
        
        dtInfo.description = getTextContent(dt, 'Description');
        
        dtInfo.members = Array.from(dt.querySelectorAll('Members > Member')).map(member => {
            const memberInfo = getAttrs(member, ['Name', 'DataType', 'Dimension', 'Radix', 'Required']);
            memberInfo.description = getTextContent(member, 'Description');
            return memberInfo;
        });
        
        return dtInfo;
    });
}

// Parse Add-On Instructions
function parseAddOnInstructions(xmlDoc, getAttrs, getTextContent) {
    return Array.from(xmlDoc.querySelectorAll('AddOnInstructionDefinitions > AddOnInstructionDefinition')).map(aoi => {
        const aoiInfo = getAttrs(aoi, ['Name', 'Revision', 'Vendor']);
        if (!aoiInfo.name) {
            throw new Error('Add-On Instruction missing name');
        }
        
        aoiInfo.description = getTextContent(aoi, 'Description');
        
        // Parse AOI parameters
        aoiInfo.parameters = Array.from(aoi.querySelectorAll('Parameters > Parameter')).map(param => {
            const paramInfo = getAttrs(param, ['Name', 'DataType', 'Required', 'Usage']);
            paramInfo.description = getTextContent(param, 'Description');
            return paramInfo;
        });
        
        return aoiInfo;
    });
}

// Parse I/O Configuration
function parseIOConfiguration(xmlDoc, getAttrs, getTextContent) {
    return {
        local: Array.from(xmlDoc.querySelectorAll('Local > Module')).map(module => {
            const moduleInfo = getAttrs(module, ['Name', 'CatalogNumber', 'Vendor', 'ProductType', 'ProductCode']);
            moduleInfo.description = getTextContent(module, 'Description');
            return moduleInfo;
        }),
        ethernet: Array.from(xmlDoc.querySelectorAll('EtherNet > Module')).map(module => {
            const moduleInfo = getAttrs(module, ['Name', 'CatalogNumber', 'Vendor', 'ProductType', 'ProductCode', 'IPAddress']);
            moduleInfo.description = getTextContent(module, 'Description');
            return moduleInfo;
        }),
        devicenet: Array.from(xmlDoc.querySelectorAll('DeviceNet > Module')).map(module => {
            const moduleInfo = getAttrs(module, ['Name', 'CatalogNumber', 'Vendor', 'ProductType', 'ProductCode', 'NodeAddress']);
            moduleInfo.description = getTextContent(module, 'Description');
            return moduleInfo;
        }),
        controlnet: Array.from(xmlDoc.querySelectorAll('ControlNet > Module')).map(module => {
            const moduleInfo = getAttrs(module, ['Name', 'CatalogNumber', 'Vendor', 'ProductType', 'ProductCode', 'NodeAddress']);
            moduleInfo.description = getTextContent(module, 'Description');
            return moduleInfo;
        })
    };
}

// Parse Safety Configuration
function parseSafetyConfiguration(xmlDoc, getAttrs, getTextContent) {
    return {
        safetyTask: xmlDoc.querySelector('Safety > SafetyTask') ? {
            name: getTextContent(xmlDoc.querySelector('Safety > SafetyTask'), 'Name'),
            description: getTextContent(xmlDoc.querySelector('Safety > SafetyTask'), 'Description')
        } : null,
        safetyIO: Array.from(xmlDoc.querySelectorAll('Safety > SafetyIO > Module')).map(module => {
            const moduleInfo = getAttrs(module, ['Name', 'CatalogNumber', 'Vendor', 'ProductType']);
            moduleInfo.description = getTextContent(module, 'Description');
            return moduleInfo;
        }),
        safetyConfig: xmlDoc.querySelector('Safety > SafetyConfiguration') ? {
            description: getTextContent(xmlDoc.querySelector('Safety > SafetyConfiguration'), 'Description')
        } : null
    };
}

// Parse Motion Groups
function parseMotionGroups(xmlDoc, getAttrs, getTextContent) {
    return Array.from(xmlDoc.querySelectorAll('MotionGroups > MotionGroup')).map(group => {
        const groupInfo = getAttrs(group, ['Name', 'Type']);
        groupInfo.description = getTextContent(group, 'Description');
        
        // Parse motion instructions
        groupInfo.instructions = Array.from(group.querySelectorAll('MotionInstructions > MotionInstruction')).map(instruction => {
            const instructionInfo = getAttrs(instruction, ['Name', 'Type', 'Axis']);
            instructionInfo.description = getTextContent(instruction, 'Description');
            return instructionInfo;
        });
        
        return groupInfo;
    });
}

// Parse Trends & Diagnostics
function parseTrendsAndDiagnostics(xmlDoc, getAttrs, getTextContent) {
    return {
        trendConfigurations: Array.from(xmlDoc.querySelectorAll('Trends > TrendConfiguration')).map(trend => {
            const trendInfo = getAttrs(trend, ['Name', 'Type', 'SampleRate']);
            trendInfo.description = getTextContent(trend, 'Description');
            return trendInfo;
        }),
        diagnosticLogs: Array.from(xmlDoc.querySelectorAll('Diagnostics > DiagnosticLog')).map(log => {
            const logInfo = getAttrs(log, ['Name', 'Type', 'Level']);
            logInfo.description = getTextContent(log, 'Description');
            return logInfo;
        }),
        performanceData: xmlDoc.querySelector('PerformanceData') ? {
            description: getTextContent(xmlDoc.querySelector('PerformanceData'), 'Description')
        } : null
    };
} 