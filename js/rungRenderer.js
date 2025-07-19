// ============================================================================
// ENHANCED RUNG RENDERER MODULE - Canvas-based Ladder Logic Graphics
// ============================================================================

import { sanitizeInput } from './utils.js';

// Enhanced configuration constants
const RENDER_CONFIG = {
    // Layout and spacing
    RUNG_V_SPACING: 40,      // Vertical PADDING between wrapped lines
    RUNG_TOP_PADDING: 50,
    POWER_RAIL_WIDTH: 8,
    WIRE_WIDTH: 3,
    CONTACT_WIDTH: 40,
    CONTACT_HEIGHT: 30,
    INSTRUCTION_BOX_WIDTH: 280,
    INSTRUCTION_BOX_HEIGHT: 120,
    COMPARISON_WIDTH: 60,
    COIL_RADIUS: 20,
    ELEMENT_SPACING: 40,      // Horizontal spacing between elements
    BRANCH_V_SPACING: 60,     // Vertical spacing for paths within a branch
    RAIL_PADDING: 40,         // Horizontal padding from power rails
    CANVAS_PADDING: 20,
    ELEMENT_HEIGHT: 40,
    BRANCH_SPACING: 80,
    TIMER_WIDTH: 80,
    COUNTER_WIDTH: 80,
    
    // Typography
    SYMBOL_FONT: 'bold 14px "Courier New", monospace',
    LABEL_FONT: '12px "Courier New", monospace',
    TAG_FONT_SIZE: 12,
    TAG_FONT_FAMILY: 'Arial, sans-serif',
    
    // Colors
    COLORS: {
        RAIL: '#10b981',      // Green for power rails
        WIRE: '#374151',      // Dark gray for wires
        CONTACT_NO: '#1f2937',
        CONTACT_NC: '#1f2937',
        COIL: '#ea580c',      // Orange for coils
        TIMER: '#f39c12',
        COUNTER: '#9b59b6',
        TEXT: '#1f2937',
        TEXT_BG: 'rgba(255, 255, 255, 0.85)', // Slightly transparent white for label backgrounds
        BACKGROUND: '#ffffff',
        BRANCH: '#3498db'
    },
    
    // Line widths
    LINE_WIDTH: 2
};

// Enhanced LadderRenderer class
class LadderRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container with id "${containerId}" not found.`);
        this.canvas = null;
        this.ctx = null;
        this.rungDefinition = null;
        this.resizeObserver = null;
        this.animationFrameId = null;
    }

    // Initializes canvas and sets up responsive resizing
    initialize(rungDefinition) {
        this.rungDefinition = rungDefinition;
        this.container.innerHTML = '';
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.resizeObserver = new ResizeObserver(() => this.redraw());
        this.resizeObserver.observe(this.container);

        this.redraw();
    }
    
    // Robust redraw scheduler
    redraw() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => this.updateCanvas());
    }

    // Canvas update and drawing logic
    updateCanvas() {
        if (!this.rungDefinition || !this.container.offsetParent) return;
        
        const { width } = this.container.getBoundingClientRect();
        this.canvas.width = width;

        // Calculate Layout & Required Height
        const { leftRailX, rightRailX } = this.getRailPositions();
        const tempRungDef = JSON.parse(JSON.stringify(this.rungDefinition));
        const positionedLayout = this.layoutElements(tempRungDef, leftRailX, rightRailX, this.ctx);
        const { rungTop, rungBottom } = this.getVerticalBounds(positionedLayout);
        const requiredHeight = (rungBottom - rungTop) + (RENDER_CONFIG.RUNG_TOP_PADDING * 2);
        const finalHeight = Math.max(requiredHeight, 300);

        this.canvas.height = Math.round(finalHeight);
        
        // Perform Drawing
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const yOffset = -rungTop + RENDER_CONFIG.RUNG_TOP_PADDING;
        this.shiftLayout(positionedLayout, yOffset);
        
        this.drawPowerRails(this.canvas.height);
        this.drawWires(positionedLayout, leftRailX, rightRailX);
        
        positionedLayout.forEach(line => {
            const isLastLine = line === positionedLayout[positionedLayout.length - 1];
            line.elements.forEach((el, elIndex) => {
                const isLastElementInRung = isLastLine && (elIndex === line.elements.length - 1);
                this.drawElement(el, isLastElementInRung, rightRailX);
            });
        });
        
        this.animationFrameId = null;
    }
    
    drawElement(el, isLastElementInRung = false, rightRailX = 0) {
        switch (el.type) {
            case 'NO_CONTACT': this.drawContact(el.x, el.y, el.label, 'NO', el); break;
            case 'NC_CONTACT': this.drawContact(el.x, el.y, el.label, 'NC', el); break;
            case 'OUTPUT_COIL': this.drawCoil(el.x, el.y, el.label, el); break;
            case 'BRANCH': this.drawBranch(el, isLastElementInRung, rightRailX); break;
            case 'INSTRUCTION_BOX': this.drawInstructionBox(el.x, el.y, el.label, el.instruction, el.params, el); break;
            case 'COMPARISON': this.drawComparison(el.x, el.y, el.label, el.instruction, el); break;
            case 'TIMER': this.drawTimer(el.x, el.y, el.label, el.instruction, el.preset, el); break;
            case 'COUNTER': this.drawCounter(el.x, el.y, el.label, el.instruction, el.preset, el); break;
        }
    }
    
    // Layout engine with dynamic vertical spacing
    layoutElements(rungDefinition, leftRailX, rightRailX, ctx) {
        const lines = [];
        let currentLineElements = [];
        let xCursor = leftRailX + RENDER_CONFIG.RAIL_PADDING;

        rungDefinition.forEach(el => this.calculateElementDimensions(el, ctx));
        
        rungDefinition.forEach(el => {
            const elementEndPos = xCursor + el.elWidth;
            
            if (currentLineElements.length > 0 && elementEndPos > (rightRailX - RENDER_CONFIG.RAIL_PADDING)) {
                lines.push({ elements: currentLineElements });
                currentLineElements = [];
                xCursor = leftRailX + RENDER_CONFIG.RAIL_PADDING;
            }
            
            currentLineElements.push(el);
            xCursor += el.elWidth + RENDER_CONFIG.ELEMENT_SPACING;
        });
        
        if (currentLineElements.length > 0 || lines.length === 0) {
            lines.push({ elements: currentLineElements });
        }

        // Dynamic Y-position calculation
        let currentY = 0;
        lines.forEach((line, index) => {
            let maxLineHeight = 0;
            line.elements.forEach(el => {
                if (el.elHeight > maxLineHeight) maxLineHeight = el.elHeight;
            });
            line.maxHeight = maxLineHeight;

            if (index > 0) {
                const prevLine = lines[index - 1];
                currentY += (prevLine.maxHeight / 2) + (line.maxHeight / 2) + RENDER_CONFIG.RUNG_V_SPACING;
            }
            line.y = currentY;
        });

        // Final pass to position elements horizontally and handle coil justification
        lines.forEach((line, lineIndex) => {
            const isLastLine = lineIndex === lines.length - 1;
            const lastElement = line.elements[line.elements.length - 1];
            let coilToJustify = null;

            if (isLastLine && lastElement && lastElement.type === 'OUTPUT_COIL') {
                coilToJustify = line.elements.pop();
            }

            let xPos = leftRailX + RENDER_CONFIG.RAIL_PADDING;
            line.elements.forEach(el => {
                el.x = xPos + el.elWidth / 2;
                el.y = line.y;
                xPos += el.elWidth + RENDER_CONFIG.ELEMENT_SPACING;
            });

            if (coilToJustify) {
                coilToJustify.x = rightRailX - RENDER_CONFIG.RAIL_PADDING - (coilToJustify.elWidth / 2);
                coilToJustify.y = line.y;
                line.elements.push(coilToJustify);
            }
        });

        return lines;
    }

    // Enhanced dimension calculation with text measurement
    calculateElementDimensions(el, ctx) {
        el.elHeight = RENDER_CONFIG.CONTACT_HEIGHT;
        let symbolWidth = 0;
        
        // Set font for measurement
        ctx.font = RENDER_CONFIG.LABEL_FONT;
        const labelWidth = el.label ? ctx.measureText(el.label).width + 10 : 0;

        switch(el.type) {
            case 'NO_CONTACT': case 'NC_CONTACT': 
                symbolWidth = RENDER_CONFIG.CONTACT_WIDTH; 
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'COMPARISON': 
                symbolWidth = RENDER_CONFIG.COMPARISON_WIDTH; 
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'OUTPUT_COIL': 
                symbolWidth = RENDER_CONFIG.COIL_RADIUS * 2; 
                el.elHeight = RENDER_CONFIG.COIL_RADIUS * 2;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'INSTRUCTION_BOX': 
                symbolWidth = RENDER_CONFIG.INSTRUCTION_BOX_WIDTH; 
                el.elHeight = RENDER_CONFIG.INSTRUCTION_BOX_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'TIMER':
                symbolWidth = RENDER_CONFIG.TIMER_WIDTH;
                el.elHeight = RENDER_CONFIG.ELEMENT_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'COUNTER':
                symbolWidth = RENDER_CONFIG.COUNTER_WIDTH;
                el.elHeight = RENDER_CONFIG.ELEMENT_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'BRANCH':
                let maxWidth = 0;
                let totalHeight = 0;
                
                el.paths.forEach(path => {
                    let pathWidth = 0;
                    let pathMaxHeight = 0;
                    path.elements.forEach(subEl => {
                        this.calculateElementDimensions(subEl, ctx);
                        pathWidth += subEl.elWidth;
                        if(subEl.elHeight > pathMaxHeight) pathMaxHeight = subEl.elHeight;
                    });
                    pathWidth += (path.elements.length > 1 ? (path.elements.length - 1) * RENDER_CONFIG.ELEMENT_SPACING : 0);
                    
                    const lastInPath = path.elements[path.elements.length - 1];
                    if(lastInPath && lastInPath.type === 'OUTPUT_COIL'){
                        pathWidth += RENDER_CONFIG.ELEMENT_SPACING * 2;
                    }

                    if (pathWidth > maxWidth) maxWidth = pathWidth;
                    path.pathHeight = pathMaxHeight;
                    totalHeight += pathMaxHeight;
                });
                
                totalHeight += (el.paths.length > 1 ? (el.paths.length - 1) * RENDER_CONFIG.BRANCH_V_SPACING : 0);
                el.elWidth = maxWidth + RENDER_CONFIG.ELEMENT_SPACING * 2;
                el.elHeight = totalHeight;
                break;
            default: 
                el.elWidth = 0; 
                break;
        }
    }

    getVerticalBounds(layout) {
        let rungTop = Infinity, rungBottom = -Infinity;
        if (layout.length === 0 || layout[0].elements.length === 0) return { rungTop: 0, rungBottom: 200 };
        
        layout.forEach(line => {
            line.elements.forEach(el => {
                const top = el.y - el.elHeight / 2 - 20;
                const bottom = el.y + el.elHeight / 2 + 20;
                if (top < rungTop) rungTop = top;
                if (bottom > rungBottom) rungBottom = bottom;
            });
        });
        return { rungTop, rungBottom };
    }

    shiftLayout(layout, yOffset) {
        layout.forEach(line => {
            line.y += yOffset;
            line.elements.forEach(el => {
                el.y += yOffset;
                if(el.type === 'BRANCH') {
                   this.shiftBranch(el, yOffset);
                }
            });
        });
    }

    shiftBranch(branchEl, yOffset){
        branchEl.paths.forEach(path => {
            path.elements.forEach(el => {
                el.y += yOffset;
                if(el.type === 'BRANCH') this.shiftBranch(el, yOffset);
            });
        });
    }
    
    getRailPositions() {
        const leftRailX = RENDER_CONFIG.POWER_RAIL_WIDTH / 2 + 20;
        const rightRailX = this.canvas.width - (RENDER_CONFIG.POWER_RAIL_WIDTH / 2) - 20;
        return { leftRailX, rightRailX };
    }

    drawPowerRails(height) {
        const { leftRailX, rightRailX } = this.getRailPositions();
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.RAIL;
        this.ctx.lineWidth = RENDER_CONFIG.POWER_RAIL_WIDTH;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(leftRailX, 0);
        this.ctx.lineTo(leftRailX, height);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(rightRailX, 0);
        this.ctx.lineTo(rightRailX, height);
        this.ctx.stroke();
    }

    drawWires(lines, leftRailX, rightRailX) {
        if (lines.length === 0 || lines[0].elements.length === 0) return;

        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
        this.ctx.lineWidth = RENDER_CONFIG.WIRE_WIDTH;
        this.ctx.lineCap = 'butt';

        lines.forEach(line => {
            for (let i = 0; i < line.elements.length - 1; i++) {
                const currentEl = line.elements[i];
                const nextEl = line.elements[i + 1];
                this.ctx.beginPath();
                this.ctx.moveTo(currentEl.x + currentEl.elWidth / 2, currentEl.y);
                this.ctx.lineTo(nextEl.x - nextEl.elWidth / 2, nextEl.y);
                this.ctx.stroke();
            }
        });

        const firstEl = lines[0].elements[0];
        this.ctx.beginPath();
        this.ctx.moveTo(leftRailX, firstEl.y);
        this.ctx.lineTo(firstEl.x - firstEl.elWidth / 2, firstEl.y);
        this.ctx.stroke();
        
        const lastLine = lines[lines.length - 1];
        const lastEl = lastLine.elements[lastLine.elements.length - 1];
        if (lastEl && lastEl.type !== 'BRANCH') {
            this.ctx.beginPath();
            this.ctx.moveTo(lastEl.x + lastEl.elWidth / 2, lastEl.y);
            this.ctx.lineTo(rightRailX, lastEl.y);
            this.ctx.stroke();
        }

        // Z-style wrapping between lines
        for (let i = 0; i < lines.length - 1; i++) {
            const endOfCurrentLine = lines[i].elements[lines[i].elements.length - 1];
            const startOfNextLine = lines[i + 1].elements[0];
            if (!endOfCurrentLine || !startOfNextLine) continue;

            const transferY = (lines[i].y + lines[i+1].y) / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(endOfCurrentLine.x + endOfCurrentLine.elWidth / 2, endOfCurrentLine.y);
            this.ctx.lineTo(rightRailX, endOfCurrentLine.y);
            this.ctx.lineTo(rightRailX, transferY);
            this.ctx.lineTo(leftRailX, transferY);
            this.ctx.lineTo(leftRailX, startOfNextLine.y);
            this.ctx.lineTo(startOfNextLine.x - startOfNextLine.elWidth / 2, startOfNextLine.y);
            this.ctx.stroke();
        }
    }

    drawTextAboveSymbol(text, x, y, el) {
        if (!text) return;
        this.ctx.font = RENDER_CONFIG.LABEL_FONT;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        const textMetrics = this.ctx.measureText(text);
        const textHeight = 14; 
        const textY = y - (el.elHeight / 2) - 8; 
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT_BG;
        this.ctx.fillRect(x - textMetrics.width / 2 - 4, textY - textHeight, textMetrics.width + 8, textHeight + 4);
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.fillText(text, x, textY);
    }

    drawContact(x, y, label, type, el) {
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = type === 'NC' ? RENDER_CONFIG.COLORS.CONTACT_NC : RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.lineWidth = 2.5;
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(type === 'NC' ? '|/|' : '| |', x, y);
    }

    drawComparison(x, y, label, text, el) {
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.lineWidth = 2.5;
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`[ ${text} ]`, x, y);
    }

    drawInstructionBox(x, y, label, instruction, params = {}, el) {
        this.drawTextAboveSymbol(label, x, y, el);
        const w = el.elWidth;
        const h = el.elHeight;
        
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
        this.ctx.lineWidth = 2.5;
        this.ctx.fillStyle = 'white';
        this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText(instruction, x, y - h/2 + 20);
        
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        let paramY = y - h/2 + 45;
        for (const [key, value] of Object.entries(params)) {
            this.ctx.fillText(`${key}: ${value}`, x - w/2 + 10, paramY);
            paramY += 20;
        }
    }

    drawCoil(x, y, label, el) {
        const r = RENDER_CONFIG.COIL_RADIUS;
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.COIL;
        this.ctx.lineWidth = 2.5;
        this.ctx.fillStyle = 'white';
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('( )', x, y);
    }

    drawTimer(x, y, label, instruction, preset, el) {
        this.drawTextAboveSymbol(label, x, y, el);
        const w = el.elWidth;
        const h = el.elHeight;
        
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.TIMER;
        this.ctx.lineWidth = 2.5;
        this.ctx.fillStyle = 'white';
        this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText(instruction, x, y - h/2 + 20);
        
        if (preset) {
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.fillText(`Preset: ${preset}`, x, y + h/2 - 10);
        }
    }

    drawCounter(x, y, label, instruction, preset, el) {
        this.drawTextAboveSymbol(label, x, y, el);
        const w = el.elWidth;
        const h = el.elHeight;
        
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.COUNTER;
        this.ctx.lineWidth = 2.5;
        this.ctx.fillStyle = 'white';
        this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText(instruction, x, y - h/2 + 20);
        
        if (preset) {
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.fillText(`Preset: ${preset}`, x, y + h/2 - 10);
        }
    }

    drawBranch(branchEl, isLastElementInRung = false, rightRailX = 0) {
        const { x, y, elWidth, elHeight, paths } = branchEl;
        const branchStartX = x - elWidth / 2;
        const internalBranchEndX = x + elWidth / 2;
        
        let startY = y - elHeight / 2;

        const topPathCenterY = startY + paths[0].pathHeight / 2;
        const bottomPathCenterY = startY + elHeight - paths[paths.length-1].pathHeight / 2;

        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
        this.ctx.lineWidth = RENDER_CONFIG.WIRE_WIDTH;
        this.ctx.beginPath();
        this.ctx.moveTo(branchStartX, topPathCenterY);
        this.ctx.lineTo(branchStartX, bottomPathCenterY);
        this.ctx.stroke();

        if (!isLastElementInRung) {
            this.ctx.beginPath();
            this.ctx.moveTo(internalBranchEndX, topPathCenterY);
            this.ctx.lineTo(internalBranchEndX, bottomPathCenterY);
            this.ctx.stroke();
        }

        paths.forEach(path => {
            const pathY = startY + path.pathHeight / 2;
            let currentXInPath = branchStartX;

            const lastInPath = path.elements[path.elements.length - 1];
            const hasCoilAtEnd = lastInPath && lastInPath.type === 'OUTPUT_COIL';
            const normalElements = hasCoilAtEnd ? path.elements.slice(0, -1) : path.elements;
            const coilToDraw = hasCoilAtEnd ? lastInPath : null;

            normalElements.forEach(element => {
                const elementX = currentXInPath + RENDER_CONFIG.ELEMENT_SPACING + element.elWidth / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(currentXInPath, pathY);
                this.ctx.lineTo(elementX - element.elWidth / 2, pathY);
                this.ctx.stroke();
                this.drawElement({ ...element, x: elementX, y: pathY });
                currentXInPath = elementX + element.elWidth / 2;
            });

            const finalEndX = isLastElementInRung ? rightRailX : internalBranchEndX;

            if (coilToDraw) {
                const justificationPadding = isLastElementInRung ? RENDER_CONFIG.RAIL_PADDING : RENDER_CONFIG.ELEMENT_SPACING;
                const coilX = finalEndX - justificationPadding - (coilToDraw.elWidth / 2);

                this.ctx.beginPath();
                this.ctx.moveTo(currentXInPath, pathY);
                this.ctx.lineTo(coilX - coilToDraw.elWidth / 2, pathY);
                this.ctx.stroke();
                
                this.drawElement({ ...coilToDraw, x: coilX, y: pathY });
                
                this.ctx.beginPath();
                this.ctx.moveTo(coilX + coilToDraw.elWidth / 2, pathY);
                this.ctx.lineTo(finalEndX, pathY);
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.moveTo(currentXInPath, pathY);
                this.ctx.lineTo(finalEndX, pathY);
                this.ctx.stroke();
            }
            startY += path.pathHeight + RENDER_CONFIG.BRANCH_V_SPACING;
        });
    }
    
    destroy() {
        if (this.resizeObserver && this.container) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.container) this.container.innerHTML = '';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Legacy compatibility functions
function getElementWidth(instruction) {
    if (!instruction) return RENDER_CONFIG.CONTACT_WIDTH;
    
    const instructionLower = instruction.toLowerCase();
    if (instructionLower.includes('ton') || instructionLower.includes('tof') || instructionLower.includes('rto')) {
        return RENDER_CONFIG.TIMER_WIDTH;
    }
    if (instructionLower.includes('ctu') || instructionLower.includes('ctd') || instructionLower.includes('ctud')) {
        return RENDER_CONFIG.COUNTER_WIDTH;
    }
    if (instructionLower.includes('ote') || instructionLower.includes('otl') || instructionLower.includes('otu')) {
        return RENDER_CONFIG.COIL_RADIUS * 2;
    }
    return RENDER_CONFIG.CONTACT_WIDTH;
}

function calculateElementWidth(instruction, tag = '') {
    if (!instruction) return 50;
    if (!tag) tag = '';

    const baseWidth = getElementWidth(instruction);
    const tagWidth = tag.length * 7;

    const minWidth = baseWidth + 10;
    const maxWidth = baseWidth + 60;

    return Math.min(Math.max(minWidth, tagWidth + 15), maxWidth);
}

// Enhanced parsing function that converts legacy format to new format
function parseLadderLogic(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const elements = [];
    const branches = [];
    let currentBranch = null;

    // Enhanced regex patterns
    const patterns = {
        contact: /(XIC|XIO)\s*\(([^)]+)\)/gi,
        coil: /(OTE|OTL|OTU)\s*\(([^)]+)\)/gi,
        timer: /(TON|TOF|RTO)\s*\(([^,]+),\s*([^)]+)\)/gi,
        counter: /(CTU|CTD|CTUD)\s*\(([^,]+),\s*([^)]+)\)/gi,
        comparison: /(EQU|NEQ|GRT|LES|GEQ|LEQ)\s*\(([^,]+),\s*([^)]+)\)/gi
    };

    let match;
    let lastIndex = 0;

    // Find all matches and their positions
    const allMatches = [];
    
    // Check for parallel branches [ ... ]
    const branchRegex = /\[([^\]]*)\]/g;
    while ((match = branchRegex.exec(text)) !== null) {
        allMatches.push({
            type: 'branch_start',
            start: match.index,
            end: match.index + match[0].length,
            content: match[1]
        });
    }

    // Check for all instruction types
    Object.entries(patterns).forEach(([type, pattern]) => {
        while ((match = pattern.exec(text)) !== null) {
            allMatches.push({
                type: type,
                start: match.index,
                end: match.index + match[0].length,
                instruction: match[1],
                tag: match[2],
                preset: match[3]
            });
        }
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start);

    // Process matches in order
    allMatches.forEach(match => {
        if (match.type === 'branch_start') {
            // Start new parallel branch
            currentBranch = {
                type: 'BRANCH',
                paths: [{
                    elements: []
                }]
            };
            branches.push(currentBranch);
        } else {
            // Create element in new format
            const element = {
                type: match.type === 'contact' ? (match.instruction === 'XIC' ? 'NO_CONTACT' : 'NC_CONTACT') :
                       match.type === 'coil' ? 'OUTPUT_COIL' :
                       match.type === 'timer' ? 'TIMER' :
                       match.type === 'counter' ? 'COUNTER' :
                       match.type === 'comparison' ? 'COMPARISON' : 'NO_CONTACT',
                label: match.tag,
                instruction: match.instruction,
                preset: match.preset
            };

            if (currentBranch) {
                currentBranch.paths[0].elements.push(element);
            } else {
                elements.push(element);
            }
        }
    });

    // Convert branches to new format
    branches.forEach(branch => {
        if (branch.paths[0].elements.length > 0) {
            elements.push(branch);
        }
    });

    return elements;
}

// Legacy renderRung function for backward compatibility
export function renderRung(rung, containerId, width = 800, height = 300) {
    try {
        if (!rung || !rung.text || !containerId) {
            console.log('ERROR: Invalid rung or container parameters');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.log('ERROR: Container not found');
            return;
        }

        // Parse the rung text into the new format
        const rungDefinition = parseLadderLogic(rung.text);
        
        // Create and initialize the enhanced renderer
        const renderer = new LadderRenderer(containerId);
        renderer.initialize(rungDefinition);

        // Store the renderer instance for cleanup
        container._renderer = renderer;

    } catch (error) {
        console.error('Error in renderRung:', error);
    }
}

// Export the enhanced renderer class for direct use
export { LadderRenderer, RENDER_CONFIG }; 