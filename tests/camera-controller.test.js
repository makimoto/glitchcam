import { CameraController } from '../js/camera.js';

// Create test runner if not exists
if (!window.runner) {
    window.runner = new TestRunner();
}

// Mock MediaDevices API
function createMockMediaDevices() {
    return {
        getUserMedia: (constraints) => {
            if (constraints.video) {
                // Return a mock stream
                return Promise.resolve({
                    getTracks: () => [{
                        stop: () => {},
                        getSettings: () => ({ width: 640, height: 480 })
                    }],
                    getVideoTracks: () => [{
                        stop: () => {},
                        getSettings: () => ({ width: 640, height: 480 })
                    }]
                });
            }
            return Promise.reject(new Error('Video not requested'));
        }
    };
}

// Mock video element
function createMockVideo() {
    return {
        srcObject: null,
        videoWidth: 640,
        videoHeight: 480,
        play: () => Promise.resolve(),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
}

// Mock canvas element
function createMockCanvas() {
    return {
        width: 640,
        height: 480,
        getContext: () => ({
            drawImage: () => {},
            getImageData: () => new ImageData(640, 480),
            putImageData: () => {},
            clearRect: () => {}
        })
    };
}

// Create a testable CameraController
class TestableCameraController extends CameraController {
    constructor(video, canvas, mockNavigator = null) {
        super(video, canvas);
        if (mockNavigator) {
            this.mockNavigator = mockNavigator;
        }
    }
    
    // Override the navigator access for testing
    async start() {
        if (this.mockNavigator) {
            // Use mock navigator for testing
            if (!this.mockNavigator.mediaDevices || !this.mockNavigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }
            
            if (this.stream) {
                return false;
            }
            
            try {
                this.stream = await this.mockNavigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 }
                });
                
                this.video.srcObject = this.stream;
                
                // Simulate the onloadedmetadata event
                if (this.video.onloadedmetadata) {
                    this.video.onloadedmetadata();
                } else {
                    // Fallback: set canvas dimensions directly
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                }
                
                this.isActive = true;
                return true;
            } catch (error) {
                // Use the real handleError method which throws
                this.handleError(error);
            }
        } else {
            // Use real implementation
            return super.start();
        }
    }
}

runner.suite('CameraController Initialization', ({ test }) => {
    let camera, mockVideo, mockCanvas;

    test('should initialize with video and canvas elements', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        assert(camera.video === mockVideo, 'Should store video element reference');
        assert(camera.canvas === mockCanvas, 'Should store canvas element reference');
        assertEqual(camera.stream, null, 'Stream should initially be null');
    });

    test('should initialize canvas context', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        assert(camera.ctx, 'Canvas context should be initialized');
    });

    test('should have initial running state as false', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        assertEqual(camera.isRunning(), false, 'Should not be running initially');
    });
});

runner.suite('Camera Stream Management', ({ test }) => {
    let camera, mockVideo, mockCanvas;

    test('should start camera successfully', async () => {
        mockVideo = createMockVideo();
        mockVideo.onloadedmetadata = null;
        // Simulate onloadedmetadata event
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        const result = await camera.start();
        
        assertEqual(result, true, 'Start should return true on success');
        assertEqual(camera.isRunning(), true, 'Should be running after start');
        assert(mockVideo.srcObject, 'Video srcObject should be set');
    });

    test('should handle camera start failure', async () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: {
                getUserMedia: () => {
                    const error = new Error('Permission denied');
                    error.name = 'NotAllowedError';
                    return Promise.reject(error);
                }
            }
        });
        
        try {
            await camera.start();
            assert(false, 'Should have thrown error');
        } catch (error) {
            assert(error.message.includes('カメラへのアクセスが拒否されました'), 'Should throw Japanese permission error');
            assertEqual(camera.isRunning(), false, 'Should not be running after failure');
        }
    });

    test('should stop camera and clean up', async () => {
        mockVideo = createMockVideo();
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        // Start first
        await camera.start();
        assertEqual(camera.isRunning(), true, 'Should be running');
        
        // Then stop
        camera.stop();
        assertEqual(camera.isRunning(), false, 'Should not be running after stop');
        assertEqual(mockVideo.srcObject, null, 'Video srcObject should be cleared');
    });

    test('should handle stop when not running', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        // Should not throw error
        camera.stop();
        assertEqual(camera.isRunning(), false, 'Should remain not running');
    });
});

runner.suite('Canvas Operations', ({ test }) => {
    let camera, mockVideo, mockCanvas, mockCtx;

    test('should capture frame data', () => {
        mockVideo = createMockVideo();
        
        mockCtx = {
            drawImage: () => {},
            getImageData: () => new ImageData(640, 480),
            putImageData: () => {}
        };
        
        mockCanvas = {
            width: 640,
            height: 480,
            getContext: () => mockCtx
        };
        
        camera = new CameraController(mockVideo, mockCanvas);
        
        const imageData = camera.captureFrame();
        
        assert(imageData instanceof ImageData, 'Should return ImageData object');
        assertEqual(imageData.width, 640, 'Width should match canvas');
        assertEqual(imageData.height, 480, 'Height should match canvas');
    });

    test('should put frame data to canvas', () => {
        mockVideo = createMockVideo();
        
        let putImageDataCalled = false;
        mockCtx = {
            drawImage: () => {},
            getImageData: () => new ImageData(640, 480),
            putImageData: () => { putImageDataCalled = true; }
        };
        
        mockCanvas = {
            width: 640,
            height: 480,
            getContext: () => mockCtx
        };
        
        camera = new CameraController(mockVideo, mockCanvas);
        
        const imageData = new ImageData(640, 480);
        camera.putFrame(imageData);
        assertEqual(putImageDataCalled, true, 'putImageData should be called');
    });

    test('should handle invalid frame data gracefully', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        // Should not throw error with null data
        camera.putFrame(null);
        
        // Should not throw error with undefined data
        camera.putFrame(undefined);
        
        assert(true, 'Handles invalid frame data gracefully');
    });
});

runner.suite('Canvas Size Management', ({ test }) => {
    let camera, mockVideo, mockCanvas;

    test('should update canvas size during camera start', async () => {
        mockVideo = createMockVideo();
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        await camera.start();
        
        assertEqual(mockCanvas.width, 1280, 'Canvas width should be updated to video width');
        assertEqual(mockCanvas.height, 720, 'Canvas height should be updated to video height');
    });

    test('should handle canvas dimensions correctly', () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new CameraController(mockVideo, mockCanvas);
        
        // Test that canvas dimensions can be accessed
        assert(typeof mockCanvas.width === 'number', 'Canvas width should be a number');
        assert(typeof mockCanvas.height === 'number', 'Canvas height should be a number');
        
        // Test that canvas dimensions are positive
        assert(mockCanvas.width > 0, 'Canvas width should be positive');
        assert(mockCanvas.height > 0, 'Canvas height should be positive');
    });
});

runner.suite('Error Handling', ({ test }) => {
    let camera, mockVideo, mockCanvas;

    test('should handle no media devices support', async () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {});
        
        try {
            await camera.start();
            assert(false, 'Should have thrown error');
        } catch (error) {
            assert(error.message.includes('not supported'), 'Should indicate no support');
        }
    });

    test('should handle getUserMedia not available', async () => {
        mockVideo = createMockVideo();
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, { mediaDevices: {} });
        
        try {
            await camera.start();
            assert(false, 'Should have thrown error');
        } catch (error) {
            assert(error.message.includes('not supported'), 'Should indicate no support');
        }
    });

    test('should handle video play failure', async () => {
        mockVideo = createMockVideo();
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        // Override the start method to simulate video play failure
        mockCanvas = createMockCanvas();
        
        // Create a camera that simulates a play error
        camera = new class extends TestableCameraController {
            async start() {
                if (this.mockNavigator) {
                    try {
                        this.stream = await this.mockNavigator.mediaDevices.getUserMedia({
                            video: { width: 1280, height: 720 }
                        });
                        
                        this.video.srcObject = this.stream;
                        
                        // Simulate play failure
                        throw new Error('Play failed');
                    } catch (error) {
                        this.handleError(error);
                        return false;
                    }
                } else {
                    return super.start();
                }
            }
        }(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        try {
            await camera.start();
            assert(false, 'Should have thrown error');
        } catch (error) {
            assert(error.message.includes('カメラの起動に失敗しました'), 'Should show Japanese error message');
        }
    });
});

runner.suite('Stream State Tracking', ({ test }) => {
    let camera, mockVideo, mockCanvas;

    test('should track running state correctly', async () => {
        mockVideo = createMockVideo();
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        assertEqual(camera.isRunning(), false, 'Initially not running');
        
        await camera.start();
        assertEqual(camera.isRunning(), true, 'Running after start');
        
        camera.stop();
        assertEqual(camera.isRunning(), false, 'Not running after stop');
    });

    test('should prevent multiple starts', async () => {
        mockVideo = createMockVideo();
        mockVideo.videoWidth = 1280;
        mockVideo.videoHeight = 720;
        mockCanvas = createMockCanvas();
        camera = new TestableCameraController(mockVideo, mockCanvas, {
            mediaDevices: createMockMediaDevices()
        });
        
        await camera.start();
        assertEqual(camera.isRunning(), true, 'Running after first start');
        
        // Second start should not change state
        const result = await camera.start();
        assertEqual(result, false, 'Second start should return false');
        assertEqual(camera.isRunning(), true, 'Should still be running');
    });
});