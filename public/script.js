class PDFJPGConverter {
    constructor() {
        this.currentMode = 'pdf2jpg';
        this.selectedFiles = [];
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.convertBtn = document.getElementById('convertBtn');
        this.converterForm = document.getElementById('converterForm');
        this.modeInput = document.getElementById('mode');
        this.uploadTitle = document.getElementById('uploadTitle');
        this.uploadDesc = document.getElementById('uploadDesc');
    }

    bindEvents() {
        // Mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Form submission
        this.converterForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.selectedFiles = [];
        this.modeInput.value = mode;

        // Update active button
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        this.updateUI();
        this.renderFileList();
    }

    updateUI() {
        const isPdf2Jpg = this.currentMode === 'pdf2jpg';
        
        this.uploadTitle.textContent = isPdf2Jpg ? 'Carica un file PDF' : 'Carica immagini JPG';
        this.uploadDesc.textContent = isPdf2Jpg 
            ? 'Trascina qui il tuo file PDF o clicca per selezionarlo'
            : 'Trascina qui le tue immagini o clicca per selezionarle';
        
        this.fileInput.accept = isPdf2Jpg ? '.pdf' : '.jpg,.jpeg';
        this.fileInput.multiple = !isPdf2Jpg;

        this.updateConvertButton();
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const isPdf2Jpg = this.currentMode === 'pdf2jpg';
        
        if (isPdf2Jpg) {
            // For PDF to JPG, only allow one PDF file
            const pdfFiles = files.filter(file => file.type === 'application/pdf');
            if (pdfFiles.length > 0) {
                this.selectedFiles = [pdfFiles[0]];
            }
        } else {
            // For JPG to PDF, allow multiple image files
            const imageFiles = files.filter(file => 
                file.type === 'image/jpeg' || file.type === 'image/jpg'
            );
            this.selectedFiles = [...this.selectedFiles, ...imageFiles];
        }

        this.renderFileList();
        this.updateConvertButton();
    }

    renderFileList() {
        if (this.selectedFiles.length === 0) {
            this.fileList.innerHTML = '';
            return;
        }

        const filesHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">${file.type === 'application/pdf' ? '📄' : '🖼️'}</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button type="button" class="remove-file" onclick="converter.removeFile(${index})">
                    ×
                </button>
            </div>
        `).join('');

        this.fileList.innerHTML = filesHTML;
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFileList();
        this.updateConvertButton();
    }

    updateConvertButton() {
        const hasFiles = this.selectedFiles.length > 0;
        this.convertBtn.disabled = !hasFiles;
        
        if (hasFiles) {
            const fileCount = this.selectedFiles.length;
            const isPdf2Jpg = this.currentMode === 'pdf2jpg';
            this.convertBtn.querySelector('.btn-text').textContent = 
                isPdf2Jpg ? 'Converti PDF in JPG' : `Converti ${fileCount} immagini in PDF`;
        } else {
            this.convertBtn.querySelector('.btn-text').textContent = 'Seleziona file per iniziare';
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.selectedFiles.length === 0) return;

        this.setLoading(true);

        try {
            const formData = new FormData();
            formData.append('mode', this.currentMode);
            
            this.selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Errore del server: ${response.status}`);
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentMode === 'pdf2jpg' ? 'converted_images.zip' : 'converted.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Reset form
            this.selectedFiles = [];
            this.renderFileList();
            this.updateConvertButton();
            this.fileInput.value = '';

            this.showSuccess('Conversione completata con successo!');

        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Errore durante la conversione. Riprova.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.convertBtn.classList.toggle('loading', loading);
        this.convertBtn.disabled = loading;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the converter when the page loads
const converter = new PDFJPGConverter();