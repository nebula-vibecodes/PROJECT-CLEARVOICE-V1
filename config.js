// Clearvoice AAC Configuration
// This file contains vocabulary data and image configuration
// Users can add custom images by adding entries to the customImages object

const ClearvoiceConfig = {
  // Custom images configuration
  // Add your own images here with format: "tileText": "path/to/image.jpg"
  // Example: "mom": "images/mom.jpg", "dad": "images/dad.jpg"
  customImages: {
    // Family members (example - replace with your own image paths)
    "mom": null,
    "dad": null,
    "grandma": null,
    "grandpa": null,
    "sister": null,
    "brother": null,
    "aunt": null,
    "uncle": null,
    "cousin": null,
    
    // Caregivers
    "caregiver": null,
    "teacher": null,
    "therapist": null,
    "doctor": null,
    "nurse": null,
    
    // Favorite people
    "friend": null,
    
    // Favorite foods
    "pizza": null,
    "burger": null,
    "ice cream": null,
    "cake": null,
    "cookie": null,
    
    // Favorite places
    "home": null,
    "school": null,
    "park": null,
    "beach": null,
    "store": null,
    
    // Favorite activities
    "music": null,
    "movie": null,
    "game": null,
    "swim": null,
    "play": null,
    
    // Favorite objects
    "toy": null,
    "book": null,
    "ball": null,
    "phone": null,
    "tablet": null
  },

  // Image base URL (for remote images) or local path
  // Set to empty string to use only local images
  imageBaseUrl: "",

  // Default image for tiles without custom images
  defaultImage: null,

  // Get image URL for a given tile text
  getImageUrl: function(tileText) {
    const normalizedText = tileText.toLowerCase().trim();
    if (this.customImages[normalizedText]) {
      return this.customImages[normalizedText];
    }
    // Check for partial matches (e.g., "I need help" contains "help")
    for (const [key, value] of Object.entries(this.customImages)) {
      if (normalizedText.includes(key.toLowerCase()) && value) {
        return value;
      }
    }
    return this.defaultImage;
  },

  // Check if a tile has a custom image
  hasImage: function(tileText) {
    return this.getImageUrl(tileText) !== null && this.getImageUrl(tileText) !== undefined;
  }
};

// Vocabulary Data - Expanded to 160+ tiles
const VocabularyData = {
  core: [
    // Pronouns and basic words
    ['I', '\u25c9', 'core'],
    ['you', '\u263b', 'core'],
    ['we', '\u263c', 'core'],
    ['they', '\u263d', 'core'],
    ['he', '\u2642', 'core'],
    ['she', '\u2640', 'core'],
    ['it', '\u25cf', 'core'],
    ['this', '\u261d', 'core'],
    ['that', '\u261e', 'core'],
    ['here', '\u25bc', 'core'],
    ['there', '\u25b6', 'core'],
    
    // Verbs
    ['want', '\u2726', 'action'],
    ['need', '\u271a', 'action'],
    ['like', '\u2665', 'feeling'],
    ['love', '\u2764', 'feeling'],
    ['hate', '\u2763', 'feeling'],
    ['go', '\u2192', 'action'],
    ['stop', '\u25a0', 'urgent'],
    ['help', '\u270b', 'urgent'],
    ['get', '\u270c', 'action'],
    ['give', '\u270d', 'action'],
    ['take', '\u270e', 'action'],
    ['see', '\u25d2', 'action'],
    ['look', '\u25c5', 'action'],
    ['watch', '\u25c6', 'action'],
    ['listen', '\u25c7', 'action'],
    ['hear', '\u25c8', 'action'],
    ['feel', '\u2661', 'feeling'],
    ['think', '\u25c7', 'core'],
    ['know', '\u2713', 'core'],
    ['understand', '\u2714', 'core'],
    
    // Adjectives
    ['good', '\u2600', 'feeling'],
    ['bad', '\u2601', 'feeling'],
    ['happy', '\u263a', 'feeling'],
    ['sad', '\u2639', 'feeling'],
    ['angry', '\u2620', 'feeling'],
    ['scared', '\u2623', 'feeling'],
    ['tired', '\u262a', 'feeling'],
    ['sick', '\u2622', 'feeling'],
    ['hungry', '\u25d3', 'feeling'],
    ['thirsty', '\u25d4', 'feeling'],
    ['hot', '\u2600', 'feeling'],
    ['cold', '\u2601', 'feeling'],
    ['big', '\u25c7', 'core'],
    ['small', '\u25c8', 'core'],
    ['more', '\uff0b', 'core'],
    ['less', '\u2212', 'core'],
    
    // Questions and negations
    ['yes', '\u2713', 'core'],
    ['no', '\u00d7', 'core'],
    ['not', '\u2298', 'core'],
    ['what', '?', 'core'],
    ['where', '\u2316', 'core'],
    ['when', '\u2315', 'core'],
    ['why', '\u2753', 'core'],
    ['how', '\u2754', 'core'],
    ['who', '\u263b', 'core'],
    ['which', '\u25c7', 'core'],
    
    // Time concepts
    ['now', '\u25cf', 'core'],
    ['later', '\u2192', 'core'],
    ['soon', '\u2194', 'core'],
    ['wait', '\u2317', 'core'],
    ['time', '\u23f1', 'core'],
    ['today', '\u25c6', 'core'],
    ['tomorrow', '\u2197', 'core'],
    ['yesterday', '\u2199', 'core'],
    
    // Quantities
    ['all', '\u2217', 'core'],
    ['some', '\u25c7', 'core'],
    ['none', '\u2205', 'core'],
    ['one', '1\ufe0f\u20e3', 'core'],
    ['two', '2\ufe0f\u20e3', 'core'],
    ['many', '\u2731', 'core'],
    ['few', '\u25c8', 'core']
  ],

  quick: [
    // Emergency and urgent phrases
    ['I need help', '\u270b', 'urgent'],
    ['Please stop', '\u25a0', 'urgent'],
    ['Call 911', '\u260e', 'urgent'],
    ['I am hurt', '\u271a', 'urgent'],
    ['I cannot breathe', '\u2637', 'urgent'],
    ['Call my caregiver', '\u260e', 'urgent'],
    ['Emergency', '\u274c', 'urgent'],
    ['Help me', '\u270b', 'urgent'],
    ['I am scared', '\u2623', 'urgent'],
    ['I need a doctor', '\u271a', 'urgent'],
    
    // Politeness
    ['Please', '\u270b', 'core'],
    ['Thank you', '\u2764', 'core'],
    ['You are welcome', '\u2713', 'core'],
    ['Sorry', '\u2639', 'feeling'],
    ['Excuse me', '\u270b', 'core'],
    ['Yes, please', '\u2713', 'core'],
    ['No, thank you', '\u00d7', 'core'],
    
    // Common requests
    ['I need a break', '\u2601', 'feeling'],
    ['Give me a minute', '\u25f7', 'core'],
    ["I don't know", '\u2026', 'core'],
    ['I need to go', '\u2192', 'action'],
    ['I want to rest', '\u262a', 'feeling'],
    ['I need water', '\u2248', 'core'],
    ['I need food', '\u25d3', 'feeling'],
    ['I need the bathroom', '\u2302', 'core'],
    
    // Communication
    ["I can't understand", '?', 'core'],
    ['Say it again', '\u21ba', 'core'],
    ['Slower, please', '\u2193', 'core'],
    ['Louder, please', '\u2191', 'core'],
    ['Speak up', '\u2191', 'core'],
    ['Not that', '\u21b6', 'core'],
    ['Say it differently', '\u21c4', 'core'],
    ['Repeat', '\u21ba', 'core'],
    
    // Preferences
    ['I like it', '\u2665', 'feeling'],
    ['I love it', '\u2764', 'feeling'],
    ['I dislike it', '\u2663', 'feeling'],
    ['I hate it', '\u2763', 'feeling'],
    ['It is good', '\u2600', 'feeling'],
    ['It is bad', '\u2601', 'feeling'],
    ['I am happy', '\u263a', 'feeling'],
    ['I am sad', '\u2639', 'feeling'],
    ['I am tired', '\u262a', 'feeling'],
    ['I am hungry', '\u25d3', 'feeling']
  ],

  more: [
    // Family members
    ['mom', '\u2665', 'people'],
    ['dad', '\u2665', 'people'],
    ['grandma', '\u263d', 'people'],
    ['grandpa', '\u263c', 'people'],
    ['sister', '\u2640', 'people'],
    ['brother', '\u2642', 'people'],
    ['aunt', '\u263d', 'people'],
    ['uncle', '\u263c', 'people'],
    ['cousin', '\u263b', 'people'],
    ['family', '\u263b', 'people'],
    
    // Caregivers and professionals
    ['caregiver', '\u271a', 'people'],
    ['teacher', '\u25d2', 'people'],
    ['therapist', '\u271a', 'people'],
    ['doctor', '\u271a', 'people'],
    ['nurse', '\u271a', 'people'],
    ['helper', '\u270b', 'people'],
    
    // Friends and social
    ['friend', '\u263b', 'people'],
    ['boy', '\u2642', 'people'],
    ['girl', '\u2640', 'people'],
    ['man', '\u2642', 'people'],
    ['woman', '\u2640', 'people'],
    ['child', '\u263c', 'people'],
    ['baby', '\u263c', 'people'],
    
    // Food and drinks
    ['food', '\u25d2', 'category'],
    ['pizza', '\u25d2', 'food'],
    ['burger', '\u25d2', 'food'],
    ['hot dog', '\u25d2', 'food'],
    ['sandwich', '\u25d2', 'food'],
    ['chicken', '\u25d2', 'food'],
    ['meat', '\u25d2', 'food'],
    ['fish', '\u25d2', 'food'],
    ['vegetables', '\u25d2', 'food'],
    ['salad', '\u25d2', 'food'],
    ['soup', '\u25d2', 'food'],
    ['bread', '\u25d2', 'food'],
    ['rice', '\u25d2', 'food'],
    ['pasta', '\u25d2', 'food'],
    ['cheese', '\u25d2', 'food'],
    ['eggs', '\u25d2', 'food'],
    
    // Drinks
    ['water', '\u2248', 'food'],
    ['juice', '\u2248', 'food'],
    ['milk', '\u2248', 'food'],
    ['soda', '\u2248', 'food'],
    ['coffee', '\u2248', 'food'],
    ['tea', '\u2248', 'food'],
    ['ice cream', '\u25d2', 'food'],
    ['cake', '\u25d2', 'food'],
    ['cookie', '\u25d2', 'food'],
    ['candy', '\u25d2', 'food'],
    ['chocolate', '\u25d2', 'food'],
    
    // Desserts and snacks
    ['fruit', '\u25d2', 'food'],
    ['apple', '\u25d2', 'food'],
    ['banana', '\u25d2', 'food'],
    ['orange', '\u25d2', 'food'],
    ['grapes', '\u25d2', 'food'],
    ['strawberry', '\u25d2', 'food'],
    ['peanut butter', '\u25d2', 'food'],
    ['jelly', '\u25d2', 'food'],
    ['chips', '\u25d2', 'food'],
    ['crackers', '\u25d2', 'food'],
    ['popcorn', '\u25d2', 'food'],
    
    // Places
    ['home', '\u2302', 'category'],
    ['school', '\u25a3', 'category'],
    ['work', '\u25a3', 'category'],
    ['park', '\u2600', 'category'],
    ['beach', '\u2600', 'category'],
    ['store', '\u25ce', 'category'],
    ['restaurant', '\u25d2', 'category'],
    ['hospital', '\u271a', 'category'],
    ['doctor office', '\u271a', 'category'],
    ['church', '\u265b', 'category'],
    ['library', '\u25d2', 'category'],
    ['gym', '\u2600', 'category'],
    ['pool', '\u2600', 'category'],
    ['movie theater', '\u266b', 'category'],
    ['mall', '\u25ce', 'category']
  ],

  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => [letter, '', 'letter'])
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClearvoiceConfig, VocabularyData };
}
