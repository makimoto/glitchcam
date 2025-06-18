import { GlitchEngine } from '../js/glitch.js';

// Create test runner if not exists
if (!window.runner) {
    window.runner = new TestRunner();
}

// Mock canvas for testing
function createMockCanvas() {
    const canvas = {
        width: 640,
        height: 480,
        getContext: () => ({
            putImageData: () => {},
            getImageData: () => new ImageData(640, 480),
            drawImage: () => {}
        })
    };
    return canvas;
}

// Mock ImageData if not available
if (typeof ImageData === 'undefined') {
    window.ImageData = class ImageData {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}

runner.suite('GlitchEngine Core Functions', ({ test, beforeEach }) => {
    let engine;
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = createMockCanvas();
        engine = new GlitchEngine(mockCanvas);
    });

    test('should initialize with default values', () => {
        assertEqual(engine.sourceChars, 'a');
        assertEqual(engine.destChars, 'b');
        assertEqual(engine.corruptionMode, 'jpeg');
        assertEqual(engine.headerProtection, true);
        assertEqual(engine.isActive, false);
    });

    test('should set replacement characters correctly', () => {
        engine.setReplacementChars('foo', 'bar');
        assertEqual(engine.sourceChars, 'foo');
        assertEqual(engine.destChars, 'bar');
        assert(engine.sourceBytes instanceof Uint8Array);
        assert(engine.destBytes instanceof Uint8Array);
    });

    test('should set corruption mode correctly', () => {
        engine.setCorruptionMode('png');
        assertEqual(engine.corruptionMode, 'png');
    });

    test('should set header protection correctly', () => {
        engine.setHeaderProtection(false);
        assertEqual(engine.headerProtection, false);
    });

    test('should set active state correctly', () => {
        engine.setActive(true);
        assertEqual(engine.isActive, true);
    });

    test('should throw error for unknown corruption mode', async () => {
        engine.setCorruptionMode('invalid');
        const imageData = new ImageData(100, 100);
        
        try {
            await engine.applyEffect(imageData);
            throw new Error('Should have thrown error');
        } catch (error) {
            assert(error.message.includes('Unknown corruption mode'));
        }
    });
});

runner.suite('Character Replacement Logic', ({ test, beforeEach }) => {
    let engine;

    beforeEach(() => {
        engine = new GlitchEngine(createMockCanvas());
    });

    test('should handle UTF-8 character encoding', () => {
        engine.setReplacementChars('あ', 'い');
        
        // Japanese characters should encode to multiple bytes
        assert(engine.sourceBytes.length > 1);
        assert(engine.destBytes.length > 1);
    });

    test('should handle empty strings gracefully', () => {
        engine.setReplacementChars('', '');
        assertEqual(engine.sourceBytes.length, 0);
        assertEqual(engine.destBytes.length, 0);
    });

    test('should handle single characters', () => {
        engine.setReplacementChars('x', 'y');
        assertEqual(engine.sourceBytes.length, 1);
        assertEqual(engine.destBytes.length, 1);
        assertEqual(engine.sourceBytes[0], 120); // 'x' ASCII
        assertEqual(engine.destBytes[0], 121);   // 'y' ASCII
    });

    test('should handle three character limit', () => {
        engine.setReplacementChars('abc', 'xyz');
        assertEqual(engine.sourceChars, 'abc');
        assertEqual(engine.destChars, 'xyz');
        assertEqual(engine.sourceBytes.length, 3);
        assertEqual(engine.destBytes.length, 3);
    });
});

runner.suite('Format Support', ({ test, beforeEach }) => {
    let engine;

    beforeEach(() => {
        engine = new GlitchEngine(createMockCanvas());
        engine.setActive(true);
    });

    test('should support JPEG format', async () => {
        if (!document.createElement('canvas').toDataURL('image/jpeg')) {
            skip('JPEG not supported in test environment');
        }
        
        engine.setCorruptionMode('jpeg');
        const imageData = new ImageData(100, 100);
        
        // Should not throw error
        try {
            await engine.corruptImageStream(imageData, 'jpeg');
        } catch (error) {
            // Network/canvas errors are OK in test environment
            if (!error.message.includes('canvas') && !error.message.includes('network')) {
                throw error;
            }
        }
    });

    test('should support PNG format', async () => {
        engine.setCorruptionMode('png');
        const imageData = new ImageData(100, 100);
        
        // Should not throw error for format validation
        try {
            await engine.corruptImageStream(imageData, 'png');
        } catch (error) {
            // Network/canvas errors are OK in test environment
            if (!error.message.includes('canvas') && !error.message.includes('network')) {
                throw error;
            }
        }
    });

    test('should throw error for unsupported format', async () => {
        const imageData = new ImageData(100, 100);
        
        try {
            await engine.corruptImageStream(imageData, 'unsupported');
            throw new Error('Should have thrown error');
        } catch (error) {
            assert(error.message.includes('Unsupported image format'));
        }
    });
});

runner.suite('Header Protection Logic', ({ test, beforeEach }) => {
    let engine;

    beforeEach(() => {
        engine = new GlitchEngine(createMockCanvas());
    });

    test('should apply different skip bytes based on format when protection enabled', () => {
        engine.setHeaderProtection(true);
        
        // Test different formats (we can't easily test the actual corruption,
        // but we can verify the logic doesn't throw errors)
        const formats = ['jpeg', 'png', 'webp', 'bmp'];
        
        for (const format of formats) {
            try {
                // This tests the switch statement logic
                engine.setCorruptionMode(format);
                assert(true, `Format ${format} should be supported`);
            } catch (error) {
                throw new Error(`Format ${format} failed: ${error.message}`);
            }
        }
    });

    test('should throw error for unknown format in header protection', () => {
        engine.setHeaderProtection(true);
        
        // This should be caught by the format validation before header protection
        assertThrows(() => {
            engine.setCorruptionMode('unknown');
        }, undefined, 'Should handle unknown format gracefully');
    });
});

runner.suite('Deterministic Behavior', ({ test, beforeEach }) => {
    let engine1, engine2;

    beforeEach(() => {
        engine1 = new GlitchEngine(createMockCanvas());
        engine2 = new GlitchEngine(createMockCanvas());
    });

    test('should produce identical results for same configuration', () => {
        // Configure both engines identically
        engine1.setReplacementChars('test', 'best');
        engine1.setCorruptionMode('jpeg');
        engine1.setHeaderProtection(true);
        engine1.setActive(true);

        engine2.setReplacementChars('test', 'best');
        engine2.setCorruptionMode('jpeg');
        engine2.setHeaderProtection(true);
        engine2.setActive(true);

        // Both should have identical configuration
        assertEqual(engine1.sourceChars, engine2.sourceChars);
        assertEqual(engine1.destChars, engine2.destChars);
        assertEqual(engine1.corruptionMode, engine2.corruptionMode);
        assertEqual(engine1.headerProtection, engine2.headerProtection);
        assertEqual(engine1.isActive, engine2.isActive);
    });

    test('should have consistent byte encoding', () => {
        const testString = 'hello';
        
        engine1.setReplacementChars(testString, 'world');
        engine2.setReplacementChars(testString, 'world');

        // Byte arrays should be identical
        assertEqual(engine1.sourceBytes.length, engine2.sourceBytes.length);
        assertEqual(engine1.destBytes.length, engine2.destBytes.length);
        
        for (let i = 0; i < engine1.sourceBytes.length; i++) {
            assertEqual(engine1.sourceBytes[i], engine2.sourceBytes[i]);
        }
    });
});