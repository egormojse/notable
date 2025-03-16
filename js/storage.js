/**
 * Storage Manager for Notes Application
 * Handles saving, retrieving, updating and deleting notes
 */
const StorageManager = {
    // Key for storing notes in localStorage
    STORAGE_KEY: 'notesAppData',
    
    /**
     * Initialize storage with default notes if empty
     */
    init: function() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            // Load default notes from JSON file
            this.loadDefaultNotes();
        }
    },
    
    /**
     * Load default notes from JSON file
     */
    loadDefaultNotes: function() {
        fetch('js/defaultNotes.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error loading default notes:', error);
                // Create empty notes array if JSON fetch fails
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            });
    },
    
    /**
     * Get all notes from storage
     * @returns {Array} Array of note objects
     */
    getAllNotes: function() {
        const notes = localStorage.getItem(this.STORAGE_KEY);
        return notes ? JSON.parse(notes) : [];
    },
    
    /**
     * Get a single note by ID
     * @param {string} id Note ID
     * @returns {Object|null} Note object if found, null otherwise
     */
    getNoteById: function(id) {
        const notes = this.getAllNotes();
        return notes.find(note => note.id === id) || null;
    },
    
    /**
     * Save a new note
     * @param {Object} note Note object
     * @returns {string} ID of the saved note
     */
    saveNote: function(note) {
        const notes = this.getAllNotes();
        
        // Generate ID if not provided
        if (!note.id) {
            note.id = 'note-' + Date.now();
        }
        
        // Add creation date if new note
        if (!note.createdAt) {
            note.createdAt = new Date().toISOString();
        }
        
        // Update modified date
        note.modifiedAt = new Date().toISOString();
        
        // Make sure timestamp exists for sorting
        if (!note.timestamp) {
            note.timestamp = Date.now();
        }
        
        // Check if note already exists
        const existingIndex = notes.findIndex(n => n.id === note.id);
        
        if (existingIndex >= 0) {
            // Update existing note
            notes[existingIndex] = {...notes[existingIndex], ...note};
        } else {
            // Add new note
            notes.unshift(note); // Add to beginning of array
        }
        
        // Save to localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
        
        return note.id;
    },
    
    /**
     * Delete a note by ID
     * @param {string} id Note ID
     * @returns {boolean} True if deleted, false otherwise
     */
    deleteNote: function(id) {
        let notes = this.getAllNotes();
        const initialLength = notes.length;
        
        notes = notes.filter(note => note.id !== id);
        
        if (notes.length !== initialLength) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
            return true;
        }
        
        return false;
    },
    
    /**
     * Search notes by query
     * @param {string} query Search query
     * @returns {Array} Array of matching note objects
     */
    searchNotes: function(query) {
        if (!query || query.trim() === '') {
            return this.getAllNotes();
        }
        
        const notes = this.getAllNotes();
        const searchTerm = query.toLowerCase().trim();
        
        return notes.filter(note => {
            const titleMatch = note.title && note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content && 
                note.content.toLowerCase().replace(/<[^>]*>/g, ' ').includes(searchTerm);
            return titleMatch || contentMatch;
        });
    },
    
    /**
     * Sort notes by modification date (newest first)
     * @returns {Array} Sorted array of note objects
     */
    getSortedNotes: function() {
        const notes = this.getAllNotes();
        return notes.sort((a, b) => {
            // First try timestamp
            if (a.timestamp && b.timestamp) {
                return b.timestamp - a.timestamp;
            }
            // Fall back to modifiedAt
            return new Date(b.modifiedAt) - new Date(a.modifiedAt);
        });
    }
};

// Initialize storage on script load
StorageManager.init();