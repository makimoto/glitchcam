export class UIController {
    constructor(glitchEngine, cameraController) {
        this.glitchEngine = glitchEngine;
        this.cameraController = cameraController;
        this.initializeControls();
        this.bindEvents();
    }
    
    initializeControls() {
        this.elements = {
            cameraToggle: document.getElementById('camera-toggle'),
            glitchToggle: document.getElementById('glitch-toggle'),
            headerProtection: document.getElementById('header-protection'),
            modeButtons: document.querySelectorAll('.btn-mode'),
            sourceChars: document.getElementById('source-chars'),
            destChars: document.getElementById('dest-chars'),
            saveImage: document.getElementById('save-image'),
            errorMessage: document.getElementById('error-message'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.querySelector('.status-text'),
            canvas: document.getElementById('glitch-canvas')
        };
    }
    
    bindEvents() {
        this.elements.cameraToggle.addEventListener('click', () => this.toggleCamera());
        this.elements.glitchToggle.addEventListener('change', () => this.toggleGlitch());
        this.elements.headerProtection.addEventListener('change', () => this.toggleHeaderProtection());
        this.elements.sourceChars.addEventListener('input', (e) => this.updateReplacement());
        this.elements.destChars.addEventListener('input', (e) => this.updateReplacement());
        this.elements.saveImage.addEventListener('click', () => this.saveImage());
        
        // Mode buttons
        this.elements.modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.elements.modeButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const mode = e.target.dataset.mode;
                this.glitchEngine.setCorruptionMode(mode);
                
                // Analytics
                this.trackEvent('corruption_mode', 'change', mode);
            });
        });
        
        // Initialize character hints, header protection, and glitch state
        this.updateCharHints();
        this.toggleHeaderProtection();
        this.toggleGlitch(); // Initialize glitch state based on checkbox
    }
    
    updateReplacement() {
        const sourceChars = this.elements.sourceChars.value || 'a';
        const destChars = this.elements.destChars.value || 'b';
        
        // Convert characters to UTF-8 byte arrays
        const sourceBytes = this.stringToBytes(sourceChars);
        const destBytes = this.stringToBytes(destChars);
        
        // Update character hints
        this.updateCharHints();
        
        // Update the glitch engine with new character strings
        this.glitchEngine.setReplacementChars(sourceChars, destChars);
    }
    
    stringToBytes(str) {
        // Convert string to UTF-8 bytes
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }
    
    updateCharHints() {
        const sourceChars = this.elements.sourceChars.value || 'a';
        const destChars = this.elements.destChars.value || 'b';
        
        const sourceHint = document.querySelector('#source-chars + .char-hint');
        const destHint = document.querySelector('#dest-chars + .char-hint');
        
        if (sourceHint) {
            const sourceBytes = this.stringToBytes(sourceChars);
            const byteHex = Array.from(sourceBytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            sourceHint.textContent = `${sourceBytes.length} bytes: [${byteHex}]`;
        }
        if (destHint) {
            const destBytes = this.stringToBytes(destChars);
            const byteHex = Array.from(destBytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            destHint.textContent = `${destBytes.length} bytes: [${byteHex}]`;
        }
    }
    
    getASCIIDisplay(byteValue) {
        // Handle special cases for better readability
        if (byteValue < 32) {
            // Control characters
            const controlNames = {
                0: 'NUL', 8: 'BS', 9: 'TAB', 10: 'LF', 13: 'CR', 27: 'ESC'
            };
            return controlNames[byteValue] || `^${String.fromCharCode(64 + byteValue)}`;
        } else if (byteValue === 32) {
            return 'SPC'; // Space
        } else if (byteValue === 127) {
            return 'DEL'; // Delete
        } else if (byteValue > 127) {
            return '•'; // Extended ASCII - show bullet
        } else {
            return String.fromCharCode(byteValue); // Regular printable ASCII
        }
    }
    
    async toggleCamera() {
        const button = this.elements.cameraToggle;
        const btnText = button.querySelector('.btn-text');
        const btnIcon = button.querySelector('.btn-icon');
        
        if (this.cameraController.isRunning()) {
            this.cameraController.stop();
            btnText.textContent = 'START CAMERA';
            btnIcon.textContent = '▶';
            this.updateStatus('Ready', false);
            
            // Analytics
            this.trackEvent('camera', 'stop');
            // Don't reset glitch state when stopping camera
        } else {
            try {
                const started = await this.cameraController.start();
                if (started) {
                    btnText.textContent = 'STOP CAMERA';
                    btnIcon.textContent = '■';
                    this.updateStatus('Camera Active', true);
                    this.hideError();
                    
                    // Analytics
                    this.trackEvent('camera', 'start');
                }
            } catch (error) {
                this.showError(error.message);
                // Analytics
                this.trackEvent('camera', 'error', error.message);
            }
        }
    }
    
    toggleGlitch() {
        const isActive = this.elements.glitchToggle.checked;
        this.glitchEngine.setActive(isActive);
        
        // Analytics
        this.trackEvent('glitch', isActive ? 'enable' : 'disable');
    }
    
    toggleHeaderProtection() {
        const isProtected = this.elements.headerProtection.checked;
        this.glitchEngine.setHeaderProtection(isProtected);
        console.log(`Header protection: ${isProtected ? 'ON' : 'OFF'}`);
    }
    
    saveImage() {
        if (!this.cameraController.isRunning()) {
            this.showError('カメラを起動してください。');
            return;
        }
        
        const sourceChars = this.elements.sourceChars.value || 'a';
        const destChars = this.elements.destChars.value || 'b';
        const mode = document.querySelector('.btn-mode.active')?.dataset.mode || 'jpeg';
        
        this.elements.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `glitch_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Analytics
            this.trackEvent('image', 'save', mode, {
                source_chars: sourceChars,
                dest_chars: destChars,
                corruption_mode: mode
            });
        });
    }
    
    
    updateStatus(text, active) {
        this.elements.statusText.textContent = text;
        if (active) {
            this.elements.statusIndicator.classList.add('active');
        } else {
            this.elements.statusIndicator.classList.remove('active');
        }
    }
    
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('show');
    }
    
    hideError() {
        this.elements.errorMessage.classList.remove('show');
    }
    
    // Analytics helper function
    trackEvent(category, action, label = null, customParameters = {}) {
        if (typeof gtag !== 'undefined') {
            const eventData = {
                event_category: category,
                event_label: label
            };
            
            // Add custom parameters
            Object.assign(eventData, customParameters);
            
            gtag('event', action, eventData);
        }
    }
}