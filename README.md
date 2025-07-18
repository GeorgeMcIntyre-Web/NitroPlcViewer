# NitroPlcViewer - Studio 5000 Logix Designer Style PLC Viewer

A professional, web-based PLC ladder logic viewer that mimics the look and feel of Rockwell Automation's Studio 5000 Logix Designer. Built with pure HTML, CSS, and JavaScript for easy deployment and use.

## 🎯 Features

### **Core Functionality**
- **L5X File Support**: Load and parse Studio 5000 exported L5X project files
- **Hierarchical Project Tree**: Navigate through controller tags, tasks, programs, and routines
- **Ladder Logic Rendering**: Professional ladder logic diagrams with proper symbols
- **Structured Text Support**: View ST (Structured Text) routines
- **Multiple View Modes**: Switch between ladder diagram and neutral text views

### **Advanced Features**
- **Cross-Reference Analysis**: Find where tags and routines are used throughout the project
- **Go-To Navigation**: Quick navigation to specific routines and rungs
- **Routine Overview**: Visual overview of ladder logic routines
- **Search Functionality**: Search across the entire project tree
- **Zoom Controls**: Zoom in/out with keyboard shortcuts (Ctrl+=, Ctrl+-)
- **Keyboard Navigation**: Full keyboard support for accessibility

### **Professional UI/UX**
- **Studio 5000 Styling**: Authentic look and feel matching the original software
- **ISA-101 Compliant Colors**: Professional color scheme for industrial applications
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Resizable Panels**: Drag to resize the tree panel and content area divider
- **Accessibility**: ARIA labels, screen reader support, and keyboard navigation
- **High Contrast Mode**: Support for high contrast display preferences

## 🚀 Getting Started

### **Quick Start**
1. Download `RockwellViewer.html`
2. Open in any modern web browser
3. Click "📁 Open Project" to load an L5X file
4. Navigate through the project tree and view ladder logic

### **Requirements**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- L5X file exported from Studio 5000 Logix Designer

### **Keyboard Shortcuts**
- `Ctrl+G` - Go To dialog
- `Ctrl+E` - Cross Reference (when routine selected)
- `Ctrl+B` - Routine Overview (when ladder routine selected)
- `Ctrl+F` - Focus search box
- `Ctrl+=` / `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom

## 📁 File Structure

```
NitroPlcViewer/
├── RockwellViewer.html    # Main application file
├── README.md             # This file
├── docs/                 # Documentation directory
│   ├── implementation/   # Implementation guides
│   ├── fixes/           # Bug fix documentation
│   └── technical/       # Technical specifications
└── .gitignore           # Git ignore file
```

## 📚 Documentation

For detailed technical documentation, implementation guides, and bug fix summaries, see the [`docs/`](./docs/) directory:

- **[Documentation Index](./docs/README.md)** - Overview of all documentation
- **[Implementation Guides](./docs/implementation/)** - Studio 5000 implementation details
- **[Bug Fixes](./docs/fixes/)** - Issue resolution documentation

## 🔧 Technical Details

### **Ladder Logic Rendering**
- **SVG-based Graphics**: High-quality, scalable ladder logic diagrams
- **Professional Symbols**: Industry-standard contact, coil, and function block symbols
- **Branch Support**: Proper visualization of parallel branches and complex logic
- **Dynamic Sizing**: Elements automatically size based on content

### **L5X Parsing**
- **XML Parser**: Robust parsing of Studio 5000 L5X export format
- **Error Handling**: Graceful handling of malformed or incomplete files
- **Memory Efficient**: Optimized for large project files

### **Browser Compatibility**
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design support

## 🎨 Ladder Logic Elements

### **Supported Instructions**
- **Contacts**: XIC (Examine If Closed), XIO (Examine If Open)
- **Coils**: OTE (Output Energize), OTL (Output Latch), OTU (Output Unlatch)
- **Timers**: TON (Timer On), TOF (Timer Off), TONR (Timer On Retentive)
- **Counters**: CTU (Counter Up), CTD (Counter Down), CTUD (Counter Up/Down)
- **Data Movement**: MOV (Move), COP (Copy), CPS (Copy Synchronous)
- **Other**: FLL (Fill), and many more

### **Visual Features**
- **Power Flow Animation**: Visual indication of energized elements
- **Hover Effects**: Interactive feedback on ladder elements
- **Tooltips**: Detailed information on hover
- **Branch Visualization**: Clear parallel branch representation

## 🔍 Usage Examples

### **Loading a Project**
1. Export your Studio 5000 project as L5X
2. Open RockwellViewer.html in your browser
3. Click "Open Project" and select your L5X file
4. Navigate through the project tree on the left

### **Viewing Ladder Logic**
1. Select a routine from the project tree
2. View the ladder logic in the main panel
3. Switch between "Ladder Diagram" and "Neutral Text" views
4. Use zoom controls to adjust the view
5. Drag the divider between tree and content panels to resize

### **Resizing Panels**
1. Hover over the divider between the tree panel and content area
2. Click and drag the divider left or right to resize
3. The tree panel can be resized between 200px and 600px width
4. Release to set the new size

### **Cross-Reference Analysis**
1. Select a routine or tag
2. Click "Cross Reference (Ctrl+E)"
3. View all locations where the item is used
4. Click on references to navigate directly

## 🛠️ Development

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/yourusername/NitroPlcViewer.git
cd NitroPlcViewer

# Open in browser
start RockwellViewer.html
```

### **Customization**
The application uses CSS custom properties for easy theming:
```css
:root {
    --primary-bg: #1e3a8a;      /* Header background */
    --accent-color: #2563eb;    /* Primary accent */
    --contact-color: #2563eb;   /* Contact elements */
    --coil-color: #ea580c;      /* Coil elements */
    --function-color: #7c3aed;  /* Function blocks */
}
```

## 📋 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 80+ | ✅ Full |
| Firefox | 75+ | ✅ Full |
| Safari | 13+ | ✅ Full |
| Edge | 80+ | ✅ Full |
| IE | 11 | ❌ Not Supported |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Rockwell Automation**: For the Studio 5000 Logix Designer interface inspiration
- **ISA-101**: For industrial automation color scheme standards
- **SVG Community**: For scalable vector graphics implementation

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure your L5X file is properly exported from Studio 5000
3. Try refreshing the page and reloading the file
4. Open an issue on GitHub with details about the problem

---

**Built with ❤️ for the industrial automation community** 