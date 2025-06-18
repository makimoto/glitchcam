# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glitch Camera is a web application that captures real-time video from webcam and applies **image format corruption effects** through deterministic character replacement. Instead of traditional visual filters, it corrupts actual JPEG/PNG/WebP/BMP data streams to create authentic digital artifacts.

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Image Processing**: Canvas API, Blob API, TextEncoder/TextDecoder
- **Camera Access**: MediaDevices.getUserMedia() WebRTC API
- **Testing**: Custom test framework with 56 automated tests (100% pass rate)
- **Deployment**: GitHub Pages (HTTPS required for camera access)
- **No build tools**: Static files only, no bundlers or transpilers

## Architecture

The application follows a modular design with four main components:

1. **GlitchCameraApp** (`js/main.js`): Application orchestration, render loop, and processing throttling
2. **CameraController** (`js/camera.js`): WebRTC camera access and canvas operations with Japanese error handling
3. **GlitchEngine** (`js/glitch.js`): Image format corruption through UTF-8 character replacement with header protection
4. **UIController** (`js/ui.js`): UI controls, UTF-8 input handling, and real-time character hints

## Core Features Implemented

### Image Format Corruption
- **Character Replacement**: UTF-8 string replacement in image byte streams ('a' → 'b')
- **4 Format Modes**: JPEG (50-byte header), PNG (200-byte), WebP (100-byte), BMP (30-byte)
- **Header Protection**: Preserves format-critical bytes to maintain basic readability
- **Deterministic Behavior**: Same input always produces identical output (no randomness)

### Camera Integration
- **Real-time Processing**: Live corruption at 500ms intervals with frame caching
- **Canvas Optimization**: Context configured with `willReadFrequently: true`
- **Resolution Handling**: Target 1280x720, adapts to device capabilities
- **Error Recovery**: Comprehensive Japanese error messages for camera issues

### User Interface
- **UTF-8 Character Input**: Supports international characters with 3-character limit
- **Real-time Hex Display**: Shows byte values of input characters
- **Format Mode Selection**: Toggle between JPEG/PNG/WebP/BMP corruption
- **Dark Theme**: Magenta/cyan accents on dark background

## Project Structure

```
glitchcam/
├── index.html              # Main application interface
├── css/
│   └── style.css          # Dark theme styling with responsive design
├── js/
│   ├── main.js            # GlitchCameraApp - application orchestration
│   ├── camera.js          # CameraController - WebRTC and canvas operations
│   ├── glitch.js          # GlitchEngine - image format corruption
│   └── ui.js              # UIController - interface and event handling
├── tests/
│   ├── test-runner.html   # Custom test framework with dark theme
│   ├── glitch-engine.test.js      # GlitchEngine unit tests
│   ├── camera-controller.test.js  # CameraController unit tests
│   ├── ui-controller.test.js      # UIController unit tests
│   ├── integration.test.js        # End-to-end integration tests
│   └── README.md          # Test documentation and framework details
├── README.md              # Project overview and usage guide
├── DESIGN.md              # Detailed architecture documentation
├── CLAUDE.md              # This file - development guidelines
├── LICENSE                # MIT License
└── .gitignore             # Excludes development files
```

## Development Commands

Since this is a static site with comprehensive testing:

```bash
# Serve locally for development (HTTPS required for camera)
python -m http.server 8000
# or for HTTPS (required for camera access)
npx serve --ssl

# Run comprehensive test suite (56 tests)
open tests/test-runner.html

# Deploy to GitHub Pages
git push origin main  # Assuming GitHub Pages is set to main branch
```

## Key Technical Details

### Character Replacement Algorithm
```javascript
// GlitchEngine.corruptImageBytes()
for (let i = skipBytes; i < bytes.length - sourceBytes.length + 1; i++) {
    if (this.bytesMatch(bytes, i, sourceBytes)) {
        bytes.set(destBytes, i);
        i += destBytes.length - 1;
        replacementCount++;
    }
}
```

### Processing Pipeline
1. **Capture**: Get ImageData from camera canvas
2. **Convert**: Transform to target format (JPEG/PNG/WebP/BMP)
3. **Extract**: Get byte array from blob
4. **Corrupt**: Replace characters with header protection
5. **Reconstruct**: Convert corrupted bytes back to ImageData
6. **Display**: Render result to canvas

### Performance Optimizations
- **Frame Throttling**: 500ms intervals to prevent overload
- **Async Processing**: Promise-based corruption pipeline
- **Memory Management**: Proper cleanup of streams and objects
- **Canvas Context**: Optimized for frequent read operations

## Browser Compatibility

### Required APIs
- **MediaDevices.getUserMedia()**: Camera access (HTTPS required)
- **Canvas API**: Image processing and display
- **ES6 Modules**: Dynamic imports and module system
- **Blob API**: Image format conversion
- **TextEncoder/TextDecoder**: UTF-8 character handling

### Supported Browsers
- **Chrome 88+** (recommended)
- **Firefox 84+** 
- **Safari 14+**
- **Edge 88+**

## Testing Framework

### Test Coverage (56/56 passing)
- **GlitchEngine**: Character replacement, format support, header protection, deterministic behavior
- **UIController**: Input validation, UTF-8 handling, ASCII display, state management
- **CameraController**: Stream management, canvas operations, error handling, state tracking
- **Integration**: Complete workflows, data flow, error recovery, performance, security

### Mock Strategy
- **DOM Elements**: Comprehensive mocks with all required properties
- **MediaDevices API**: Simulated camera streams and error conditions
- **Canvas API**: Mock context with complete method implementations
- **Navigator**: Safe mocking without Object.defineProperty conflicts

## Important Implementation Notes

### Security and Privacy
1. **Client-side Only**: No server communication, all processing in browser
2. **No Data Storage**: No persistent storage of camera data
3. **HTTPS Required**: Camera access requires secure context
4. **Input Validation**: Character length limits and format validation

### Error Handling
1. **Japanese Error Messages**: Localized camera error handling
2. **Graceful Degradation**: Handles missing DOM elements and APIs
3. **Memory Safety**: Proper cleanup of streams and objects
4. **Format Validation**: Strict checking of corruption modes

### Performance Considerations
1. **Processing Throttling**: Prevents UI blocking during corruption
2. **Frame Caching**: Maintains last successful result
3. **Efficient Byte Operations**: Optimized character replacement
4. **Canvas Optimization**: Context configured for frequent reads

## CSS Design System

The app uses a carefully crafted dark theme:
- **Background**: #0a0a0a (primary), #1a1a1a (panels)
- **Accents**: #ff00ff (magenta), #00ffff (cyan)
- **Text**: #ffffff (primary), #888888 (secondary)
- **Status**: #00ff00 (success), #ff0000 (error)
- **Responsive Design**: Mobile-first with touch-friendly controls

## Deployment Checklist

1. **File Paths**: All paths are relative for GitHub Pages compatibility
2. **HTTPS**: Required for camera access (GitHub Pages provides this)
3. **Test Coverage**: All 56 tests passing before deployment
4. **Browser Testing**: Verify on major browsers
5. **Mobile Testing**: Ensure touch controls work properly
6. **Performance**: Verify smooth operation on various devices

## Philosophy and Approach

This project embodies a unique philosophy of "accidental" digital corruption:
- **No Random Elements**: Everything is deterministic and reproducible
- **Real Corruption Simulation**: Mimics actual file corruption through character replacement
- **Format Awareness**: Respects image format structures while corrupting data
- **No Fallbacks**: Explicit behavior without implicit error recovery mechanisms

The implementation prioritizes authenticity over convenience, creating genuine digital artifacts rather than simulated visual effects.