# PLC Ladder Logic Renderer Specification v2.0

## **Primary Objective**
Create a robust, responsive HTML/JavaScript component for rendering PLC ladder logic rungs with zero visual collisions, predictable layout behavior, and graceful handling of edge cases.

---

## **Core Architecture**

### **Three-Phase Rendering Pipeline**
The renderer must use a strict three-phase approach to eliminate race conditions and ensure consistent results:

1. **Measurement Phase**: Calculate all element dimensions without DOM manipulation
2. **Layout Phase**: Determine positions, wrapping, and collision zones  
3. **Render Phase**: Draw all elements once with finalized positions

### **Hierarchical Element Model**
Replace complex neighbor-aware contexts with a clean hierarchy:
```javascript
ElementContext = {
  rungId: string,
  pathId: string,        // "main" or "branch-{id}-path-{n}"
  indexInPath: number,
  parentBranch: Branch | null,
  depth: number          // nesting level for branches
}
```

### **Collision-Free Layering**
Use CSS z-index layers instead of multi-pass rendering:
- **Layer 1 (z-index: 10)**: Connection wires and rails
- **Layer 2 (z-index: 20)**: Element backgrounds and frames
- **Layer 3 (z-index: 30)**: Symbols, text, and interactive elements

---

## **Sizing and Spacing System**

### **Fixed Constants**
```javascript
const LAYOUT_CONSTANTS = {
  ELEMENT_MIN_WIDTH: 60,        // Minimum space per element
  ELEMENT_SPACING: 15,          // Gap between elements
  RAIL_PADDING: 25,             // Space from rails to content
  BRANCH_H_PADDING: 10,         // Horizontal padding inside branches
  BRANCH_V_SPACING: 8,          // Vertical spacing between branch paths
  RUNG_V_SPACING: 25,           // Gap between wrapped lines
  WRAP_INSET: 40,               // Inset for wrap connectors
  TEXT_PADDING: 4               // Padding around text labels
};
```

### **Dynamic Width Calculation**
```javascript
function calculateElementWidth(element) {
  const symbolWidth = getSymbolWidth(element.type);
  const textWidth = measureText(element.label) + (TEXT_PADDING * 2);
  const minWidth = ELEMENT_MIN_WIDTH;
  
  return {
    totalWidth: Math.max(symbolWidth, textWidth, minWidth),
    symbolWidth: symbolWidth,
    textWidth: textWidth
  };
}
```

### **Safe Text Measurement**
```javascript
function measureText(text, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    const width = getTextWidth(text);
    if (width > 0) return width;
    // Wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  // Fallback estimation
  return text.length * 8;
}
```

---

## **Layout Algorithm**

### **Phase 1: Element Measurement**
```javascript
function measureAllElements(rung) {
  const measurements = new Map();
  
  function measureElement(element) {
    if (measurements.has(element.id)) return measurements.get(element.id);
    
    const dims = calculateElementWidth(element);
    measurements.set(element.id, dims);
    
    // Recursively measure branch contents
    if (element.type === 'BRANCH') {
      element.paths.forEach(path => {
        path.elements.forEach(measureElement);
      });
    }
    
    return dims;
  }
  
  rung.elements.forEach(measureElement);
  return measurements;
}
```

### **Phase 2: Layout Calculation**
```javascript
function calculateLayout(rung, measurements, canvasWidth) {
  const layout = {
    lines: [],
    totalHeight: 0,
    collisionZones: []
  };
  
  const instructionWidth = canvasWidth - (RAIL_PADDING * 2);
  let currentLine = { elements: [], width: 0, height: 0 };
  
  for (const element of rung.elements) {
    const dims = measurements.get(element.id);
    const projectedWidth = currentLine.width + dims.totalWidth + ELEMENT_SPACING;
    
    // Check if wrapping is needed
    if (projectedWidth > instructionWidth && currentLine.elements.length > 0) {
      layout.lines.push(finalizeLine(currentLine));
      currentLine = { elements: [], width: 0, height: 0 };
    }
    
    // Add element to current line
    addElementToLine(currentLine, element, dims);
  }
  
  // Finalize last line
  if (currentLine.elements.length > 0) {
    layout.lines.push(finalizeLine(currentLine));
  }
  
  return layout;
}
```

### **Phase 3: Collision Detection**
```javascript
function detectCollisions(layout) {
  const zones = [];
  
  layout.lines.forEach((line, lineIndex) => {
    line.elements.forEach(element => {
      // Check text label boundaries
      const textZone = calculateTextBounds(element);
      
      // Check for overlaps with wires, other elements
      const conflicts = zones.filter(zone => zonesOverlap(textZone, zone));
      
      if (conflicts.length > 0) {
        // Adjust position or truncate text
        resolveCollision(element, conflicts);
      }
      
      zones.push(textZone);
    });
  });
  
  return zones;
}
```

---

## **Branch Rendering Rules**

### **Simplified Branch Structure**
```javascript
function renderBranch(branch, context) {
  const frame = calculateBranchFrame(branch);
  
  // Draw branch frame (always drawn first)
  drawBranchFrame(frame, {
    showStartBar: !context.isFirstInPath,
    showEndBar: !context.isLastInRung && !branch.isEmpty()
  });
  
  // Draw path contents (each path is independent)
  branch.paths.forEach((path, pathIndex) => {
    const pathY = frame.startY + (pathIndex * BRANCH_V_SPACING);
    drawPath(path, pathY, frame);
  });
  
  // Draw path equalizers (extend short paths)
  equalizePathLengths(branch.paths, frame);
}
```

### **Path Equalization Algorithm**
```javascript
function equalizePathLengths(paths, frame) {
  const maxPathWidth = Math.max(...paths.map(p => p.calculatedWidth));
  
  paths.forEach(path => {
    if (path.calculatedWidth < maxPathWidth) {
      const extensionLength = maxPathWidth - path.calculatedWidth;
      drawHorizontalWire(
        path.endX, 
        path.endX + extensionLength, 
        path.y
      );
    }
  });
}
```

---

## **Responsive Behavior**

### **Stable Resize Handling**
```javascript
class LadderRenderer {
  constructor(container) {
    this.container = container;
    this.resizeScheduled = false;
    this.measurements = null;
    
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.resizeScheduled) {
        this.resizeScheduled = true;
        requestAnimationFrame(() => this.handleResize());
      }
    });
    
    this.resizeObserver.observe(container);
  }
  
  handleResize() {
    this.resizeScheduled = false;
    
    // Remeasure only if container size changed significantly
    const newSize = this.container.getBoundingClientRect();
    if (this.sizeChanged(newSize)) {
      this.invalidateLayout();
      this.render();
    }
  }
  
  cleanup() {
    this.resizeObserver.disconnect();
  }
}
```

### **Wrap Connector Specification**
```javascript
function drawWrapConnector(fromElement, toElement, canvasWidth) {
  const path = [
    { x: fromElement.endX, y: fromElement.y },
    { x: canvasWidth - WRAP_INSET, y: fromElement.y },      // Right turn
    { x: canvasWidth - WRAP_INSET, y: toElement.y },        // Down
    { x: WRAP_INSET, y: toElement.y },                      // Across
    { x: toElement.startX, y: toElement.y }                 // To element
  ];
  
  drawPolyline(path);
}
```

---

## **Error Handling and Fallbacks**

### **Graceful Degradation**
```javascript
function renderWithFallbacks(rung, canvas) {
  try {
    return renderOptimal(rung, canvas);
  } catch (error) {
    console.warn('Optimal rendering failed, using fallback:', error);
    
    try {
      return renderSimplified(rung, canvas);
    } catch (fallbackError) {
      console.error('Fallback rendering failed:', fallbackError);
      return renderMinimal(rung, canvas);
    }
  }
}

function renderMinimal(rung, canvas) {
  // Ultra-simple horizontal layout with no branches
  // Guaranteed to work even with malformed data
}
```

### **Validation Rules**
```javascript
function validateRung(rung) {
  const errors = [];
  
  // Check for circular branch references
  if (hasCircularReferences(rung)) {
    errors.push('Circular branch references detected');
  }
  
  // Validate element types
  rung.elements.forEach(element => {
    if (!VALID_ELEMENT_TYPES.includes(element.type)) {
      errors.push(`Invalid element type: ${element.type}`);
    }
  });
  
  // Check for empty branches
  const emptyBranches = findEmptyBranches(rung);
  if (emptyBranches.length > 0) {
    errors.push('Empty branches detected');
  }
  
  return errors;
}
```

---

## **Performance Optimization**

### **Layout Caching**
```javascript
class LayoutCache {
  constructor() {
    this.cache = new Map();
  }
  
  getLayout(rungId, canvasWidth, rungHash) {
    const key = `${rungId}-${canvasWidth}-${rungHash}`;
    return this.cache.get(key);
  }
  
  setLayout(rungId, canvasWidth, rungHash, layout) {
    const key = `${rungId}-${canvasWidth}-${rungHash}`;
    this.cache.set(key, layout);
    
    // Prevent memory leaks
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
```

### **Virtual Rendering for Large Rungs**
```javascript
function renderVisibleElements(layout, viewportBounds) {
  return layout.lines.filter(line => {
    return lineIntersectsViewport(line, viewportBounds);
  }).flatMap(line => line.elements);
}
```

---

## **Testing Requirements**

### **Critical Test Cases**
1. **Single element rung**: Verify basic rendering and positioning
2. **Multi-element wrapping**: Test wrap points and connector routing
3. **Nested branches**: Verify proper frame drawing and path equalization
4. **Long text labels**: Test collision detection and resolution
5. **Empty branches**: Ensure graceful handling of malformed data
6. **Resize stress test**: Rapid container size changes
7. **Complex nesting**: Branches within branches within branches

### **Edge Case Scenarios**
- Canvas smaller than minimum element width
- Text labels longer than available space
- Circular branch references
- Missing or invalid element data
- Font loading failures
- Extremely deep nesting levels

This specification prioritizes reliability and maintainability over feature complexity, ensuring the renderer can handle real-world scenarios gracefully. 