// ============================================================================
// CONTENT DISPLAY MODULE
// ============================================================================

import { sanitizeInput } from './utils.js';

// Global project data reference
let projectData = null;

// Set project data reference
export function setProjectData(data) {
    projectData = data;
}

// Enhanced content display functions for complete Studio 5000 structure
export function showNodeContent(nodeType, nodeName, nodeId) {
    try {
        if (nodeType?.startsWith('routine-')) {
            showRoutineContent(nodeName);
        } else if (nodeType?.startsWith('tag-')) {
            // Check if it's a produced/consumed tag
            if (nodeId?.startsWith('pc-tag-')) {
                showProducedConsumedTagContent(nodeName);
            } else {
                showTagContent(nodeName);
            }
        } else if (nodeType === 'program') {
            showProgramContent(nodeName);
        } else if (nodeType === 'datatype') {
            showDataTypeContent(nodeName);
        } else if (nodeType === 'addon-instruction') {
            showAddOnInstructionContent(nodeName);
        } else if (nodeType === 'io-module') {
            showIOModuleContent(nodeName);
        } else if (nodeType === 'motion-group') {
            showMotionGroupContent(nodeName);
        } else if (nodeType === 'motion-instruction') {
            showMotionInstructionContent(nodeName);
        } else if (nodeType === 'safety-module') {
            showSafetyModuleContent(nodeName);
        } else if (nodeType === 'trend') {
            showTrendContent(nodeName);
        } else if (nodeType === 'diagnostic-log') {
            showDiagnosticLogContent(nodeName);
        } else if (nodeType === 'event-task') {
            showEventTaskContent(nodeName);
        } else {
            showDefaultContent(nodeName, nodeType);
        }

    } catch (error) {
        console.error('Content display failed:', error);
        showError('Failed to display content');
    }
}

// Show routine content
export function showRoutineContent(routineName) {
    try {
        // Find routine in project data
        let routine = null;
        if (projectData && projectData.programs) {
            for (const program of projectData.programs) {
                if (program.routines) {
                    routine = program.routines.find(r => r.name === routineName);
                    if (routine) break;
                }
            }
        }

        if (routine && routine.logic) {
            displayRungs(routine.logic.content, routineName);
        } else {
            showDefaultContent(routineName, 'routine');
        }

    } catch (error) {
        console.error('Routine content display failed:', error);
        showError('Failed to display routine content');
    }
}

// Display rungs
function displayRungs(rungs, routineName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Show content header
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(routineName);
        contentMeta.innerHTML = `
            <span>Type: Ladder Logic</span>
            <span>Rungs: ${rungs.length}</span>
        `;

        // Display rungs
        let rungsHTML = '';
        rungs.forEach((rung, index) => {
            rungsHTML += `
                <div class="rung" data-rung="${index}">
                    <div class="rung-header">
                        <span class="rung-number">Rung ${sanitizeInput(rung.number)}</span>
                        ${rung.comment ? `<span class="rung-comment">${sanitizeInput(rung.comment)}</span>` : ''}
                    </div>
                    <div class="rung-content">${sanitizeInput(rung.text)}</div>
                </div>
            `;
        });

        rungContainer.innerHTML = rungsHTML;

    } catch (error) {
        console.error('Rungs display failed:', error);
        showError('Failed to display rungs');
    }
}

// Show tag content
export function showTagContent(tagName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Find tag in project data
        const tag = projectData?.controllerTags?.find(t => t.name === tagName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(tagName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(tag?.datatype || 'Unknown')}</span>
            <span>Usage: ${sanitizeInput(tag?.usage || 'Unknown')}</span>
            ${tag?.constant ? '<span>Constant: Yes</span>' : ''}
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🏷️</div>
                <h2>Tag Information</h2>
                <p>Tag: ${sanitizeInput(tagName)}</p>
                <p>Data Type: ${sanitizeInput(tag?.datatype || 'Unknown')}</p>
                <p>Usage: ${sanitizeInput(tag?.usage || 'Unknown')}</p>
                ${tag?.constant ? '<p>Constant: Yes</p>' : ''}
            </div>
        `;

    } catch (error) {
        console.error('Tag content display failed:', error);
        showError('Failed to display tag content');
    }
}

// Show program content
export function showProgramContent(programName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const program = projectData?.programs?.find(p => p.name === programName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(programName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(program?.type || 'Unknown')}</span>
            <span>Routines: ${program?.routines?.length || 0}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📋</div>
                <h2>Program Information</h2>
                <p>Program: ${sanitizeInput(programName)}</p>
                <p>Type: ${sanitizeInput(program?.type || 'Unknown')}</p>
                <p>Routines: ${program?.routines?.length || 0}</p>
            </div>
        `;

    } catch (error) {
        console.error('Program content display failed:', error);
        showError('Failed to display program content');
    }
}

// Show data type content
export function showDataTypeContent(dataTypeName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const dataType = projectData?.dataTypes?.find(dt => dt.name === dataTypeName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(dataTypeName);
        contentMeta.innerHTML = `
            <span>Family: ${sanitizeInput(dataType?.family || 'Unknown')}</span>
            <span>Members: ${dataType?.members?.length || 0}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📊</div>
                <h2>Data Type Information</h2>
                <p>Name: ${sanitizeInput(dataTypeName)}</p>
                <p>Family: ${sanitizeInput(dataType?.family || 'Unknown')}</p>
                <p>Members: ${dataType?.members?.length || 0}</p>
                ${dataType?.description ? `<p>Description: ${sanitizeInput(dataType.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Data type content display failed:', error);
        showError('Failed to display data type content');
    }
}

// Show Add-On Instruction content
export function showAddOnInstructionContent(aoiName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const aoi = projectData?.addOnInstructions?.find(a => a.name === aoiName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(aoiName);
        contentMeta.innerHTML = `
            <span>Revision: ${sanitizeInput(aoi?.revision || 'Unknown')}</span>
            <span>Vendor: ${sanitizeInput(aoi?.vendor || 'Unknown')}</span>
            <span>Parameters: ${aoi?.parameters?.length || 0}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🔗</div>
                <h2>Add-On Instruction Information</h2>
                <p>Name: ${sanitizeInput(aoiName)}</p>
                <p>Revision: ${sanitizeInput(aoi?.revision || 'Unknown')}</p>
                <p>Vendor: ${sanitizeInput(aoi?.vendor || 'Unknown')}</p>
                <p>Parameters: ${aoi?.parameters?.length || 0}</p>
                ${aoi?.description ? `<p>Description: ${sanitizeInput(aoi.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Add-On Instruction content display failed:', error);
        showError('Failed to display Add-On Instruction content');
    }
}

// Show I/O module content
export function showIOModuleContent(moduleName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Find module in I/O configuration
        let module = null;
        if (projectData?.ioConfiguration) {
            module = projectData.ioConfiguration.local?.find(m => m.name === moduleName) ||
                     projectData.ioConfiguration.ethernet?.find(m => m.name === moduleName) ||
                     projectData.ioConfiguration.devicenet?.find(m => m.name === moduleName) ||
                     projectData.ioConfiguration.controlnet?.find(m => m.name === moduleName);
        }
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(moduleName);
        contentMeta.innerHTML = `
            <span>Catalog: ${sanitizeInput(module?.catalognumber || 'Unknown')}</span>
            <span>Type: ${sanitizeInput(module?.producttype || 'Unknown')}</span>
            <span>Vendor: ${sanitizeInput(module?.vendor || 'Unknown')}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📟</div>
                <h2>I/O Module Information</h2>
                <p>Name: ${sanitizeInput(moduleName)}</p>
                <p>Catalog Number: ${sanitizeInput(module?.catalognumber || 'Unknown')}</p>
                <p>Product Type: ${sanitizeInput(module?.producttype || 'Unknown')}</p>
                <p>Vendor: ${sanitizeInput(module?.vendor || 'Unknown')}</p>
                ${module?.description ? `<p>Description: ${sanitizeInput(module.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('I/O Module content display failed:', error);
        showError('Failed to display I/O module content');
    }
}

// Show motion group content
export function showMotionGroupContent(groupName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const group = projectData?.motionGroups?.find(g => g.name === groupName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(groupName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(group?.type || 'Unknown')}</span>
            <span>Instructions: ${group?.instructions?.length || 0}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🎛️</div>
                <h2>Motion Group Information</h2>
                <p>Name: ${sanitizeInput(groupName)}</p>
                <p>Type: ${sanitizeInput(group?.type || 'Unknown')}</p>
                <p>Instructions: ${group?.instructions?.length || 0}</p>
                ${group?.description ? `<p>Description: ${sanitizeInput(group.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Motion Group content display failed:', error);
        showError('Failed to display motion group content');
    }
}

// Show motion instruction content
export function showMotionInstructionContent(instructionName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Find motion instruction in project data
        let instruction = null;
        if (projectData?.motionGroups) {
            for (const group of projectData.motionGroups) {
                if (group.instructions) {
                    instruction = group.instructions.find(i => i.name === instructionName);
                    if (instruction) break;
                }
            }
        }
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(instructionName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(instruction?.type || 'Unknown')}</span>
            <span>Axis: ${sanitizeInput(instruction?.axis || 'Unknown')}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📊</div>
                <h2>Motion Instruction Information</h2>
                <p>Name: ${sanitizeInput(instructionName)}</p>
                <p>Type: ${sanitizeInput(instruction?.type || 'Unknown')}</p>
                <p>Axis: ${sanitizeInput(instruction?.axis || 'Unknown')}</p>
                ${instruction?.description ? `<p>Description: ${sanitizeInput(instruction.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Motion Instruction content display failed:', error);
        showError('Failed to display motion instruction content');
    }
}

// Show safety module content
export function showSafetyModuleContent(moduleName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const module = projectData?.safetyConfiguration?.safetyIO?.find(m => m.name === moduleName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(moduleName);
        contentMeta.innerHTML = `
            <span>Catalog: ${sanitizeInput(module?.catalognumber || 'Unknown')}</span>
            <span>Type: ${sanitizeInput(module?.producttype || 'Unknown')}</span>
            <span>Vendor: ${sanitizeInput(module?.vendor || 'Unknown')}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🚨</div>
                <h2>Safety Module Information</h2>
                <p>Name: ${sanitizeInput(moduleName)}</p>
                <p>Catalog Number: ${sanitizeInput(module?.catalognumber || 'Unknown')}</p>
                <p>Product Type: ${sanitizeInput(module?.producttype || 'Unknown')}</p>
                <p>Vendor: ${sanitizeInput(module?.vendor || 'Unknown')}</p>
                ${module?.description ? `<p>Description: ${sanitizeInput(module.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Safety Module content display failed:', error);
        showError('Failed to display safety module content');
    }
}

// Show trend content
export function showTrendContent(trendName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const trend = projectData?.trendsAndDiagnostics?.trendConfigurations?.find(t => t.name === trendName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(trendName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(trend?.type || 'Unknown')}</span>
            <span>Sample Rate: ${sanitizeInput(trend?.samplerate || 'Unknown')}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📈</div>
                <h2>Trend Configuration Information</h2>
                <p>Name: ${sanitizeInput(trendName)}</p>
                <p>Type: ${sanitizeInput(trend?.type || 'Unknown')}</p>
                <p>Sample Rate: ${sanitizeInput(trend?.samplerate || 'Unknown')}</p>
                ${trend?.description ? `<p>Description: ${sanitizeInput(trend.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Trend content display failed:', error);
        showError('Failed to display trend content');
    }
}

// Show diagnostic log content
export function showDiagnosticLogContent(logName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const log = projectData?.trendsAndDiagnostics?.diagnosticLogs?.find(l => l.name === logName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(logName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(log?.type || 'Unknown')}</span>
            <span>Level: ${sanitizeInput(log?.level || 'Unknown')}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🔍</div>
                <h2>Diagnostic Log Information</h2>
                <p>Name: ${sanitizeInput(logName)}</p>
                <p>Type: ${sanitizeInput(log?.type || 'Unknown')}</p>
                <p>Level: ${sanitizeInput(log?.level || 'Unknown')}</p>
                ${log?.description ? `<p>Description: ${sanitizeInput(log.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Diagnostic Log content display failed:', error);
        showError('Failed to display diagnostic log content');
    }
}

// Show event task content
export function showEventTaskContent(taskName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        const task = projectData?.tasks?.find(t => t.name === taskName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(taskName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(task?.type || 'Unknown')}</span>
            <span>Priority: ${sanitizeInput(task?.priority || 'Unknown')}</span>
            <span>Programs: ${task?.programs?.length || 0}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">⚡</div>
                <h2>Event Task Information</h2>
                <p>Name: ${sanitizeInput(taskName)}</p>
                <p>Type: ${sanitizeInput(task?.type || 'Unknown')}</p>
                <p>Priority: ${sanitizeInput(task?.priority || 'Unknown')}</p>
                <p>Scheduled Programs: ${task?.programs?.length || 0}</p>
                ${task?.properties?.description ? `<p>Description: ${sanitizeInput(task.properties.description)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Event Task content display failed:', error);
        showError('Failed to display event task content');
    }
}

// Show produced/consumed tag content
export function showProducedConsumedTagContent(tagName) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Find tag in project data
        const tag = projectData?.controllerTags?.find(t => t.name === tagName);
        
        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(tagName);
        contentMeta.innerHTML = `
            <span>Type: ${sanitizeInput(tag?.datatype || 'Unknown')}</span>
            <span>Usage: ${sanitizeInput(tag?.usage || 'Unknown')}</span>
            <span>Produced/Consumed Tag</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🔄</div>
                <h2>Produced/Consumed Tag Information</h2>
                <p>Tag: ${sanitizeInput(tagName)}</p>
                <p>Data Type: ${sanitizeInput(tag?.datatype || 'Unknown')}</p>
                <p>Usage: ${sanitizeInput(tag?.usage || 'Unknown')}</p>
                <p>Category: Produced/Consumed Tag</p>
                ${tag?.description ? `<p>Description: ${sanitizeInput(tag.description)}</p>` : ''}
                ${tag?.value ? `<p>Value: ${sanitizeInput(tag.value)}</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Produced/Consumed Tag content display failed:', error);
        showError('Failed to display produced/consumed tag content');
    }
}

// Show default content
export function showDefaultContent(name, type) {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(name);
        contentMeta.innerHTML = `<span>Type: ${sanitizeInput(type)}</span>`;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">📄</div>
                <h2>${sanitizeInput(name)}</h2>
                <p>Type: ${sanitizeInput(type)}</p>
                <p>Select a routine to view ladder logic content.</p>
            </div>
        `;

    } catch (error) {
        console.error('Default content display failed:', error);
        showError('Failed to display default content');
    }
}

// Show project info
export function showProjectInfo() {
    try {
        const contentHeader = document.getElementById('contentHeader');
        const contentTitle = document.getElementById('contentTitle');
        const contentMeta = document.getElementById('contentMeta');
        const rungContainer = document.getElementById('rungContainer');

        if (!contentHeader || !contentTitle || !contentMeta || !rungContainer) {
            throw new Error('Content elements not available');
        }

        // Calculate comprehensive statistics
        const stats = {
            tasks: projectData.tasks?.length || 0,
            programs: projectData.programs?.length || 0,
            controllerTags: projectData.controllerTags?.length || 0,
            dataTypes: projectData.dataTypes?.length || 0,
            addOnInstructions: projectData.addOnInstructions?.length || 0,
            motionGroups: projectData.motionGroups?.length || 0,
            localModules: projectData.ioConfiguration?.local?.length || 0,
            ethernetModules: projectData.ioConfiguration?.ethernet?.length || 0,
            devicenetModules: projectData.ioConfiguration?.devicenet?.length || 0,
            controlnetModules: projectData.ioConfiguration?.controlnet?.length || 0,
            safetyModules: projectData.safetyConfiguration?.safetyIO?.length || 0,
            trends: projectData.trendsAndDiagnostics?.trendConfigurations?.length || 0,
            diagnosticLogs: projectData.trendsAndDiagnostics?.diagnosticLogs?.length || 0
        };

        contentHeader.style.display = 'block';
        contentTitle.textContent = sanitizeInput(projectData.controller.name);
        contentMeta.innerHTML = `
            <span>Processor: ${sanitizeInput(projectData.controller.processortype || 'Unknown')}</span>
            <span>Version: ${sanitizeInput(projectData.controller.majorrev || '0')}.${sanitizeInput(projectData.controller.minorrev || '0')}</span>
            <span>Tasks: ${stats.tasks}</span>
            <span>Programs: ${stats.programs}</span>
            <span>Tags: ${stats.controllerTags}</span>
        `;

        rungContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🏭</div>
                <h2>${sanitizeInput(projectData.controller.name)}</h2>
                <p>Controller loaded successfully with complete Studio 5000-style structure!</p>
                <p>Navigate through the project tree to explore:</p>
                <ul style="text-align: left; margin: 1rem 0; padding-left: 2rem;">
                    <li><strong>Controller Tags</strong> - ${stats.controllerTags} tags (BOOL, DINT, REAL, STRING, TIMER, COUNTER, UDT, Array, Produced/Consumed)</li>
                    <li><strong>Tasks</strong> - ${stats.tasks} tasks (MainTask, Continuous, Periodic, Event) with programs and routines</li>
                    <li><strong>Motion Groups</strong> - ${stats.motionGroups} motion control groups with instructions</li>
                    <li><strong>Data Types</strong> - ${stats.dataTypes} user-defined types</li>
                    <li><strong>Add-On Instructions</strong> - ${stats.addOnInstructions} custom instructions</li>
                    <li><strong>I/O Configuration</strong> - ${stats.localModules + stats.ethernetModules + stats.devicenetModules + stats.controlnetModules} modules (Local, EtherNet/IP, DeviceNet, ControlNet, Other Networks)</li>
                    <li><strong>Safety</strong> - ${stats.safetyModules} safety modules (Safety Task, Safety I/O, Safety Configuration)</li>
                    <li><strong>Event Tasks</strong> - Event tasks with event configuration</li>
                    <li><strong>Trends & Diagnostics</strong> - ${stats.trends} trends, ${stats.diagnosticLogs} logs (Trend Configurations, Diagnostic Logs, Performance Data)</li>
                </ul>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--muted-text);">
                    This viewer now provides the complete Studio 5000 Logix Designer experience with all major sections, subsections, and the exact hierarchical structure that users expect from Studio 5000.
                </p>
            </div>
        `;

    } catch (error) {
        console.error('Project info display failed:', error);
        showError('Failed to display project info');
    }
}

// Show error
function showError(message) {
    try {
        const rungContainer = document.getElementById('rungContainer');
        if (rungContainer) {
            rungContainer.innerHTML = `
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