# Clearvoice AAC Enhanced

An enhanced version of the Clearvoice AAC (Augmentative and Alternative Communication) prototype with additional features for improved usability and personalization.

## Features

### Core Features (Original)
- **No-build, browser-based** - Open `index.html` in any modern browser
- **Stable core vocabulary** - Essential words organized by category
- **Quick phrases** - Pre-defined useful phrases for common situations
- **Word finder** - Search functionality to find words quickly
- **Spelling mode** - Build words letter by letter
- **Message composition** - Build messages with undo/clear functionality
- **Browser text-to-speech** - Native speech synthesis
- **Accessibility controls**:
  - Button size (Regular, Large, Extra Large)
  - Text size
  - High contrast mode
  - Reduced motion
  - Voice speed adjustment
  - Quiet mode (disables vibrations)

### Enhanced Features (New)

#### 1. **Message History**
- Automatically saves spoken messages
- View and replay past messages
- Delete individual history items
- Clear entire history
- Keyboard shortcut: `Ctrl/Cmd + H`

#### 2. **Favorites System**
- Save frequently used messages
- Quick access to saved phrases
- Delete individual favorites
- Clear all favorites
- Keyboard shortcut: `Ctrl/Cmd + F`
- Save current message: `Ctrl/Cmd + S`

#### 3. **Custom Vocabulary**
- Add your own words and phrases
- Custom symbols/emojis support
- Persistent across sessions
- Dedicated "Custom" tab

#### 4. **Dark Mode**
- Toggle between light and dark themes
- System preference detection
- Keyboard shortcut: `Ctrl/Cmd + D`

#### 5. **Enhanced Voice Control**
- Voice pitch adjustment
- Voice type selection (Default, Male, Female, Child)
- Improved speech synthesis

#### 6. **Improved UI/UX**
- Visual indicators for favorite words
- Better toast notifications with types (success, error, warning)
- Custom scrollbars
- Smooth animations and transitions
- Responsive design improvements

## Usage

1. **Open in browser**: Simply open `index.html` in a modern web browser
2. **Build messages**: Click on words to add them to your message
3. **Speak**: Click the "Speak" button or press `Ctrl/Cmd + Enter`
4. **Access features**:
   - Settings: Gear icon (⚙️)
   - History: Clock icon (⏳)
   - Favorites: Star icon (⭐)
   - Dark mode: Moon icon (🌙)
   - Quiet mode: Bell icon (🔔)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Speak current message |
| `Ctrl/Cmd + S` | Save to favorites |
| `Ctrl/Cmd + H` | Toggle history panel |
| `Ctrl/Cmd + F` | Toggle favorites panel |
| `Ctrl/Cmd + D` | Toggle dark mode |
| `Escape` | Close open panels |

## Technical Details

- **Pure HTML/CSS/JavaScript** - No build process required
- **Local Storage** - All data saved in browser
- **No server required** - Works offline
- **Privacy-first** - No data sent to servers
- **Responsive** - Works on mobile and desktop

## File Structure

```
clearvoice-enhanced/
├── index.html      # Main HTML file
├── app.js          # Application logic
├── styles.css      # Styles and themes
└── README.md       # This file
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

## Customization

### Adding Custom Words

1. Click the "+ Add Custom" button in the top right
2. Enter your word or phrase
3. Optionally add a symbol/emoji
4. Click "Add"
5. Your word will appear in the "Custom" tab

### Changing Voice Settings

1. Open Settings (⚙️)
2. Adjust:
   - Voice speed: Controls speech rate
   - Voice pitch: Controls speech pitch
   - Voice type: Select voice gender/age

### Managing History and Favorites

- **History**: Automatically saves spoken messages
- **Favorites**: Manually save messages for quick access
- Both can be cleared individually or entirely

## Accessibility

- **High contrast mode**: Improves visibility
- **Large buttons/text**: Easier targeting and reading
- **Reduced motion**: Disables animations
- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: ARIA labels and roles
- **Quiet mode**: Disables haptic feedback

## Development

This is a prototype application. For production use:

1. **Testing**: Thoroughly test with target users
2. **Customization**: Adapt vocabulary to user needs
3. **Backup**: Regularly export important data
4. **Security**: Ensure browser security settings are appropriate

## License

This project is based on the original Clearvoice AAC MVP and is provided as-is for demonstration purposes.

## Credits

Original concept and implementation by nebula-vibecodes.
Enhanced version with additional features.
