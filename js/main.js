import { CameraController } from './camera.js';
import { GlitchEngine } from './glitch.js';
import { UIController } from './ui.js';

class GlitchCameraApp {
    constructor() {
        this.initializeElements();
        this.initializeModules();
        this.setupGlitchLoop();
        this.isProcessing = false; // Prevent concurrent processing
        this.lastGlitchResult = null; // Store last glitch result
        this.lastProcessTime = 0; // Throttle processing
        this.glitchInterval = 500; // Process every 500ms for JPEG/PNG modes
    }
    
    initializeElements() {
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('glitch-canvas');
    }
    
    initializeModules() {
        this.camera = new CameraController(this.video, this.canvas);
        this.glitch = new GlitchEngine(this.canvas);
        this.ui = new UIController(this.glitch, this.camera);
    }
    
    setupGlitchLoop() {
        const processFrame = () => {
            try {
                if (this.camera.isRunning()) {
                    // Check if video is ready and has dimensions
                    if (this.camera.video.videoWidth > 0 && this.camera.video.videoHeight > 0) {
                        
                        // Always process through JPEG/PNG corruption - never show raw camera input
                        const now = Date.now();
                        const shouldProcess = now - this.lastProcessTime > this.glitchInterval;
                        
                        if (!this.isProcessing && shouldProcess) {
                            this.lastProcessTime = now;
                            
                            // Create a temporary canvas for processing - don't draw to main canvas yet
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = this.camera.canvas.width;
                            tempCanvas.height = this.camera.canvas.height;
                            const tempCtx = tempCanvas.getContext('2d');
                            
                            // Draw video to temporary canvas
                            tempCtx.drawImage(this.camera.video, 0, 0, tempCanvas.width, tempCanvas.height);
                            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                            
                            if (imageData) {
                                this.isProcessing = true;
                                // Always apply JPEG/PNG processing, even if glitch toggle is off
                                this.glitch.applyEffect(imageData).then(processedData => {
                                    if (processedData && processedData.data) {
                                        this.lastGlitchResult = processedData;
                                        this.camera.putFrame(processedData);
                                    }
                                    this.isProcessing = false;
                                }).catch(error => {
                                    console.error('JPEG/PNG processing error:', error);
                                    this.isProcessing = false;
                                });
                            }
                        } else if (this.lastGlitchResult) {
                            // Keep showing the last processed result while waiting
                            this.camera.putFrame(this.lastGlitchResult);
                        } else {
                            // No previous result, show black screen
                            const blackImageData = new ImageData(this.camera.canvas.width, this.camera.canvas.height);
                            this.camera.putFrame(blackImageData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in glitch processing:', error);
            }
            requestAnimationFrame(processFrame);
        };
        
        requestAnimationFrame(processFrame);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GlitchCameraApp();
});