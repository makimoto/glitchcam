export class CameraController {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        this.stream = null;
        this.isActive = false;
        this.animationId = null;
    }
    
    async start() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });
            
            this.isActive = true;
            
            return true;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }
    
    stop() {
        this.isActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render() {
        if (!this.isActive) return;
        
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    captureFrame() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData;
    }
    
    putFrame(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    handleError(error) {
        let message = 'カメラの起動に失敗しました。';
        
        if (error.name === 'NotAllowedError') {
            message = 'カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。';
        } else if (error.name === 'NotFoundError') {
            message = 'カメラが見つかりません。デバイスが接続されているか確認してください。';
        } else if (error.name === 'NotReadableError') {
            message = 'カメラが他のアプリケーションで使用されています。';
        } else if (error.name === 'OverconstrainedError') {
            message = 'カメラが要求された設定をサポートしていません。';
        }
        
        throw new Error(message);
    }
    
    isRunning() {
        return this.isActive;
    }
}