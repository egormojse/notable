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
        // Command states to check
        const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
        
        // Check active states
        commands.forEach(command => {
            const button = document.querySelector(`.toolbar-item[data-command="${command}"]`);
            const isActive = document.queryCommandState(command);
            
            if (button) {
                if (isActive) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
            
            activeFormattingStates[command] = isActive;
        });
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
                
                item.addEventListener('click', function() {
                    const cmd = this.getAttribute('data-command');
                    
                    if (cmd === 'handleFileAttachment') {
                        handleFileAttachment();
                    } else {
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
                        const selection = window.getSelection();
                        if (selection.isCollapsed) {
                            applyActiveFormattingToSelection();
                        }
                        
                        noteContent.focus();
                    }
                });
            }
        });
        
        // Listen for focus to ensure formatting continues after clicking elsewhere
        noteContent.addEventListener('focus', applyActiveFormattingToSelection);
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
                // Check if we're not already inside a formatted element
                let currentNode = range.startContainer;
                
                // If text node, get its parent
                if (currentNode.nodeType === 3) {
                    currentNode = currentNode.parentNode;
                }
                
                // Create marker for formatting
                const marker = document.createElement('span');
                marker.textContent = '\u200B'; // Zero-width space
                
                // Insert marker at current position
                range.insertNode(marker);
                
                // Apply each active formatting to the marker
                Object.keys(activeFormattingStates).forEach(cmd => {
                    if (activeFormattingStates[cmd] && 
                        ['bold', 'italic', 'underline'].includes(cmd)) {
                        document.execCommand(cmd, false, null);
                    }
                });
                
                // Move cursor after marker
                range.setStartAfter(marker);
                range.setEndAfter(marker);
                selection.removeAllRanges();
                selection.addRange(range);
            }
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
                <div class="color-option" data-color=""></div>
                <div class="color-option color-pink" data-color="note-pink"></div>
                <div class="color-option color-blue" data-color="note-blue"></div>
                <div class="color-option color-green" data-color="note-green"></div>
                <div class="color-option color-yellow" data-color="note-yellow"></div>
            </div>
            <div class="option-item delete-note">Delete Note</div>
        `;
        
        document.body.appendChild(optionsMenu);
        
        // Mark current color as selected
        if (currentNoteColor) {
            const currentOption = optionsMenu.querySelector(`[data-color="${currentNoteColor}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
            }
        } else {
            optionsMenu.querySelector('[data-color=""]').classList.add('selected');
        }
        
        // Add color picker event listeners
        optionsMenu.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                changeNoteColor(color);
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