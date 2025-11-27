# ETD Electron Application

This is the Electron desktop application for the Emergency Travel Document (ETD) system. It provides a standalone desktop interface with two main screens: login and data input.

## Features

- **Login Screen**: Secure authentication interface matching the web application design
- **Data Input Screen**: Comprehensive form for entering citizen information based on the CitizenForm component
- **Offline Capability**: Works without internet connection for data entry
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## Project Structure

```
electron/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login interface
│   │   └── DataInputScreen.tsx  # Citizen data input form
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Global styles with Tailwind
│   └── index.tsx                # React entry point
├── public/
│   └── index.html               # HTML template
├── main.js                      # Electron main process
├── preload.js                   # Electron preload script
├── package.json                 # Dependencies and scripts
├── webpack.config.js            # Webpack configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Navigate to the electron directory:
   ```bash
   cd electron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

This will start both the webpack dev server and the Electron app in development mode.

### Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run dev:web` - Start only the webpack dev server
- `npm run build:web` - Build the React app for production
- `npm run build` - Build the complete Electron app
- `npm run build:win` - Build for Windows
- `npm run build:mac` - Build for macOS
- `npm run build:linux` - Build for Linux

## Building for Production

To create distributable packages:

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Built applications will be available in the `dist/` directory.

## Form Fields

The data input screen includes all the fields from the original CitizenForm:

### Required Fields
- Citizen ID (13 digits)
- First Name
- Last Name
- Father's Name
- Mother's Name
- Gender
- Date of Birth
- Birth Country
- Birth City
- City
- Profession
- Address
- Departure Date
- Requested By
- Photograph (image upload)

### Optional Fields
- Height
- Eye Color
- Hair Color
- Transport Mode
- Investor
- Reason for Deport
- Amount
- Currency

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **React**: User interface library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Webpack**: Module bundler

## Notes

- The application currently uses mock authentication in the login screen
- Form submission is simulated and shows success messages
- Image upload processing includes file validation and base64 conversion
- The design closely matches the original web application styling
