/**
 * Main application logic for Notes App
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const notesContainer = document.getElementById('notesContainer');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const searchIcon = document.querySelector('.search-icon');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const closeSearch = document.getElementById('closeSearch');
    const searchResults = document.getElementById('searchResults');
    
    // Color options for notes
    const noteColors = ['', 'note-pink', 'note-blue', 'note-green', 'note-yellow'];
    
    /**
     * Initialize the application
     */
    function init() {
        loadNotes();
        setupEventListeners();
    }
    
    /**
     * Load and display all notes
     */
    function loadNotes() {
        const notes = StorageManager.getAllNotes();
        renderNotes(notes);
    }
    
    /**
     * Render notes to the DOM
     * @param {Array} notes Array of note objects
     */
    function renderNotes(notes) {
        notesContainer.innerHTML = '';
        
        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-notes">
                    <p>No notes yet. Click the + button to create one!</p>
                </div>
            `;
            return;
        }
        
        notes.forEach(note => {
            const noteCard = createNoteElement(note);
            notesContainer.appendChild(noteCard);
        });
    }
    
    /**
     * Create a note DOM element
     * @param {Object} note Note object
     * @returns {HTMLElement} Note element
     */
    function createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = `note-card ${note.color || ''}`;
        noteElement.dataset.noteId = note.id;
        
        const title = note.title || 'Untitled';
        const content = note.content || '';
        const formattedDate = formatDate(note.modifiedAt || note.createdAt);
        
        noteElement.innerHTML = `
            <h3>${title}</h3>
            <p>${truncateContent(content)}</p>
            <div class="note-date">${formattedDate}</div>
        `;
        
        noteElement.addEventListener('click', function() {
            openNoteEditor(note.id);
        });
        
        return noteElement;
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Add note button
        addNoteBtn.addEventListener('click', function() {
            openNoteEditor();
        });
        
        // Search icon
        searchIcon.addEventListener('click', function() {
            openSearchOverlay();
        });
        
        // Close search
        closeSearch.addEventListener('click', function() {
            closeSearchOverlay();
        });
        
        // Search input
        searchInput.addEventListener('input', function() {
            const query = this.value;
            performSearch(query);
        });
    }
    
    /**
     * Open note editor
     * @param {string} noteId Optional note ID to edit
     */
    function openNoteEditor(noteId = null) {
        // Store the current note ID in sessionStorage if provided
        if (noteId) {
            sessionStorage.setItem('editNoteId', noteId);
        } else {
            sessionStorage.removeItem('editNoteId');
        }
        
        // Navigate to editor page
        window.location.href = 'editor.html';
    }
    
    /**
     * Open search overlay
     */
    function openSearchOverlay() {
        searchOverlay.style.display = 'flex';
        searchInput.focus();
    }
    
    /**
     * Close search overlay
     */
    function closeSearchOverlay() {
        searchOverlay.style.display = 'none';
        searchInput.value = '';
        searchResults.innerHTML = '';
    }
    
    /**
     * Perform search and display results
     * @param {string} query Search query
     */
    function performSearch(query) {
        const results = StorageManager.searchNotes(query);
        
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="empty-search">
                    <p>No results found</p>
                </div>
            `;
            return;
        }
        
        results.forEach(note => {
            const resultItem = document.createElement('div');
            resultItem.className = `note-card ${note.color || ''}`;
            resultItem.dataset.noteId = note.id;
            
            const title = note.title || 'Untitled';
            const content = note.content || '';
            
            resultItem.innerHTML = `
                <h3>${title}</h3>
                <p>${truncateContent(content)}</p>
            `;
            
            resultItem.addEventListener('click', function() {
                closeSearchOverlay();
                openNoteEditor(note.id);
            });
            
            searchResults.appendChild(resultItem);
        });
    }
    
    /**
     * Format date to readable string
     * @param {string} dateString ISO date string
     * @returns {string} Formatted date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Truncate content for preview
     * @param {string} content Note content
     * @param {number} maxLength Maximum length
     * @returns {string} Truncated content
     */
    function truncateContent(content, maxLength = 100) {
        if (!content) return '';
        
        content = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        
        if (content.length <= maxLength) {
            return content;
        }
        
        return content.substring(0, maxLength) + '...';
    }
    
    // Initialize app
    init();
});