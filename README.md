# Clearvoice AAC - Enhanced Version

## Overview

**Clearvoice AAC** is a no-build, browser-based Augmentative and Alternative Communication (AAC) prototype. This enhanced version includes:

- **160+ vocabulary tiles** across multiple categories
- **Custom image support** for personal photos on tiles
- **Improved accessibility** with high contrast, large text, and reduced motion options
- **Responsive design** that works on mobile and desktop devices
- **Text-to-speech** using browser-native speech synthesis

## Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in a modern browser (Chrome, Firefox, Safari, Edge)
3. **Start communicating!**

No build process required - it's pure HTML, CSS, and JavaScript.

## Features

### Vocabulary Categories

- **Core**: 60+ everyday words and essential verbs
- **Quick Phrases**: 40+ pre-built phrases for common situations
- **More**: 60+ personal vocabulary including family, food, places, and activities
- **Spell**: Full alphabet for spelling custom words

### Custom Images

Add your own photos to any tile by editing `config.js`:

```javascript
customImages: {
  "mom": "images/mom.jpg",
  "dad": "images/dad.jpg",
  "grandma": "images/grandma.jpg",
  "pizza": "images/favorite-pizza.jpg"
}
```

### How to Add Custom Photos

1. **Create an `images` folder** in the project directory
2. **Add your photos** (JPG, PNG, or WebP format recommended)
3. **Edit `config.js`** and set the image paths:
   ```javascript
   customImages: {
     "mom": "images/mom.jpg",
     "dad": "images/dad.jpg"
   }
   ```
4. **Refresh the browser** - your photos will appear on the corresponding tiles

**Recommended image specifications:**
- Square aspect ratio (1:1) works best
- Minimum size: 200x200 pixels
- Format: JPG, PNG, or WebP
- File size: Under 1MB for fast loading

### Accessibility Features

- **Button Size**: Regular, Large, or Extra Large
- **Text Size**: Regular or Large
- **High Contrast Mode**: Improved visibility
- **Reduced Motion**: For users sensitive to animations
- **Quiet Mode**: Disables vibration feedback
- **Speech Rate Control**: Adjust the speed of text-to-speech

### Keyboard Shortcuts

- `Ctrl + Enter` or `Cmd + Enter`: Speak current message
- `Escape`: Close settings panel

## File Structure

```
PROJECT-CLEARVOICE-V1/
├── index.html          # Main HTML file
├── app.js              # Application logic
├── config.js           # Vocabulary and image configuration
├── styles.css          # All styles and themes
├── images/             # (Optional) Custom image folder
│   ├── mom.jpg         # Example custom images
│   ├── dad.jpg         # Add your own photos here
│   └── ...
└── README.md           # This file
```

## Configuration

### Vocabulary Customization

Edit `config.js` to modify vocabulary. The file contains four main categories:

- `core`: Essential everyday words
- `quick`: Pre-built phrases
- `more`: Personal vocabulary (people, places, foods, etc.)
- `letters`: Alphabet for spelling

Each tile is defined as an array: `["text", "symbol", "type"]`

### Adding New Tiles

To add a new tile, simply add it to the appropriate category array:

```javascript
more: [
  // Existing tiles...
  ['new word', '\u2600', 'category'],
]
```

### Image Configuration

The `ClearvoiceConfig` object in `config.js` provides methods for managing images:

- `getImageUrl(text)`: Returns the image URL for a given tile text
- `hasImage(text)`: Checks if a tile has a custom image
- `customImages`: Object mapping tile text to image paths

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Supported with responsive design

## Performance Tips

1. **Optimize images**: Compress photos before adding them
2. **Use WebP format**: Better compression than JPG/PNG
3. **Limit image count**: Too many large images may slow down the app
4. **Test on target devices**: Ensure good performance on the devices you'll use

## Customization Workflow

### For Personal Use

1. Fork this repository
2. Clone to your local machine
3. Add your custom images to the `images/` folder
4. Update `config.js` with your image paths
5. Open `index.html` in your browser

### For Distribution

1. Customize vocabulary and images
2. Test on all target devices
3. Zip the entire folder
4. Distribute to users
5. Users can open `index.html` directly in their browser

## Development

### Adding New Features

The code is organized into three main files:

- **`index.html`**: Structure and accessibility markup
- **`app.js`**: Application logic and event handlers
- **`config.js`**: Data and configuration
- **`styles.css`**: All styling and responsive design

### Testing

1. Open `index.html` in multiple browsers
2. Test on different screen sizes
3. Verify keyboard navigation
4. Test with screen readers
5. Check high contrast and large text modes

## Accessibility Best Practices

- All interactive elements are keyboard accessible
- ARIA attributes are used for screen readers
- Focus indicators are visible
- Color contrast meets WCAG guidelines
- Reduced motion option available

## Troubleshooting

### Images Not Showing

- Check that the image path in `config.js` is correct
- Ensure the image file exists in the specified location
- Verify the image format is supported (JPG, PNG, WebP)
- Check browser console for errors

### Speech Not Working

- Ensure your browser supports the Web Speech API
- Check that your device has text-to-speech voices installed
- Try a different browser

### App Not Loading

- Make sure all files are in the same directory
- Check that you're opening `index.html` directly (not through a file:// URL on some browsers)
- Try using a local server for development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available for personal and educational use.

## Credits

- Built with pure HTML, CSS, and JavaScript
- No external dependencies required
- Uses browser-native APIs for speech synthesis

## Contact

For questions or support, please open an issue in the GitHub repository.

---

**Note**: This is a communication aid prototype, not a clinical AAC device. For clinical use, consult with a speech-language pathologist.
