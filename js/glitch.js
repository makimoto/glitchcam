export class GlitchEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        this.isActive = false;
        // Default character strings and their byte representations
        this.sourceChars = 'a';
        this.destChars = 'b';
        this.sourceBytes = new TextEncoder().encode(this.sourceChars);
        this.destBytes = new TextEncoder().encode(this.destChars);
        this.corruptionMode = 'jpeg'; // Default to JPEG stream corruption
        this.headerProtection = true; // Default to protect headers
    }
    
    async applyEffect(imageData) {
        // Always process through JPEG/PNG stream, corruption controlled by isActive
        
        switch (this.corruptionMode) {
            case 'jpeg':
                return await this.corruptImageStream(imageData, 'jpeg');
            case 'png':
                return await this.corruptImageStream(imageData, 'png');
            case 'webp':
                return await this.corruptImageStream(imageData, 'webp');
            case 'bmp':
                return await this.corruptImageStream(imageData, 'bmp');
            default:
                throw new Error(`Unknown corruption mode: ${this.corruptionMode}`);
        }
    }
    
    corruptRawPixels(imageData) {
        // Work directly on the pixel data array
        const data = imageData.data;
        this.corruptByteReplace(data, this.sourceByte, this.destByte);
        return imageData;
    }
    
    corruptImageStream(imageData, format) {
        // Convert canvas to image format, corrupt the binary data, then reconstruct
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to image format
        let mimeType, quality;
        switch (format) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                quality = 0.95;
                break;
            case 'png':
                mimeType = 'image/png';
                quality = undefined;
                break;
            case 'webp':
                mimeType = 'image/webp';
                quality = 0.95;
                break;
            case 'bmp':
                mimeType = 'image/bmp';
                quality = undefined;
                break;
            default:
                throw new Error(`Unsupported image format: ${format}`);
        }
        
        let dataURL = canvas.toDataURL(mimeType, quality);
        
        // Check if BMP is supported, throw error if not
        if (format === 'bmp' && dataURL.startsWith('data:image/png')) {
            throw new Error('BMP format not supported by this browser');
        }
        
        // Extract base64 data and convert to byte array
        const base64Data = dataURL.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        
        // Apply corruption only if glitch is active
        let changedBytes = 0;
        if (this.isActive) {
            // Different formats need different header protection levels
            let skipBytes = 0; // Default: no protection
            
            if (this.headerProtection) {
                switch (format) {
                    case 'jpeg':
                        skipBytes = 50;  // JPEG is more resilient
                        break;
                    case 'png':
                        skipBytes = 200; // PNG has strict validation
                        break;
                    case 'webp':
                        skipBytes = 100; // WebP needs moderate protection
                        break;
                    case 'bmp':
                        skipBytes = 30;  // BMP has simple header structure
                        break;
                    default:
                        throw new Error(`Unknown format for header protection: ${format}`);
                }
            }
            const beforeCorruption = bytes.slice(); // Copy for comparison
            
            // Apply only the specific character replacement - no additional effects
            this.corruptImageBytes(bytes, skipBytes);
            
            // Check if any corruption actually happened
            for (let i = 0; i < bytes.length; i++) {
                if (bytes[i] !== beforeCorruption[i]) changedBytes++;
            }
        }
        
        // Convert back to data URL
        let corruptedBinaryString = '';
        for (let i = 0; i < bytes.length; i++) {
            corruptedBinaryString += String.fromCharCode(bytes[i]);
        }
        const corruptedBase64 = btoa(corruptedBinaryString);
        const corruptedDataURL = `data:${mimeType};base64,${corruptedBase64}`;
        
        // Always try to use the corrupted binary data directly
        return new Promise((resolve) => {
            
            try {
                // Convert corrupted binary back to ImageData by attempting canvas operations
                const img = new Image();
                let resolved = false;
                
                // Set timeout - if image doesn't load, use raw corrupted bytes
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve(this.useCorruptedBytes(bytes, imageData));
                    }
                }, 50); // Very short timeout to prefer raw bytes
                
                img.onload = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = imageData.width;
                        tempCanvas.height = imageData.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        
                        try {
                            tempCtx.drawImage(img, 0, 0);
                            const corruptedImageData = tempCtx.getImageData(0, 0, imageData.width, imageData.height);
                            resolve(corruptedImageData);
                        } catch (error) {
                            resolve(this.useCorruptedBytes(bytes, imageData));
                        }
                    }
                };
                
                img.onerror = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve(this.useCorruptedBytes(bytes, imageData));
                    }
                };
                
                img.src = corruptedDataURL;
                
            } catch (error) {
                resolve(this.useCorruptedBytes(bytes, imageData));
            }
        });
    }
    
    useCorruptedBytes(corruptedBytes, originalImageData) {
        // Use the actual corrupted binary data to create ImageData
        
        // Create new ImageData with same dimensions
        const result = new ImageData(originalImageData.width, originalImageData.height);
        
        // Map corrupted bytes directly to pixel data
        // This will create true data corruption visualization
        const pixelCount = result.data.length / 4; // RGBA pixels
        
        for (let pixel = 0; pixel < pixelCount; pixel++) {
            const baseIdx = pixel * 4;
            const byteIdx = pixel % corruptedBytes.length;
            
            // Use corrupted bytes as pixel values, cycling through the corrupted data
            const byte1 = corruptedBytes[byteIdx];
            const byte2 = corruptedBytes[(byteIdx + 1) % corruptedBytes.length];
            const byte3 = corruptedBytes[(byteIdx + 2) % corruptedBytes.length];
            
            result.data[baseIdx] = byte1;     // R
            result.data[baseIdx + 1] = byte2; // G
            result.data[baseIdx + 2] = byte3; // B
            result.data[baseIdx + 3] = 255;   // A (always opaque)
        }
        
        return result;
    }
    
    
    
    setActive(active) {
        this.isActive = active;
    }
    
    setReplacementChars(sourceChars, destChars) {
        this.sourceChars = sourceChars;
        this.destChars = destChars;
        this.sourceBytes = new TextEncoder().encode(sourceChars);
        this.destBytes = new TextEncoder().encode(destChars);
        
        console.log(`Updated replacement: "${sourceChars}" → "${destChars}"`);
    }
    
    setReplacementBytes(sourceByte, destByte) {
        // Legacy method for backward compatibility
        this.sourceByte = sourceByte;
        this.destByte = destByte;
    }
    
    setCorruptionMode(mode) {
        this.corruptionMode = mode;
    }
    
    setHeaderProtection(enabled) {
        this.headerProtection = enabled;
    }
    
    corruptImageBytes(bytes, skipBytes = 0) {
        let replacementCount = 0;
        
        // Only replace target byte sequences - no random corruption
        // If source and dest are the same, nothing should change
        if (this.sourceChars !== this.destChars && this.sourceBytes.length > 0 && this.destBytes.length > 0) {
            // Calculate start position based on header protection and format
            let startByte = skipBytes; // Use the skipBytes passed from corruptImageStream
            
            // If header protection is enabled, apply additional conservative measures for strict formats
            if (this.headerProtection) {
                switch (this.corruptionMode) {
                    case 'png':
                        // PNG needs very conservative corruption
                        startByte = Math.max(skipBytes, Math.floor(bytes.length * 0.5));
                        break;
                    case 'webp':
                        // WebP needs moderate protection
                        startByte = Math.max(skipBytes, Math.floor(bytes.length * 0.3));
                        break;
                    case 'bmp':
                        // BMP is uncompressed, corruption is very visible - moderate protection
                        startByte = Math.max(skipBytes, Math.floor(bytes.length * 0.2));
                        break;
                    case 'jpeg':
                        // JPEG can handle more corruption
                        startByte = skipBytes;
                        break;
                    default:
                        throw new Error(`Unknown corruption mode for header protection: ${this.corruptionMode}`);
                }
            }
            
            // Find and replace byte sequences
            for (let i = startByte; i <= bytes.length - this.sourceBytes.length; i++) {
                // Check if current position matches source byte sequence
                let matches = true;
                for (let j = 0; j < this.sourceBytes.length; j++) {
                    if (bytes[i + j] !== this.sourceBytes[j]) {
                        matches = false;
                        break;
                    }
                }
                
                if (matches) {
                    // Replace with destination bytes
                    const replaceLength = Math.min(this.destBytes.length, this.sourceBytes.length);
                    for (let j = 0; j < replaceLength; j++) {
                        bytes[i + j] = this.destBytes[j];
                    }
                    
                    // If destination is shorter, fill remaining with the last dest byte
                    if (this.destBytes.length < this.sourceBytes.length) {
                        const lastDestByte = this.destBytes[this.destBytes.length - 1];
                        for (let j = this.destBytes.length; j < this.sourceBytes.length; j++) {
                            bytes[i + j] = lastDestByte;
                        }
                    }
                    
                    replacementCount++;
                    // Skip ahead to avoid overlapping matches
                    i += this.sourceBytes.length - 1;
                }
            }
        }
        
        if (replacementCount > 0) {
            console.log(`Replaced ${replacementCount} instances: "${this.sourceChars}" → "${this.destChars}"`);
        }
    }
}