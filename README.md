# Glitch Camera

Glitch Camera is a web application that captures real-time video from webcam and applies **image format corruption effects** through byte-level character replacement. Instead of traditional visual filters, it corrupts the actual JPEG/PNG/WebP/BMP data streams to create truly "accidental" digital artifacts.

## 🎯 Core Philosophy

- **Deterministic corruption**: Same input always produces same output (no randomness)
- **Accidental data corruption**: Simulates real-world file corruption through character replacement
- **Format-aware processing**: Corrupts image format streams while respecting header structures
- **Privacy-first**: All processing happens client-side, no data transmission

## ✨ Features

### 🔧 Corruption Engine
- **Character Replacement**: Replace any UTF-8 character with another (e.g., 'a' → 'b')
- **4 Format Modes**: JPEG, PNG, WebP, BMP stream corruption
- **Header Protection**: Preserves critical format headers to maintain basic readability
- **Real-time Processing**: Live camera feed corruption at 500ms intervals

### 🎨 User Interface
- **Dark Theme**: Magenta/cyan accent colors on dark background
- **UTF-8 Support**: Input any UTF-8 characters for replacement
- **Character Hints**: Real-time hex display of character byte values
- **Live Preview**: Immediate visual feedback of corruption effects

### 🔒 Technical Features
- **No External Dependencies**: Pure vanilla JavaScript implementation
- **ES6 Modules**: Clean modular architecture
- **Comprehensive Testing**: 56 automated tests with 100% pass rate
- **Mobile Responsive**: Touch-friendly controls and responsive design

## 🚀 Quick Start

### Local Development
```bash
# Clone repository
git clone [repository-url]
cd glitchcam

# Serve locally (HTTPS required for camera access)
python -m http.server 8000
# or
npx serve

# Open in browser
open https://localhost:8000
```

### GitHub Pages Deployment
1. Enable GitHub Pages in repository settings
2. Set source to main branch
3. Access at: `https://username.github.io/glitchcam`

## 🏗️ Architecture

### Core Modules
- **`GlitchEngine`** (`js/glitch.js`): Image format corruption and character replacement
- **`CameraController`** (`js/camera.js`): WebRTC camera access and canvas operations
- **`UIController`** (`js/ui.js`): User interface controls and event handling
- **`GlitchCameraApp`** (`js/main.js`): Application orchestration and render loop

### Corruption Algorithm
1. **Capture Frame**: Extract ImageData from camera stream
2. **Format Conversion**: Convert to selected image format (JPEG/PNG/WebP/BMP)
3. **Character Replacement**: Replace source characters with destination characters in byte stream
4. **Header Protection**: Preserve format-specific header bytes
5. **Reconstruction**: Convert corrupted bytes back to displayable image

### Format-Specific Details
- **JPEG**: Preserves first 50 bytes, optimized for quality 0.1 compression
- **PNG**: Preserves first 200 bytes, includes PNG signature and critical chunks
- **WebP**: Preserves first 100 bytes, maintains WebP container structure  
- **BMP**: Preserves first 30 bytes, keeps bitmap file header intact

## 🎮 Usage

### Basic Operation
1. **Enable Camera**: Click "Start Camera" button
2. **Set Characters**: Enter source and destination characters (UTF-8 supported)
3. **Choose Format**: Select corruption mode (JPEG/PNG/WebP/BMP)
4. **Configure Protection**: Toggle header protection on/off
5. **Save Result**: Click "Save Image" to download corrupted frame

### Character Replacement Examples
- **Simple ASCII**: 'a' → 'b'
- **Numbers**: '0' → '1'  
- **Unicode**: 'あ' → 'い'
- **Symbols**: '!' → '@'

### Advanced Features
- **Multi-byte Characters**: Full UTF-8 support for international characters
- **Hex Preview**: Real-time display of character byte values
- **Deterministic Mode**: Same inputs always produce identical results
- **Performance Throttling**: Automatic processing optimization

## 🧪 Testing

The project includes a comprehensive test suite with 56 automated tests:

```bash
# Run tests locally
open tests/test-runner.html
```

### Test Coverage
- **Unit Tests**: All core functions and methods
- **Integration Tests**: End-to-end user workflows
- **Error Handling**: Edge cases and error conditions
- **Browser Compatibility**: Modern browser API support
- **Performance Tests**: Large image data handling

## 🔧 Technical Requirements

### Browser Support
- **Chrome 88+** (recommended)
- **Firefox 84+**
- **Safari 14+**
- **Edge 88+**

### Required APIs
- **MediaDevices.getUserMedia()**: Camera access
- **Canvas API**: Image processing
- **ES6 Modules**: Module loading
- **Blob API**: Image format conversion
- **TextEncoder/TextDecoder**: UTF-8 character handling

### Security Requirements
- **HTTPS**: Required for camera access in production
- **Camera Permissions**: User must grant camera access
- **Modern Browser**: ES6 features required

## 📁 Project Structure

```
glitchcam/
├── index.html              # Main application interface
├── css/
│   └── style.css          # Dark theme styling
├── js/
│   ├── main.js            # Application orchestration
│   ├── glitch.js          # Corruption engine
│   ├── camera.js          # Camera controller
│   └── ui.js              # UI controller
├── tests/
│   ├── test-runner.html   # Custom test framework
│   ├── *.test.js         # Test suites (4 files)
│   └── README.md         # Test documentation
├── README.md              # This file
├── CLAUDE.md              # Development guidelines
├── DESIGN.md              # Architecture documentation
└── LICENSE                # MIT License
```

## 🎨 Design System

### Color Palette
- **Background**: `#0a0a0a` (primary), `#1a1a1a` (panels)
- **Accents**: `#ff00ff` (magenta), `#00ffff` (cyan)
- **Text**: `#ffffff` (primary), `#888888` (secondary)
- **Status**: `#00ff00` (success), `#ff0000` (error)

### Typography
- **Primary Font**: System font stack
- **Monospace**: For hex displays and technical output
- **Icon Font**: Unicode symbols for controls

## 🐛 Troubleshooting

### Common Issues
1. **Camera not starting**: Ensure HTTPS and camera permissions
2. **No corruption visible**: Check character replacement settings
3. **Performance issues**: Reduce camera resolution or processing frequency
4. **Mobile compatibility**: Use touch-friendly browsers

### Error Messages
The application provides detailed error messages in Japanese for camera-related issues:
- カメラへのアクセスが拒否されました (Access denied)
- カメラが見つかりません (Camera not found)
- カメラが他のアプリケーションで使用されています (Camera in use)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass (56/56)
5. Submit a pull request

### Development Commands
```bash
# Run local server
python -m http.server 8000

# Run tests
open tests/test-runner.html

# Validate code
# (No build tools required - static files only)
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with vanilla JavaScript and modern web APIs. No external dependencies for maximum security and performance.