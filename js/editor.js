/**
 * Note editor functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const backBtn = document.getElementById('backBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    
    // Current note ID
    let currentNoteId = sessionStorage.getItem('editNoteId');
    // Current note color
    let currentNoteColor = '';
    // Auto-save timer
    let autoSaveTimer = null;
    // Track formatting state
    let activeFormattingStates = {
        bold: false,
        italic: false,
        underline: false,
        insertUnorderedList: false,
        insertOrderedList: false
    };
    
    /**
     * Initialize the editor
     */
    function init() {
        setupEventListeners();
        loadNoteData();
        setupAutoSave();
        setupActiveButtonState();
        initMobileOptimizations(); // Add this line


        // Установить цвет текста на желтый
        noteContent.style.color = '#FFFF00';
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Back button
        backBtn.addEventListener('click', function() {
            saveCurrentNote();
            navigateBack();
        });
        
        // Save button
        saveNoteBtn.addEventListener('click', function() {
            saveCurrentNote();
            showSaveConfirmation();
        });
        
        // More options button
        moreOptionsBtn.addEventListener('click', function() {
            showOptionsMenu();
        });
        
        // Format toolbar items
        setupToolbarCommands();
        
        // Make sure content is focused when clicking anywhere in the editor area
        document.querySelector('.editor-content').addEventListener('click', function(e) {
            if (e.target === this) {
                noteContent.focus();
            }
        });
    }
    
    /**
     * Set up auto-save functionality
     */
    function setupAutoSave() {
        const saveDelay = 3000; // 3 seconds
        
        // Save note on content change after delay
        const contentChangeHandler = function() {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(function() {
                saveCurrentNote();
            }, saveDelay);
        };
        
        // Monitor for changes
        noteTitle.addEventListener('input', contentChangeHandler);
        noteContent.addEventListener('input', contentChangeHandler);
    }
    
    /**
     * Highlight active formatting buttons and update formatting state
     */
    function setupActiveButtonState() {
        noteContent.addEventListener('keyup', updateToolbarState);
        noteContent.addEventListener('mouseup', updateToolbarState);
        noteContent.addEventListener('click', updateToolbarState);
        
        // Ensure selection state is preserved when clicking buttons
        document.querySelectorAll('.toolbar-item').forEach(item => {
            item.addEventListener('mousedown', function(e) {
                // Prevent losing focus from content area
                e.preventDefault();
            });
        });
    }
    
    /**
     * Update toolbar button states based on current selection formatting
     */
    function updateToolbarState() {
        // Commands to check
        const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
        
        // Check active states
        commands.forEach(command => {
            const button = document.querySelector(`.toolbar-item[data-command="${command}"]`);
            
            try {
                // Some mobile browsers may have issues with queryCommandState
                const isActive = document.queryCommandState(command);
                
                if (button) {
                    if (isActive) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                }
                
                activeFormattingStates[command] = isActive;
            } catch (e) {
                console.log('Error checking command state:', e);
                // Fallback approach - check parent element styling
                if (button) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const parentElement = range.commonAncestorContainer.nodeType === 3 ? 
                            range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
                        
                        let isActive = false;
                        
                        // Check based on common HTML formatting elements
                        switch(command) {
                            case 'bold':
                                isActive = isElementOrParentBold(parentElement);
                                break;
                            case 'italic':
                                isActive = isElementOrParentItalic(parentElement);
                                break;
                            case 'underline':
                                isActive = isElementOrParentUnderlined(parentElement);
                                break;
                            case 'insertUnorderedList':
                                isActive = isElementOrParentUL(parentElement);
                                break;
                            case 'insertOrderedList':
                                isActive = isElementOrParentOL(parentElement);
                                break;
                        }
                        
                        if (isActive) {
                            button.classList.add('active');
                        } else {
                            button.classList.remove('active');
                        }
                        
                        activeFormattingStates[command] = isActive;
                    }
                }
            }
        });
    }

    function isElementOrParentBold(element) {
        if (!element || element === noteContent) return false;
        
        const style = window.getComputedStyle(element);
        if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) {
            return true;
        }
        
        if (element.tagName === 'B' || element.tagName === 'STRONG') {
            return true;
        }
        
        return isElementOrParentBold(element.parentNode);
    }

    function isElementOrParentItalic(element) {
        if (!element || element === noteContent) return false;
        
        const style = window.getComputedStyle(element);
        if (style.fontStyle === 'italic') {
            return true;
        }
        
        if (element.tagName === 'I' || element.tagName === 'EM') {
            return true;
        }
        
        return isElementOrParentItalic(element.parentNode);
    }
    
    /**
     * Check if element or any parent is underlined
     */
    function isElementOrParentUnderlined(element) {
        if (!element || element === noteContent) return false;
        
        const style = window.getComputedStyle(element);
        if (style.textDecoration.includes('underline')) {
            return true;
        }
        
        if (element.tagName === 'U') {
            return true;
        }
        
        return isElementOrParentUnderlined(element.parentNode);
    }
    
    /**
     * Check if element or any parent is an unordered list
     */
    function isElementOrParentUL(element) {
        if (!element || element === noteContent) return false;
        
        if (element.tagName === 'UL') {
            return true;
        }
        
        return isElementOrParentUL(element.parentNode);
    }
    
    /**
     * Check if element or any parent is an ordered list
     */
    function isElementOrParentOL(element) {
        if (!element || element === noteContent) return false;
        
        if (element.tagName === 'OL') {
            return true;
        }
        
        return isElementOrParentOL(element.parentNode);
    }
    
    /**
     * Setup formatting toolbar commands
     */
    function setupToolbarCommands() {
        const toolbarItems = document.querySelectorAll('.toolbar-item');
        
        // Map toolbar items to commands based on their icon text
        const commandMap = {
            'format_bold': 'bold',
            'format_italic': 'italic',
            'format_underlined': 'underline',
            'format_list_bulleted': 'insertUnorderedList',
            'format_list_numbered': 'insertOrderedList',
        };
        
        toolbarItems.forEach(item => {
            const iconText = item.textContent.trim();
            const command = commandMap[iconText];
            
            if (command) {
                item.setAttribute('data-command', command);
                
                // Function to handle formatting commands
                const handleFormatting = function(e) {
                    // Prevent default behavior that might cause focus loss
                    e.preventDefault();
                    
                    const cmd = this.getAttribute('data-command');
                    
                    if (cmd === 'handleFileAttachment') {
                        handleFileAttachment();
                    } else {
                        // Get current selection
                        const selection = window.getSelection();
                        let range = null;
                        
                        // Save current selection state
                        if (selection.rangeCount > 0) {
                            range = selection.getRangeAt(0);
                        }
                        
                        // Focus the content area
                        noteContent.focus();
                        
                        // Toggle formatting state
                        activeFormattingStates[cmd] = !activeFormattingStates[cmd];
                        
                        // Apply command
                        document.execCommand(cmd, false, null);
                        
                        // Update UI
                        if (activeFormattingStates[cmd]) {
                            this.classList.add('active');
                        } else {
                            this.classList.remove('active');
                        }
                        
                        // If no text is selected, ensure format continues when typing
                        if (selection.isCollapsed) {
                            applyActiveFormattingToSelection();
                        }
                        
                        // Make sure content area maintains focus
                        noteContent.focus();
                        
                        // Update the toolbar state
                        updateToolbarState();
                    }
                };
                
                // Add event listeners for both mouse and touch events
                
                // Mouse events (desktop)
                item.addEventListener('click', handleFormatting);
                
                // Prevent focus loss without interfering with click handler
                item.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                });
                
                // Touch events (mobile)
                item.addEventListener('touchstart', function(e) {
                    // Don't prevent default here as it can interfere with tap recognition
                });
                
                item.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    // Small delay to ensure proper touch handling
                    setTimeout(() => {
                        handleFormatting.call(this, e);
                    }, 10);
                });
            }
        });
        
        // Enhanced selection tracking for mobile
        noteContent.addEventListener('focus', applyActiveFormattingToSelection);
        noteContent.addEventListener('keyup', updateToolbarState);
        noteContent.addEventListener('mouseup', updateToolbarState);
        noteContent.addEventListener('click', updateToolbarState);
        
        // Add touch event handlers for mobile
        noteContent.addEventListener('touchend', function(e) {
            // Small delay to let the browser process the touch
            setTimeout(updateToolbarState, 100);
        });
        
        // Handle selection changes on mobile
        document.addEventListener('selectionchange', function() {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && 
                noteContent.contains(selection.anchorNode)) {
                // Only update if selection is within our editor
                setTimeout(updateToolbarState, 10);
            }
        });
    }
    
    /**
     * Apply active formatting to current selection or cursor position
     */
    function applyActiveFormattingToSelection() {
        const selection = window.getSelection();
        
        // Only apply if we have formatting active and selection is collapsed (just a cursor)
        if (selection.rangeCount > 0 && selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const hasActiveFormatting = Object.values(activeFormattingStates).some(state => state);
            
            // Only continue if we have active formatting
            if (hasActiveFormatting) {
                // Create a placeholder for formatting
                const temp = document.createElement('span');
                temp.setAttribute('id', 'temp-formatting');
                temp.textContent = '\u200B'; // Zero-width space
                
                // Insert the placeholder
                range.insertNode(temp);
                
                // Create a new range that selects the placeholder
                const tempRange = document.createRange();
                tempRange.selectNodeContents(temp);
                selection.removeAllRanges();
                selection.addRange(tempRange);
                
                // Apply each active formatting
                Object.keys(activeFormattingStates).forEach(cmd => {
                    if (activeFormattingStates[cmd]) {
                        document.execCommand(cmd, false, null);
                    }
                });
                
                // Remove the placeholder but keep the formatting
                const parent = temp.parentNode;
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, temp);
                }
                parent.removeChild(temp);
                
                // Move cursor to the end of the formatted area
                const newRange = document.createRange();
                newRange.setStartAfter(parent.lastChild);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
        }
    }

    function initMobileOptimizations() {
        // Check if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Add mobile-specific class to body for CSS targeting
            document.body.classList.add('mobile-device');
            
            // Increase toolbar button size for better touch targets
            const toolbarItems = document.querySelectorAll('.toolbar-item');
            toolbarItems.forEach(item => {
                item.classList.add('mobile-toolbar-item');
            });
            
            // Add extra padding to editor for better typing experience
            noteContent.classList.add('mobile-editor');
            
            // Prevent zoom on input focus for iOS devices
            const metaViewport = document.querySelector('meta[name=viewport]');
            if (metaViewport) {
                metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
            } else {
                const newMetaViewport = document.createElement('meta');
                newMetaViewport.name = 'viewport';
                newMetaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
                document.head.appendChild(newMetaViewport);
            }
            
            // Add special handlers for soft keyboard issues
            window.addEventListener('resize', handleKeyboardVisibilityChange);
        }
    }
    
    /**
     * Handle keyboard visibility changes on mobile
     */
    function handleKeyboardVisibilityChange() {
        // This is a simple approach - keyboard visibility changes window height
        const toolbar = document.querySelector('.formatting-toolbar');
        const editorContent = document.querySelector('.editor-content');
        
        // If keyboard is likely visible (window height decreased significantly)
        if (window.innerHeight < window.outerHeight * 0.8) {
            // Adjust UI for keyboard visibility
            toolbar.classList.add('keyboard-visible');
            editorContent.classList.add('keyboard-visible');
        } else {
            // Restore UI when keyboard is hidden
            toolbar.classList.remove('keyboard-visible');
            editorContent.classList.remove('keyboard-visible');
        }
    }
    
    /**
     * Handle file attachment
     */
    function handleFileAttachment() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        
        // Trigger file selection
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Create attachment container
                const attachmentContainer = document.createElement('div');
                attachmentContainer.className = 'attachment-container';
                
                // Create attachment icon and filename elements
                const iconSpan = document.createElement('span');
                iconSpan.className = 'material-icons attachment-icon';
                iconSpan.textContent = 'attachment';
                
                const filenameSpan = document.createElement('span');
                filenameSpan.className = 'attachment-filename';
                filenameSpan.textContent = file.name;
                
                // Add elements to container
                attachmentContainer.appendChild(iconSpan);
                attachmentContainer.appendChild(filenameSpan);
                
                // Store file data
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Store file data as data attribute
                    attachmentContainer.setAttribute('data-file', e.target.result);
                    attachmentContainer.setAttribute('data-filename', file.name);
                    attachmentContainer.setAttribute('data-filetype', file.type);
                };
                
                // Add click handler to preview file
                attachmentContainer.addEventListener('click', function() {
                    previewAttachment(this);
                });
                
                // Read file as data URL
                reader.readAsDataURL(file);
                
                // Insert attachment at cursor position
                insertAtCursor(attachmentContainer);
                
                // Focus back on editor
                noteContent.focus();
            }
        });
    }
    
    /**
     * Preview attachment
     * @param {HTMLElement} attachmentElement Attachment container element
     */
    function previewAttachment(attachmentElement) {
        const fileData = attachmentElement.getAttribute('data-file');
        const fileName = attachmentElement.getAttribute('data-filename');
        const fileType = attachmentElement.getAttribute('data-filetype');
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'attachment-preview';
        
        let previewContent = '';
        
        // Create appropriate preview based on file type
        if (fileType.startsWith('image/')) {
            previewContent = `
                <div class="preview-header">
                    <span>${fileName}</span>
                    <span class="material-icons preview-close">close</span>
                </div>
                <div class="preview-content">
                    <img src="${fileData}" alt="${fileName}">
                </div>
            `;
        } else {
            previewContent = `
                <div class="preview-header">
                    <span>${fileName}</span>
                    <span class="material-icons preview-close">close</span>
                </div>
                <div class="preview-content">
                    <div class="file-info">
                        <span class="material-icons large-icon">description</span>
                        <p>File preview not available</p>
                        <a href="${fileData}" download="${fileName}" class="download-link">Download</a>
                    </div>
                </div>
            `;
        }
        
        previewContainer.innerHTML = previewContent;
        document.body.appendChild(previewContainer);
        
        // Show with animation
        setTimeout(() => {
            previewContainer.classList.add('show');
        }, 10);
        
        // Add close functionality
        previewContainer.querySelector('.preview-close').addEventListener('click', function() {
            previewContainer.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(previewContainer);
            }, 300);
        });
        
        // Close when clicking outside the preview content
        previewContainer.addEventListener('click', function(e) {
            if (e.target === previewContainer) {
                previewContainer.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(previewContainer);
                }, 300);
            }
        });
    }
    
    /**
     * Insert element at cursor position
     * @param {HTMLElement} element Element to insert
     */
    function insertAtCursor(element) {
        const selection = window.getSelection();
        
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(element);
            
            // Move cursor after the inserted element
            range.setStartAfter(element);
            range.setEndAfter(element);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            noteContent.appendChild(element);
        }
    }
    
    /**
     * Load note data if editing existing note
     */
    function loadNoteData() {
        if (currentNoteId) {
            const note = StorageManager.getNoteById(currentNoteId);
            
            if (note) {
                noteTitle.value = note.title || '';
                noteContent.innerHTML = note.content || '';
                currentNoteColor = note.color || '';
                
                // Apply color to editor
                if (currentNoteColor) {
                    document.querySelector('.editor-content').classList.add(currentNoteColor);
                }
            }
        }
    }
    
    /**
     * Save the current note
     */
    function saveCurrentNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.innerHTML.trim();
        
        // Only save if there's content
        if (title || content) {
            const note = {
                id: currentNoteId || Date.now().toString(),
                title: title || 'Untitled',
                content: content,
                color: currentNoteColor,
                timestamp: Date.now()
            };
            
            const savedId = StorageManager.saveNote(note);
            currentNoteId = savedId;
            
            // Update session storage
            sessionStorage.setItem('editNoteId', savedId);
        }
    }
    
    /**
     * Show save confirmation message
     */
    function showSaveConfirmation() {
        const confirmation = document.createElement('div');
        confirmation.className = 'save-confirmation';
        confirmation.textContent = 'Note saved!';
        
        document.body.appendChild(confirmation);
        
        // Remove after animation
        setTimeout(() => {
            confirmation.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            confirmation.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(confirmation);
            }, 300);
        }, 2000);
    }
    
    /**
     * Show options menu
     */
    function showOptionsMenu() {
        // Create options menu
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'options-menu';
        
        optionsMenu.innerHTML = `
            <div class="option-item change-color">Change Color</div>
            <div class="color-picker">
                <div class="color-option" data-bg-color="#ffffff" data-shadow="none"></div>
                <div class="color-option color-pink" data-bg-color="#5c2739" data-shadow="0 4px 12px rgba(244, 67, 54, 0.3)"></div>
                <div class="color-option color-blue" data-bg-color="#1a365d" data-shadow="0 4px 12px rgba(33, 150, 243, 0.3)"></div>
                <div class="color-option color-green" data-bg-color="#1e4620" data-shadow="0 4px 12px rgba(76, 175, 80, 0.3)"></div>
                <div class="color-option color-yellow" data-bg-color="#553c00" data-shadow="0 4px 12px rgba(255, 235, 59, 0.3)"></div>
            </div>
            <div class="option-item delete-note">Delete Note</div>
        `;
        
        document.body.appendChild(optionsMenu);
        
        // Mark current color as selected
        if (currentNoteColor) {
            const currentOption = optionsMenu.querySelector(`[data-bg-color="${currentNoteColor.bgColor}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
            }
        } else {
            optionsMenu.querySelector('[data-bg-color="#ffffff"]').classList.add('selected');
        }
        
        // Add color picker event listeners
        optionsMenu.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                const bgColor = this.getAttribute('data-bg-color');
                const shadow = this.getAttribute('data-shadow');
                const colorName = this.classList.contains('color-pink') ? 'pink' : 
                                  this.classList.contains('color-blue') ? 'blue' :
                                  this.classList.contains('color-green') ? 'green' :
                                  this.classList.contains('color-yellow') ? 'yellow' : '';
                                  
                changeNoteColorDirectly(bgColor, shadow, colorName);
                
                optionsMenu.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        // Add delete note event listener
        optionsMenu.querySelector('.delete-note').addEventListener('click', function() {
            showDeleteConfirmation();
            document.body.removeChild(optionsMenu);
        });
        
        // Position menu near the button
        const buttonRect = moreOptionsBtn.getBoundingClientRect();
        optionsMenu.style.top = (buttonRect.bottom + 5) + 'px';
        optionsMenu.style.right = (window.innerWidth - buttonRect.right) + 'px';
        
        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!optionsMenu.contains(e.target) && e.target !== moreOptionsBtn) {
                document.body.removeChild(optionsMenu);
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    /**
 * Change note color directly using inline styles
 * @param {string} bgColor Background color value
 * @param {string} shadow Box shadow value
 * @param {string} colorName Color name for reference (pink, blue, etc.)
 */
function changeNoteColorDirectly(bgColor, shadow, colorName) {
    const editorContent = document.querySelector('.editor-content');
    
    // Apply styles directly to the element
    editorContent.style.backgroundColor = bgColor;
    editorContent.style.boxShadow = shadow === 'none' ? '' : shadow;
    
    // Store color information as an object instead of class name
    currentNoteColor = {
        bgColor: bgColor,
        shadow: shadow,
        name: colorName
    };
    
    // Auto-save after color change
    saveCurrentNote();
}

function saveCurrentNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.innerHTML.trim();
    
    // Only save if there's content
    if (title || content) {
        const note = {
            id: currentNoteId || Date.now().toString(),
            title: title || 'Untitled',
            content: content,
            color: currentNoteColor, // Now an object with bgColor, shadow, and name
            timestamp: Date.now()
        };
        
        const savedId = StorageManager.saveNote(note);
        currentNoteId = savedId;
        
        // Update session storage
        sessionStorage.setItem('editNoteId', savedId);
    }
}
function loadNoteData() {
    if (currentNoteId) {
        const note = StorageManager.getNoteById(currentNoteId);
        
        if (note) {
            noteTitle.value = note.title || '';
            noteContent.innerHTML = note.content || '';
            
            // Handle color data for compatibility with both formats
            if (note.color) {
                if (typeof note.color === 'object') {
                    // New format (object with bgColor and shadow)
                    currentNoteColor = note.color;
                    
                    // Apply styles directly
                    const editorContent = document.querySelector('.editor-content');
                    editorContent.style.backgroundColor = note.color.bgColor;
                    editorContent.style.boxShadow = note.color.shadow === 'none' ? '' : note.color.shadow;
                } else {
                    // Old format (string with class name)
                    // Try to convert old format to new
                    convertOldColorFormat(note.color);
                }
            }
        }
    }
}

/**
 * Convert old color format (class name) to new format (object with bgColor and shadow)
 * @param {string} oldColorClass Old color class name
 */
function convertOldColorFormat(oldColorClass) {
    const colorMap = {
        'note-pink': { bgColor: '#5c2739', shadow: '0 4px 12px rgba(244, 67, 54, 0.3)', name: 'pink' },
        'note-blue': { bgColor: '#1a365d', shadow: '0 4px 12px rgba(33, 150, 243, 0.3)', name: 'blue' },
        'note-green': { bgColor: '#1e4620', shadow: '0 4px 12px rgba(76, 175, 80, 0.3)', name: 'green' },
        'note-yellow': { bgColor: '#553c00', shadow: '0 4px 12px rgba(255, 235, 59, 0.3)', name: 'yellow' }
    };
    
    if (colorMap[oldColorClass]) {
        currentNoteColor = colorMap[oldColorClass];
        
        // Apply styles directly
        const editorContent = document.querySelector('.editor-content');
        editorContent.style.backgroundColor = currentNoteColor.bgColor;
        editorContent.style.boxShadow = currentNoteColor.shadow;
    } else {
        // Default (no color)
        currentNoteColor = { bgColor: '#ffffff', shadow: 'none', name: '' };
        
        const editorContent = document.querySelector('.editor-content');
        editorContent.style.backgroundColor = '#ffffff';
        editorContent.style.boxShadow = '';
    }
}
    /**
     * Change note color
     * @param {string} color Color class name
     */
    function changeNoteColor(color) {
        const editorContent = document.querySelector('.editor-content');
        
        // Remove existing color classes
        editorContent.classList.remove('note-pink', 'note-blue', 'note-green', 'note-yellow');
        
        // Add new color class if provided
        if (color) {
            editorContent.classList.add(color);
        }
        
        // Update current color
        currentNoteColor = color;
        
        // Auto-save after color change
        saveCurrentNote();
    }
    
    /**
     * Show delete confirmation dialog
     */
    function showDeleteConfirmation() {
        const deleteConfirm = document.createElement('div');
        deleteConfirm.className = 'delete-confirm';
        
        deleteConfirm.innerHTML = `
            <div class="delete-dialog">
                <h3>Delete Note?</h3>
                <p>This action cannot be undone.</p>
                <div class="delete-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(deleteConfirm);
        
        // Show dialog with animation
        setTimeout(() => {
            deleteConfirm.style.display = 'flex';
            deleteConfirm.style.opacity = '1';
        }, 10);
        
        // Cancel button
        deleteConfirm.querySelector('.cancel-btn').addEventListener('click', function() {
            deleteConfirm.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(deleteConfirm);
            }, 300);
        });
        
        // Delete button
        deleteConfirm.querySelector('.delete-btn').addEventListener('click', function() {
            if (currentNoteId) {
                StorageManager.deleteNote(currentNoteId);
            }
            navigateBack();
        });
        
        // Close when clicking outside the dialog
        deleteConfirm.addEventListener('click', function(e) {
            if (e.target === deleteConfirm) {
                deleteConfirm.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(deleteConfirm);
                }, 300);
            }
        });
    }
    
    /**
     * Navigate back to notes list
     */
    function navigateBack() {
        window.location.href = 'index.html';
    }
    
    // Initialize editor
    init();
});
/**
* Translation functionality using MyMemory Translation API
*/
document.addEventListener('DOMContentLoaded', function() {
   // Get translate button element
   const translateBtn = document.getElementById('translate-btn');
   
   // Add click event listener to translate button
   translateBtn.addEventListener('click', function() {
       showTranslationForm();
   });
   
   /**
    * Show translation form
    */
   function showTranslationForm() {
       // Create translation form container
       const translationForm = document.createElement('div');
       translationForm.className = 'translation-form-container';
       
       // Create form HTML
       translationForm.innerHTML = `
           <div class="translation-form">
               <div class="translation-header">
                   <h3>Translate Text</h3>
                   <span class="material-icons translation-close">close</span>
               </div>
               <div class="translation-content">
                   <div class="translation-input-group">
                       <textarea id="textToTranslate" placeholder="Enter text to translate"></textarea>
                       <div class="language-selector">
                           <select id="sourceLanguage">
                               <option value="">Select source language</option>
                               <option value="en">English</option>
                               <option value="es">Spanish</option>
                               <option value="fr">French</option>
                               <option value="de">German</option>
                               <option value="ru">Russian</option>
                               <option value="zh">Chinese</option>
                               <option value="ja">Japanese</option>
                               <option value="ar">Arabic</option>
                               <option value="it">Italian</option>
                               <option value="pt">Portuguese</option>
                           </select>
                           <span class="material-icons swap-icon">swap_horiz</span>
                           <select id="targetLanguage">
                               <option value="">Select target language</option>
                               <option value="en">English</option>
                               <option value="es">Spanish</option>
                               <option value="fr">French</option>
                               <option value="de">German</option>
                               <option value="ru" selected>Russian</option>
                               <option value="zh">Chinese</option>
                               <option value="ja">Japanese</option>
                               <option value="ar">Arabic</option>
                               <option value="it">Italian</option>
                               <option value="pt">Portuguese</option>
                           </select>
                       </div>
                   </div>
                   <div class="translation-result">
                       <textarea id="translatedText" placeholder="Translation" readonly></textarea>
                       <div class="translation-actions">
                           <button id="insertTranslation" disabled>Insert Translation</button>
                           <div class="translation-status">
                               <span id="statusMessage"></span>
                               <div class="loading-spinner" id="loadingSpinner"></div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       // Add translation form to body
       document.body.appendChild(translationForm);
       
       // Show with animation
       setTimeout(() => {
           translationForm.classList.add('show');
       }, 10);
       
       // Get form elements
       const closeBtn = translationForm.querySelector('.translation-close');
       const textToTranslate = document.getElementById('textToTranslate');
       const sourceLanguage = document.getElementById('sourceLanguage');
       const targetLanguage = document.getElementById('targetLanguage');
       const translatedText = document.getElementById('translatedText');
       const insertBtn = document.getElementById('insertTranslation');
       const statusMessage = document.getElementById('statusMessage');
       const loadingSpinner = document.getElementById('loadingSpinner');
       const swapIcon = translationForm.querySelector('.swap-icon');
       
       // Save current cursor position in note content
       const noteContent = document.getElementById('noteContent');
       const selection = window.getSelection();
       let savedRange = null;
       
       if (selection.rangeCount > 0) {
           savedRange = selection.getRangeAt(0).cloneRange();
       }
       
       // Add close functionality
       closeBtn.addEventListener('click', function() {
           translationForm.classList.remove('show');
           setTimeout(() => {
               document.body.removeChild(translationForm);
               // Restore cursor position
               restoreCursorPosition();
           }, 300);
       });
       
       // Close when clicking outside the form
       translationForm.addEventListener('click', function(e) {
           if (e.target === translationForm) {
               translationForm.classList.remove('show');
               setTimeout(() => {
                   document.body.removeChild(translationForm);
                   // Restore cursor position
                   restoreCursorPosition();
               }, 300);
           }
       });
       
       // Add swap languages functionality
       swapIcon.addEventListener('click', function() {
           // Only swap if both languages are selected
           if (sourceLanguage.value && targetLanguage.value) {
               const tempLang = sourceLanguage.value;
               sourceLanguage.value = targetLanguage.value;
               targetLanguage.value = tempLang;
               
               // Retranslate if there's text
               if (textToTranslate.value.trim()) {
                   translateText();
               }
           }
       });
       
       // Add translate functionality on input
       let translateTimeout;
       textToTranslate.addEventListener('input', function() {
           // Clear previous timeout
           clearTimeout(translateTimeout);
           
           // Reset UI if input is empty
           if (!this.value.trim()) {
               translatedText.value = '';
               insertBtn.disabled = true;
               statusMessage.textContent = '';
               loadingSpinner.style.display = 'none';
               return;
           }
           
           // Check if languages are selected
           if (!sourceLanguage.value || !targetLanguage.value) {
               statusMessage.textContent = 'Please select source and target languages';
               return;
           }
           
           // Set timeout for translation (delay to avoid too many requests)
           translateTimeout = setTimeout(translateText, 500);
       });
       
       // Add change event listeners for language selectors
       sourceLanguage.addEventListener('change', function() {
           if (textToTranslate.value.trim() && sourceLanguage.value && targetLanguage.value) {
               translateText();
           } else {
               statusMessage.textContent = sourceLanguage.value ? '' : 'Please select source language';
           }
       });
       
       targetLanguage.addEventListener('change', function() {
           if (textToTranslate.value.trim() && sourceLanguage.value && targetLanguage.value) {
               translateText();
           } else {
               statusMessage.textContent = targetLanguage.value ? '' : 'Please select target language';
           }
       });
       
       // Add insert functionality
       insertBtn.addEventListener('click', function() {
           // Insert text at saved cursor position
           insertTranslatedText(translatedText.value);
           
           // Close form
           translationForm.classList.remove('show');
           setTimeout(() => {
               document.body.removeChild(translationForm);
           }, 300);
       });
       
       /**
        * Translate text using MyMemory Translation API
        */
       function translateText() {
           const text = textToTranslate.value.trim();
           const source = sourceLanguage.value;
           const target = targetLanguage.value;
           
           if (!text || !source || !target) {
               statusMessage.textContent = 'Please select both languages';
               return;
           }
           
           // Disable insert button during translation
           insertBtn.disabled = true;
           
           // Show loading state
           loadingSpinner.style.display = 'inline-block';
           statusMessage.textContent = 'Translating...';
           
           // Prepare language pair in format langpair=source|target
           const langPair = `${source}|${target}`;
           
           // MyMemory Translation API URL
           const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}&de=youremail@example.com`;
           
           // Make AJAX request
           fetch(apiUrl)
               .then(response => {
                   if (!response.ok) {
                       throw new Error('Translation request failed');
                   }
                   return response.json();
               })
               .then(data => {
                   if (data.responseStatus === 200 && data.responseData) {
                       // Extract translated text
                       const translatedResult = data.responseData.translatedText;
                       
                       // Update UI with translated text
                       translatedText.value = translatedResult;
                       insertBtn.disabled = false;
                       statusMessage.textContent = 'Translation complete';
                       loadingSpinner.style.display = 'none';
                   } else {
                       throw new Error('Invalid translation response');
                   }
               })
               .catch(error => {
                   console.error('Translation error:', error);
                   
                   // Show error message
                   statusMessage.textContent = 'Translation failed. Please try again.';
                   loadingSpinner.style.display = 'none';
                   
                   // If the error is related to rate limiting, show specific message
                   if (error.message && error.message.includes('MYMEMORY WARNING')) {
                       statusMessage.textContent = 'Daily translation limit reached. Please try again tomorrow.';
                   }
               });
       }
       
       /**
        * Restore saved cursor position in note content
        */
       function restoreCursorPosition() {
           if (savedRange) {
               noteContent.focus();
               const selection = window.getSelection();
               selection.removeAllRanges();
               selection.addRange(savedRange);
           }
       }
       
       /**
        * Insert translated text at saved cursor position
        * @param {string} text Text to insert
        */
       function insertTranslatedText(text) {
           // Focus on note content
           noteContent.focus();
           
           // Restore saved range if available
           if (savedRange) {
               const selection = window.getSelection();
               selection.removeAllRanges();
               selection.addRange(savedRange);
               
               // Insert text at cursor position
               const range = selection.getRangeAt(0);
               range.deleteContents();
               range.insertNode(document.createTextNode(text));
               
               // Move cursor after inserted text
               range.setStartAfter(range.endContainer);
               range.setEndAfter(range.endContainer);
               selection.removeAllRanges();
               selection.addRange(range);
           } else {
               // If no saved position, just append to end
               noteContent.innerHTML += text;
           }
       }
       
       // Focus on input text area
       textToTranslate.focus();
   }
});