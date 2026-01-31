// Main Application Controller
class DriperApp {
    constructor() {
        this.currentView = 'video-player';
        this.currentFile = null;
        this.keyboardShortcuts = new KeyboardShortcuts();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLibrary();
        this.setupKeyboardShortcuts();
        this.updateStorageInfo();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // File upload
        document.getElementById('add-files').addEventListener('click', () => {
            this.showFileUploadModal();
        });

        document.getElementById('start-upload').addEventListener('click', () => {
            this.uploadFiles();
        });

        // Playlist management
        document.getElementById('create-playlist').addEventListener('click', () => {
            this.createNewPlaylist();
        });

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideFileUploadModal();
        });

        // File input change
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.previewFiles(e.target.files);
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            }
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
            if (view.id === viewName) {
                view.classList.add('active');
            }
        });

        this.currentView = viewName;
    }

    showFileUploadModal() {
        document.getElementById('file-upload-modal').classList.add('active');
    }

    hideFileUploadModal() {
        document.getElementById('file-upload-modal').classList.remove('active');
    }

    previewFiles(files) {
        const status = document.getElementById('upload-status');
        status.textContent = `${files.length} file(s) selected`;
    }

    async uploadFiles() {
        const fileInput = document.getElementById('file-input');
        const files = fileInput.files;
        const progressFill = document.getElementById('upload-progress-fill');
        const status = document.getElementById('upload-status');

        if (files.length === 0) {
            status.textContent = 'Please select files first';
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append('files[]', file);
        }

        try {
            const response = await fetch('php/file-handler.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                status.textContent = 'Upload complete!';
                progressFill.style.width = '100%';
                
                // Reload library
                this.loadLibrary();
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    this.hideFileUploadModal();
                    fileInput.value = '';
                    progressFill.style.width = '0%';
                    status.textContent = 'Ready to upload';
                }, 2000);
            } else {
                status.textContent = 'Upload failed: ' + result.error;
            }
        } catch (error) {
            status.textContent = 'Upload error: ' + error.message;
        }
    }

    async loadLibrary() {
        try {
            const response = await fetch('php/file-handler.php?action=getFiles');
            const files = await response.json();
            
            this.displayFiles(files);
            this.updateStorageInfo();
        } catch (error) {
            console.error('Error loading library:', error);
        }
    }

    displayFiles(files) {
        const container = document.getElementById('files-container');
        container.innerHTML = '';

        files.forEach(file => {
            const fileCard = this.createFileCard(file);
            container.appendChild(fileCard);
        });
    }

    createFileCard(file) {
        const div = document.createElement('div');
        div.className = 'file-card';
        div.dataset.id = file.id;
        
        const icon = file.type === 'audio' ? 'fas fa-music' : 'fas fa-film';
        const typeClass = file.type === 'audio' ? 'audio' : 'video';
        
        div.innerHTML = `
            <div class="file-icon ${typeClass}">
                <i class="${icon}"></i>
            </div>
            <h4>${file.name}</h4>
            <p class="file-size">${this.formatFileSize(file.size)}</p>
            <p class="file-date">${new Date(file.date).toLocaleDateString()}</p>
        `;

        div.addEventListener('click', () => {
            this.selectFile(file);
        });

        return div;
    }

    selectFile(file) {
        this.currentFile = file;
        
        if (file.type === 'video') {
            this.switchView('video-player');
            videoPlayer.loadFile(file);
        } else {
            this.switchView('music-player');
            musicPlayer.loadFile(file);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async updateStorageInfo() {
        try {
            const response = await fetch('php/file-handler.php?action=getStorage');
            const storage = await response.json();
            
            const usedMB = (storage.used / (1024 * 1024)).toFixed(2);
            const totalMB = (storage.total / (1024 * 1024)).toFixed(2);
            const percentage = (storage.used / storage.total * 100).toFixed(2);
            
            document.getElementById('storage-used').textContent = `${usedMB} MB / ${totalMB} MB`;
            document.querySelector('.progress-fill').style.width = `${percentage}%`;
        } catch (error) {
            console.error('Error updating storage info:', error);
        }
    }

    createNewPlaylist() {
        const name = prompt('Enter playlist name:');
        if (name) {
            playlistManager.createPlaylist(name);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            this.keyboardShortcuts.handleKeyPress(e);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.driperApp = new DriperApp();
    window.videoPlayer = new VideoPlayer();
    window.musicPlayer = new MusicPlayer();
    window.playlistManager = new PlaylistManager();
});
