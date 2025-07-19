// ============================================================================
// HIGH-FIDELITY PLC LADDER LOGIC RENDERER - Canvas-based Graphics
// ============================================================================

import { sanitizeInput } from './utils.js';

// Enhanced configuration constants with proper spacing rules
const RENDER_CONFIG = {
    // Layout and spacing
    RUNG_V_SPACING: 80,      // Vertical PADDING between wrapped lines (increased for better text visibility)
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
    BRANCH_H_PADDING: 20,     // Horizontal padding inside a branch
    WRAP_PADDING: 30,         // Inset distance for Z-style wrap connectors
    WRAP_VERTICAL_PADDING: 40, // Vertical padding for Z-wrap transfer points (increased for better text visibility)
    SYMBOL_PADDING: 4,        // Small padding around symbols for wire connections
    TEXT_PADDING: 10,         // Vertical padding for text above symbols
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
        WIRE: '#374151',      // Dark gray for regular wires
        Z_WRAP_WIRE: '#dc2626', // Red for Z-wrap wires (distinct color)
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

// Context object for element drawing
class DrawingContext {
    constructor(prevEl = null, nextEl = null, isFirstInLine = false, isLastInRung = false, isLastInLine = false) {
        this.prevEl = prevEl;
        this.nextEl = nextEl;
        this.isFirstInLine = isFirstInLine;
        this.isLastInRung = isLastInRung;
        this.isLastInLine = isLastInLine;
    }
}

// High-Fidelity LadderRenderer class
class LadderRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container with id "${containerId}" not found.`);
        this.canvas = null;
        this.ctx = null;
        this.rungDefinition = null;
        this.resizeObserver = null;
        this.animationFrameId = null;
        this.needsRedraw = false;
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
        
        // ResizeObserver only sets flag, actual redraw happens in animation frame
        this.resizeObserver = new ResizeObserver(() => {
            this.needsRedraw = true;
        });
        this.resizeObserver.observe(this.container);

        this.startRenderLoop();
    }
    
    // Stable resize handling with animation frame loop
    startRenderLoop() {
        const renderLoop = () => {
            if (this.needsRedraw) {
                this.updateCanvas();
                this.needsRedraw = false;
            }
            this.animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
    }

    // Canvas update and drawing logic
    updateCanvas() {
        if (!this.rungDefinition || !this.container.offsetParent) return;
        
        const { width } = this.container.getBoundingClientRect();
        this.canvas.width = width;

        // Ensure canvas has proper dimensions before calculating rail positions
        if (this.canvas.width <= 0) {
            this.canvas.width = 800;
        }

        // Calculate Layout & Required Height
        const { leftRailX, rightRailX } = this.getRailPositions();
        const tempRungDef = JSON.parse(JSON.stringify(this.rungDefinition));
        const positionedLayout = this.layoutElements(tempRungDef, leftRailX, rightRailX, this.ctx);
        const { rungTop, rungBottom } = this.getVerticalBounds(positionedLayout);
        const requiredHeight = (rungBottom - rungTop) + (RENDER_CONFIG.RUNG_TOP_PADDING * 2);
        const finalHeight = Math.max(requiredHeight, 300);

        this.canvas.height = Math.round(finalHeight);
        
        // Perform Drawing with strict layering
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const yOffset = -rungTop + RENDER_CONFIG.RUNG_TOP_PADDING;
        this.shiftLayout(positionedLayout, yOffset);
        
        // PASS 1: Draw all wireframes (power rails, wires, branch frames)
        this.drawPowerRails(this.canvas.height);
        this.drawWires(positionedLayout, leftRailX, rightRailX);
        
        // PASS 2: Draw all elements (symbols and text labels)
        positionedLayout.forEach((line, lineIndex) => {
            const isLastLine = lineIndex === positionedLayout.length - 1;
            line.elements.forEach((el, elIndex) => {
                const isLastElementInLine = elIndex === line.elements.length - 1;
                const isLastElementInRung = isLastLine && isLastElementInLine;
                const prevEl = elIndex > 0 ? line.elements[elIndex - 1] : null;
                const nextEl = elIndex < line.elements.length - 1 ? line.elements[elIndex + 1] : null;
                
                const context = new DrawingContext(
                    prevEl, 
                    nextEl, 
                    elIndex === 0, 
                    isLastElementInRung, 
                    isLastElementInLine
                );
                
                this.drawElement(el, context, rightRailX);
            });
        });
    }
    
    // Context-aware element drawing
    drawElement(el, context, rightRailX = 0) {
        switch (el.type) {
            case 'NO_CONTACT': 
                this.drawContact(el.x, el.y, el.label, 'NO', el, context); 
                break;
            case 'NC_CONTACT': 
                this.drawContact(el.x, el.y, el.label, 'NC', el, context); 
                break;
            case 'OUTPUT_COIL': 
                this.drawCoil(el.x, el.y, el.label, el, context); 
                break;
            case 'BRANCH': 
                this.drawBranch(el, context, rightRailX); 
                break;
            case 'INSTRUCTION_BOX': 
                this.drawInstructionBox(el.x, el.y, el.label, el.instruction, el.params, el, context); 
                break;
            case 'COMPARISON': 
                this.drawComparison(el.x, el.y, el.label, el.instruction, el, context); 
                break;
            case 'TIMER': 
                this.drawTimer(el.x, el.y, el.label, el.instruction, el.preset, el, context); 
                break;
            case 'COUNTER': 
                this.drawCounter(el.x, el.y, el.label, el.instruction, el.preset, el, context); 
                break;
        }
    }
    
    // Layout engine with dynamic vertical spacing and consistent padding
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
            // Use consistent spacing that accounts for symbol width padding
            xCursor += el.elWidth + RENDER_CONFIG.ELEMENT_SPACING;
        });
        
        if (currentLineElements.length > 0 || lines.length === 0) {
            lines.push({ elements: currentLineElements });
        }

        // Dynamic Y-position calculation with enhanced spacing for text visibility
        let currentY = 0;
        lines.forEach((line, index) => {
            let maxLineHeight = 0;
            line.elements.forEach(el => {
                // Account for text height above symbols when calculating line height
                const textHeight = el.label ? 24 : 0; // 14px text + 10px padding
                const totalElementHeight = el.elHeight + textHeight;
                if (totalElementHeight > maxLineHeight) maxLineHeight = totalElementHeight;
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

    // Enhanced dimension calculation with symbol width separation
    calculateElementDimensions(el, ctx) {
        el.elHeight = RENDER_CONFIG.CONTACT_HEIGHT;
        let symbolWidth = 0;
        
        // Set font for measurement
        ctx.font = RENDER_CONFIG.LABEL_FONT;
        const labelWidth = el.label ? ctx.measureText(el.label).width + 10 : 0;

        switch(el.type) {
            case 'NO_CONTACT': case 'NC_CONTACT': 
                symbolWidth = RENDER_CONFIG.CONTACT_WIDTH + (RENDER_CONFIG.SYMBOL_PADDING * 2); 
                el.symbolWidth = symbolWidth;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'COMPARISON': 
                symbolWidth = RENDER_CONFIG.COMPARISON_WIDTH + (RENDER_CONFIG.SYMBOL_PADDING * 2); 
                el.symbolWidth = symbolWidth;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'OUTPUT_COIL': 
                symbolWidth = (RENDER_CONFIG.COIL_RADIUS * 2) + (RENDER_CONFIG.SYMBOL_PADDING * 2); 
                el.symbolWidth = symbolWidth;
                el.elHeight = RENDER_CONFIG.COIL_RADIUS * 2;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'INSTRUCTION_BOX': 
                symbolWidth = RENDER_CONFIG.INSTRUCTION_BOX_WIDTH + (RENDER_CONFIG.SYMBOL_PADDING * 2); 
                el.symbolWidth = symbolWidth;
                el.elHeight = RENDER_CONFIG.INSTRUCTION_BOX_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'TIMER':
                symbolWidth = RENDER_CONFIG.TIMER_WIDTH + (RENDER_CONFIG.SYMBOL_PADDING * 2);
                el.symbolWidth = symbolWidth;
                el.elHeight = RENDER_CONFIG.ELEMENT_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'COUNTER':
                symbolWidth = RENDER_CONFIG.COUNTER_WIDTH + (RENDER_CONFIG.SYMBOL_PADDING * 2);
                el.symbolWidth = symbolWidth;
                el.elHeight = RENDER_CONFIG.ELEMENT_HEIGHT;
                el.elWidth = Math.max(symbolWidth, labelWidth);
                break;
            case 'BRANCH':
                let maxWidth = 0;
                let totalHeight = 0;
                
                el.paths.forEach(path => {
                    let pathWidth = RENDER_CONFIG.BRANCH_H_PADDING * 2;
                    let pathHeight = 0;
                    
                    path.elements.forEach(element => {
                        this.calculateElementDimensions(element, ctx);
                        // Use consistent spacing that accounts for symbol width padding
                        pathWidth += element.elWidth + RENDER_CONFIG.ELEMENT_SPACING;
                        if (element.elHeight > pathHeight) pathHeight = element.elHeight;
                    });
                    
                    // Ensure minimum branch width with proper padding
                    pathWidth = Math.max(pathWidth, 200 + RENDER_CONFIG.BRANCH_H_PADDING * 2);
                    path.pathWidth = pathWidth;
                    path.pathHeight = pathHeight;
                    
                    if (pathWidth > maxWidth) maxWidth = pathWidth;
                    totalHeight += pathHeight;
                });
                
                totalHeight += (el.paths.length - 1) * RENDER_CONFIG.BRANCH_V_SPACING;
                el.symbolWidth = maxWidth;
                el.elWidth = maxWidth;
                el.elHeight = totalHeight;
                break;
        }
    }

    getVerticalBounds(layout) {
        if (layout.length === 0) return { rungTop: 0, rungBottom: 100 };
        
        let rungTop = Infinity;
        let rungBottom = -Infinity;
        
        layout.forEach(line => {
            const lineTop = line.y - line.maxHeight / 2;
            const lineBottom = line.y + line.maxHeight / 2;
            
            if (lineTop < rungTop) rungTop = lineTop;
            if (lineBottom > rungBottom) rungBottom = lineBottom;
        });
        
        return { rungTop, rungBottom };
    }

    shiftLayout(layout, yOffset) {
        layout.forEach(line => {
            line.y += yOffset;
            line.elements.forEach(el => {
                el.y += yOffset;
                if (el.type === 'BRANCH') {
                    this.shiftBranch(el, yOffset);
                }
            });
        });
    }

    shiftBranch(branchEl, yOffset) {
        branchEl.paths.forEach(path => {
            path.elements.forEach(element => {
                element.y += yOffset;
            });
        });
    }

    getRailPositions() {
        // Ensure proper canvas width
        if (!this.canvas || this.canvas.width <= 0) {
            return { leftRailX: 50, rightRailX: 750 };
        }
        
        const leftRailX = RENDER_CONFIG.CANVAS_PADDING + RENDER_CONFIG.POWER_RAIL_WIDTH / 2;
        const rightRailX = this.canvas.width - RENDER_CONFIG.CANVAS_PADDING - RENDER_CONFIG.POWER_RAIL_WIDTH / 2;
        
        // Ensure rail positions are valid
        if (rightRailX <= leftRailX) {
            return { leftRailX: 50, rightRailX: 750 };
        }
        
        return { leftRailX, rightRailX };
    }

    drawPowerRails(height) {
        const { leftRailX, rightRailX } = this.getRailPositions();
        
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.RAIL;
        this.ctx.lineWidth = RENDER_CONFIG.POWER_RAIL_WIDTH;
        this.ctx.lineCap = 'round';
        
        // Left power rail
        this.ctx.beginPath();
        this.ctx.moveTo(leftRailX, 0);
        this.ctx.lineTo(leftRailX, height);
        this.ctx.stroke();
        
        // Right power rail
        this.ctx.beginPath();
        this.ctx.moveTo(rightRailX, 0);
        this.ctx.lineTo(rightRailX, height);
        this.ctx.stroke();
    }

    // PASS 1: Wire drawing with Z-style wrapping and proper color coding
    drawWires(lines, leftRailX, rightRailX) {
        if (lines.length === 0 || lines[0].elements.length === 0) return;

        this.ctx.lineWidth = RENDER_CONFIG.WIRE_WIDTH;
        this.ctx.lineCap = 'butt';

        // Draw connections between elements - ALL REGULAR WIRES ARE THE SAME COLOR
        lines.forEach(line => {
            for (let i = 0; i < line.elements.length - 1; i++) {
                const currentEl = line.elements[i];
                const nextEl = line.elements[i + 1];
                
                // HARDENED RULE: Always connect to symbol width edges with small padding
                const currentEndX = currentEl.x + currentEl.symbolWidth / 2;
                const nextStartX = nextEl.x - nextEl.symbolWidth / 2;
                
                // FIXED: All regular connection wires use the same color (dark gray)
                this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
                this.ctx.beginPath();
                this.ctx.moveTo(currentEndX, currentEl.y);
                this.ctx.lineTo(nextStartX, nextEl.y);
                this.ctx.stroke();
            }
        });

        // Draw left power rail connection
        const firstEl = lines[0].elements[0];
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
        this.ctx.beginPath();
        this.ctx.moveTo(leftRailX, firstEl.y);
        this.ctx.lineTo(firstEl.x - firstEl.symbolWidth / 2, firstEl.y);
        this.ctx.stroke();
        
        // Draw right power rail connection - ALL REGULAR WIRES ARE THE SAME COLOR
        const lastLine = lines[lines.length - 1];
        const lastEl = lastLine.elements[lastLine.elements.length - 1];
        if (lastEl && lastEl.type !== 'BRANCH') {
            // HARDENED RULE: Ensure wire extends properly to symbol edge with padding
            const symbolConnectionX = lastEl.x + lastEl.symbolWidth / 2;
            
            // FIXED: All regular connection wires use the same color (dark gray)
            this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE;
            this.ctx.beginPath();
            this.ctx.moveTo(symbolConnectionX, lastEl.y);
            this.ctx.lineTo(rightRailX, lastEl.y);
            this.ctx.stroke();
        }

        // Z-style wrapping between lines with enhanced padding and routing
        for (let i = 0; i < lines.length - 1; i++) {
            const endOfCurrentLine = lines[i].elements[lines[i].elements.length - 1];
            const startOfNextLine = lines[i + 1].elements[0];
            if (!endOfCurrentLine || !startOfNextLine) continue;

            // Calculate transfer point with proper vertical padding for better text visibility
            const currentLineY = lines[i].y;
            const nextLineY = lines[i + 1].y;
            const verticalGap = Math.abs(nextLineY - currentLineY);
            
            // Ensure adequate vertical spacing for the Z-wrap with configurable padding
            const minVerticalSpacing = RENDER_CONFIG.WRAP_VERTICAL_PADDING;
            const transferY = currentLineY + (nextLineY - currentLineY) / 2;
            const rightTransferY = transferY;
            const leftTransferY = transferY;
            
            // Apply minimum vertical spacing if gap is too small, ensuring text visibility
            const effectiveTransferY = verticalGap < minVerticalSpacing * 2 
                ? currentLineY + (nextLineY > currentLineY ? minVerticalSpacing : -minVerticalSpacing)
                : transferY;

            // Use distinct color for Z-wrap wires
            this.ctx.strokeStyle = RENDER_CONFIG.COLORS.Z_WRAP_WIRE;
            this.ctx.lineWidth = RENDER_CONFIG.WIRE_WIDTH;
            
            this.ctx.beginPath();
            // FIXED: Start from the end of current line with proper symbol edge connection
            this.ctx.moveTo(endOfCurrentLine.x + endOfCurrentLine.symbolWidth / 2, endOfCurrentLine.y);
            // Go right to the wrap area
            this.ctx.lineTo(rightRailX - RENDER_CONFIG.WRAP_PADDING, endOfCurrentLine.y);
            // Go down to transfer level with proper vertical padding
            this.ctx.lineTo(rightRailX - RENDER_CONFIG.WRAP_PADDING, effectiveTransferY);
            // Go left across the top
            this.ctx.lineTo(leftRailX + RENDER_CONFIG.WRAP_PADDING, effectiveTransferY);
            // Go down to next line level
            this.ctx.lineTo(leftRailX + RENDER_CONFIG.WRAP_PADDING, startOfNextLine.y);
            // FIXED: Go right to the start of next line with proper symbol edge connection
            this.ctx.lineTo(startOfNextLine.x - startOfNextLine.symbolWidth / 2, startOfNextLine.y);
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
        // Consistent text positioning above symbols with proper padding
        const textY = y - (el.elHeight / 2) - RENDER_CONFIG.TEXT_PADDING;
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT_BG;
        this.ctx.fillRect(x - textMetrics.width / 2 - 4, textY - textHeight, textMetrics.width + 8, textHeight + 4);
        
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.fillText(text, x, textY);
    }

    // PASS 2: Element drawing functions (symbols and text only)
    drawContact(x, y, label, type, el, context) {
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = type === 'NC' ? RENDER_CONFIG.COLORS.CONTACT_NC : RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.lineWidth = 2.5;
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(type === 'NC' ? '|/|' : '| |', x, y);
    }

    drawComparison(x, y, label, text, el, context) {
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.CONTACT_NO;
        this.ctx.lineWidth = 2.5;
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`[ ${text} ]`, x, y);
    }

    drawInstructionBox(x, y, label, instruction, params = {}, el, context) {
        this.drawTextAboveSymbol(label, x, y, el);
        // HARDENED RULE: Always use symbolWidth for consistent wire connections
        const w = el.symbolWidth;
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

    drawCoil(x, y, label, el, context) {
        // HARDENED RULE: Use symbolWidth to ensure wire connections align with symbol edges
        const symbolWidth = el.symbolWidth;
        const symbolRadius = symbolWidth / 2;
        
        this.drawTextAboveSymbol(label, x, y, el);
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.COIL;
        this.ctx.lineWidth = 2.5;
        this.ctx.fillStyle = 'white';
        
        // Draw coil circle with proper symbol width for wire connections
        this.ctx.beginPath();
        this.ctx.arc(x, y, symbolRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.font = RENDER_CONFIG.SYMBOL_FONT;
        this.ctx.fillStyle = RENDER_CONFIG.COLORS.TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('( )', x, y);
    }

    drawTimer(x, y, label, instruction, preset, el, context) {
        this.drawTextAboveSymbol(label, x, y, el);
        // HARDENED RULE: Always use symbolWidth for consistent wire connections
        const w = el.symbolWidth;
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

    drawCounter(x, y, label, instruction, preset, el, context) {
        this.drawTextAboveSymbol(label, x, y, el);
        // HARDENED RULE: Always use symbolWidth for consistent wire connections
        const w = el.symbolWidth;
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

    // PASS 1: Branch wireframe drawing (strict two-pass rendering)
    drawBranch(branchEl, context, rightRailX = 0) {
        const { x, y, elWidth, elHeight, paths } = branchEl;
        const branchStartX = x - elWidth / 2;
        const internalBranchEndX = x + elWidth / 2;
        
        let startY = y - elHeight / 2;

        const topPathCenterY = startY + paths[0].pathHeight / 2;
        const bottomPathCenterY = startY + elHeight - paths[paths.length-1].pathHeight / 2;

        // PASS 1: Draw branch wireframe only - FIXED: Use consistent wire color
        this.ctx.strokeStyle = RENDER_CONFIG.COLORS.WIRE; // Changed from BRANCH to WIRE for consistency
        this.ctx.lineWidth = RENDER_CONFIG.WIRE_WIDTH;
        
        // Draw start vertical bar
        this.ctx.beginPath();
        this.ctx.moveTo(branchStartX, topPathCenterY);
        this.ctx.lineTo(branchStartX, bottomPathCenterY);
        this.ctx.stroke();

        // Draw end vertical bar (conditional termination)
        if (!context.isLastInRung) {
            this.ctx.beginPath();
            this.ctx.moveTo(internalBranchEndX, topPathCenterY);
            this.ctx.lineTo(internalBranchEndX, bottomPathCenterY);
            this.ctx.stroke();
        }

        // Draw internal path wires - FIXED: Ensure all connections are drawn
        paths.forEach(path => {
            const pathY = startY + path.pathHeight / 2;
            let currentXInPath = branchStartX + RENDER_CONFIG.BRANCH_H_PADDING;

            // Draw wire from start bar to first element
            if (path.elements.length > 0) {
                const firstElement = path.elements[0];
                const firstElementX = currentXInPath + firstElement.elWidth / 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(branchStartX, pathY);
                // HARDENED RULE: Always connect to symbol width edges with small padding
                this.ctx.lineTo(firstElementX - firstElement.symbolWidth / 2, pathY);
                this.ctx.stroke();
                
                currentXInPath = firstElementX + firstElement.elWidth / 2;
            }

            // Draw wires between elements - FIXED: Ensure all connections are drawn
            for (let i = 0; i < path.elements.length - 1; i++) {
                const currentEl = path.elements[i];
                const nextEl = path.elements[i + 1];
                
                // HARDENED RULE: Always connect to symbol width edges with small padding
                const currentEndX = currentEl.x + currentEl.symbolWidth / 2;
                const nextStartX = nextEl.x - nextEl.symbolWidth / 2;
                
                this.ctx.beginPath();
                this.ctx.moveTo(currentEndX, pathY);
                this.ctx.lineTo(nextStartX, pathY);
                this.ctx.stroke();
            }

            // Draw wire from last element to end bar - FIXED: Ensure connection to power rail
            if (path.elements.length > 0) {
                const lastElement = path.elements[path.elements.length - 1];
                // FIXED: Always connect to power rail when branch is last in rung
                const finalEndX = context.isLastInRung ? rightRailX : internalBranchEndX;
                
                this.ctx.beginPath();
                this.ctx.moveTo(lastElement.x + lastElement.symbolWidth / 2, pathY);
                this.ctx.lineTo(finalEndX, pathY);
                this.ctx.stroke();
            } else {
                // FIXED: Handle empty branch paths - connect start to end
                const finalEndX = context.isLastInRung ? rightRailX : internalBranchEndX;
                this.ctx.beginPath();
                this.ctx.moveTo(branchStartX, pathY);
                this.ctx.lineTo(finalEndX, pathY);
                this.ctx.stroke();
            }
            
            startY += path.pathHeight + RENDER_CONFIG.BRANCH_V_SPACING;
        });

        // PASS 2: Recursively draw all internal elements (ensures they're on top)
        startY = y - elHeight / 2;
        paths.forEach(path => {
            const pathY = startY + path.pathHeight / 2;
            let currentXInPath = branchStartX + RENDER_CONFIG.BRANCH_H_PADDING;

            path.elements.forEach((element, elementIndex) => {
                const elementX = currentXInPath + element.elWidth / 2;
                
                // Create context for internal elements
                const internalContext = new DrawingContext(
                    elementIndex > 0 ? path.elements[elementIndex - 1] : null,
                    elementIndex < path.elements.length - 1 ? path.elements[elementIndex + 1] : null,
                    elementIndex === 0,
                    context.isLastInRung && elementIndex === path.elements.length - 1,
                    elementIndex === path.elements.length - 1
                );
                
                this.drawElement({ ...element, x: elementX, y: pathY }, internalContext, rightRailX);
                currentXInPath = elementX + element.elWidth / 2;
            });
            
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

// Export the main rendering function
export function renderRung(rung, containerId, width = 800, height = 300) {
    const renderer = new LadderRenderer(containerId);
    
    // Handle both string and object inputs
    let rungText;
    if (typeof rung === 'string') {
        rungText = rung;
    } else if (rung && typeof rung === 'object' && rung.text) {
        rungText = rung.text;
    } else {
        throw new Error('Invalid rung parameter: must be a string or object with text property');
    }
    
    const elements = parseLadderLogic(rungText);
    renderer.initialize(elements);
    return renderer;
} 