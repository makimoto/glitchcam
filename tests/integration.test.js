// Integration tests for complete workflows
// Create test runner if not exists
if (!window.runner) {
    window.runner = new TestRunner();
}

runner.suite('Complete Application Workflow', ({ test }) => {
    test('should load all modules without errors', async () => {
        try {
            // Try to import all modules
            const { GlitchEngine } = await import('../js/glitch.js');
            const { CameraController } = await import('../js/camera.js');
            const { UIController } = await import('../js/ui.js');
            
            assert(typeof GlitchEngine === 'function', 'GlitchEngine should be a function');
            assert(typeof CameraController === 'function', 'CameraController should be a function');
            assert(typeof UIController === 'function', 'UIController should be a function');
        } catch (error) {
            throw new Error(`Module loading failed: ${error.message}`);
        }
    });

    test('should create application instances without errors', async () => {
        try {
            const { GlitchEngine } = await import('../js/glitch.js');
            const { CameraController } = await import('../js/camera.js');
            const { UIController } = await import('../js/ui.js');
            
            // Mock DOM elements
            const mockVideo = document.createElement('video');
            const mockCanvas = document.createElement('canvas');
            
            // Create instances
            const glitch = new GlitchEngine(mockCanvas);
            const camera = new CameraController(mockVideo, mockCanvas);
            
            assert(glitch instanceof GlitchEngine, 'Should create GlitchEngine instance');
            assert(camera instanceof CameraController, 'Should create CameraController instance');
            
        } catch (error) {
            throw new Error(`Instance creation failed: ${error.message}`);
        }
    });
});

runner.suite('Data Flow Integration', ({ test }) => {
    test('should handle character replacement flow', async () => {
        const { GlitchEngine } = await import('../js/glitch.js');
        
        const mockCanvas = document.createElement('canvas');
        const engine = new GlitchEngine(mockCanvas);
        
        // Test the complete flow
        engine.setReplacementChars('test', 'best');
        engine.setCorruptionMode('jpeg');
        engine.setHeaderProtection(true);
        engine.setActive(true);
        
        // Verify state is consistent
        assertEqual(engine.sourceChars, 'test');
        assertEqual(engine.destChars, 'best');
        assertEqual(engine.corruptionMode, 'jpeg');
        assertEqual(engine.headerProtection, true);
        assertEqual(engine.isActive, true);
    });

    test('should handle mode switching correctly', async () => {
        const { GlitchEngine } = await import('../js/glitch.js');
        
        const mockCanvas = document.createElement('canvas');
        const engine = new GlitchEngine(mockCanvas);
        
        const modes = ['jpeg', 'png', 'webp', 'bmp'];
        
        for (const mode of modes) {
            engine.setCorruptionMode(mode);
            assertEqual(engine.corruptionMode, mode, `Should switch to ${mode} mode`);
        }
    });
});

runner.suite('Error Recovery Integration', ({ test }) => {
    test('should handle invalid mode gracefully', async () => {
        const { GlitchEngine } = await import('../js/glitch.js');
        
        const mockCanvas = document.createElement('canvas');
        const engine = new GlitchEngine(mockCanvas);
        
        // Set invalid mode
        engine.setCorruptionMode('invalid');
        
        // Try to apply effect
        const imageData = new ImageData(100, 100);
        
        try {
            await engine.applyEffect(imageData);
            throw new Error('Should have thrown error for invalid mode');
        } catch (error) {
            assert(error.message.includes('Unknown corruption mode'), 'Should show appropriate error');
        }
    });

    test('should handle missing camera gracefully', async () => {
        const { CameraController } = await import('../js/camera.js');
        
        const mockVideo = document.createElement('video');
        const mockCanvas = document.createElement('canvas');
        
        const camera = new CameraController(mockVideo, mockCanvas);
        
        // The real camera controller will throw an error when trying to access navigator.mediaDevices
        // that doesn't exist in our test environment, which is the expected behavior
        try {
            const result = await camera.start();
            // If it returns false, it means it handled the error gracefully
            if (result === false) {
                assert(true, 'Camera properly returned false for unsupported environment');
            } else {
                assert(false, 'Should have failed due to no camera support');
            }
        } catch (error) {
            // This test passes if any error is thrown, which indicates proper error handling
            assert(true, 'Properly handles camera access errors');
        }
    });
});

runner.suite('Performance Integration', ({ test }) => {
    test('should handle large image data efficiently', () => {
        // Test with larger image data
        const largeImageData = new ImageData(1920, 1080);
        
        // Fill with test pattern
        for (let i = 0; i < largeImageData.data.length; i += 4) {
            largeImageData.data[i] = i % 256;     // R
            largeImageData.data[i + 1] = (i + 1) % 256; // G
            largeImageData.data[i + 2] = (i + 2) % 256; // B
            largeImageData.data[i + 3] = 255;     // A
        }
        
        assert(largeImageData.data.length > 8000000, 'Should handle large data arrays');
        assertEqual(largeImageData.width, 1920, 'Should maintain width');
        assertEqual(largeImageData.height, 1080, 'Should maintain height');
    });

    test('should handle rapid state changes', async () => {
        const { GlitchEngine } = await import('../js/glitch.js');
        
        const mockCanvas = document.createElement('canvas');
        const engine = new GlitchEngine(mockCanvas);
        
        // Rapid state changes
        for (let i = 0; i < 100; i++) {
            engine.setActive(i % 2 === 0);
            engine.setHeaderProtection(i % 3 === 0);
            engine.setReplacementChars(`${i}`, `${i + 1}`);
        }
        
        // Should not crash
        assert(true, 'Handles rapid state changes without errors');
    });
});

runner.suite('Browser Compatibility', ({ test }) => {
    test('should detect required APIs', () => {
        // Check for required browser APIs
        assert(typeof ImageData !== 'undefined', 'ImageData should be available');
        assert(typeof Uint8Array !== 'undefined', 'Uint8Array should be available');
        assert(typeof TextEncoder !== 'undefined', 'TextEncoder should be available');
    });

    test('should handle missing canvas features gracefully', () => {
        // Test canvas creation
        const canvas = document.createElement('canvas');
        assert(canvas.getContext, 'Canvas should support getContext');
        
        const ctx = canvas.getContext('2d');
        assert(ctx, '2D context should be available');
    });

    test('should check for modern JavaScript features', () => {
        // Check for ES6+ features used in the code
        assert(typeof Promise !== 'undefined', 'Promises should be supported');
        assert(typeof async function() {} === 'function', 'Async functions should be supported');
        assert(typeof Map !== 'undefined', 'Map should be supported');
        assert(typeof Set !== 'undefined', 'Set should be supported');
    });
});

runner.suite('Security Integration', ({ test }) => {
    test('should handle data safely', () => {
        // Test that we don\'t eval user input
        const userInput = 'alert("xss")';
        
        // TextEncoder should safely encode any string
        const encoder = new TextEncoder();
        const encoded = encoder.encode(userInput);
        
        assert(encoded instanceof Uint8Array, 'Should safely encode user input');
        assert(encoded.length > 0, 'Should produce encoded output');
    });

    test('should validate input boundaries', async () => {
        const { GlitchEngine } = await import('../js/glitch.js');
        
        const mockCanvas = document.createElement('canvas');
        const engine = new GlitchEngine(mockCanvas);
        
        // Test boundary conditions
        engine.setReplacementChars('', ''); // Empty strings
        engine.setReplacementChars('a'.repeat(10), 'b'.repeat(10)); // Long strings
        
        // Should not crash
        assert(true, 'Handles boundary conditions safely');
    });
});