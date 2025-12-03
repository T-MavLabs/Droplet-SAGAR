# Droplet - SAGAR Data Entry Software

**Droplet** is an Excel-like data entry application designed for scientists to use on portable field devices. Optimized for **14cm × 10cm screen** (width × height) running on **Alpine OS with Arduino-based hardware**. This application allows users to create custom header columns and enter data in a spreadsheet-like interface during on-site field visits. The device also includes **DropletDesk**, an AI-powered marine biology taxonomy assistant powered by Gemini AI.

## Hardware Specifications

- **Screen Size**: 14cm (width) × 10cm (height/length)
- **Operating System**: Alpine Linux
- **Hardware Platform**: Arduino-based embedded system
- **Display Resolution**: ~827-1102px × ~591-787px (at 150-200 DPI)
- **Orientation**: Landscape (width > height)
- **Aspect Ratio**: 1.4:1 (landscape)

## Features

- ✅ **Excel-like Interface**: Familiar spreadsheet layout with cells, rows, and columns
- ✅ **Dynamic Column Management**: Add, rename, and delete columns on the fly
- ✅ **Row Management**: Add and delete rows as needed
- ✅ **Data Entry**: Easy cell editing with keyboard and touch support
- ✅ **Alpine OS Optimized**: Optimized for 14cm × 10cm screen (width × height)
- ✅ **DropletDesk AI Assistant**: Voice-to-text AI assistant for marine taxonomy queries using Gemini AI
- ✅ **Virtual Keyboard**: On-screen keyboard optimized for touch input
- ✅ **Large Touch Targets**: 48-56px minimum for easy field use
- ✅ **Export Functionality**: Export data to Excel (.xlsx) or CSV format
- ✅ **Data Ingestion**: Ingest data to DataProcessingEngine with quality control
- ✅ **Quality Reports**: View comprehensive quality reports with metrics and recommendations
- ✅ **Keyboard Navigation**: Full keyboard support for efficient data entry
- ✅ **Portrait Lock**: UI optimized for portrait orientation

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Install Dependencies**
   ```bash
   npm install --ignore-scripts
   ```
   Note: Using `--ignore-scripts` to avoid Electron SSL certificate issues during installation.

2. **Run as Web Application (Recommended for now)**
   ```bash
   npm start
   ```
   This will start the React development server and open the app in your browser.
   The app works perfectly as a web application and can be used on tablets via browser.

3. **Build for Production (Web)**
   ```bash
   npm run build
   ```
   This creates an optimized production build that can be deployed to a web server.

### Supabase Integration

The application can sync data entry files, notes, and filename changes to Supabase for cloud storage and backup.

### Configuration

1. **Get Supabase Credentials:**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to Settings → API
   - Copy your Project URL and anon/public key

2. **Set Environment Variables:**
   Create a `.env` file in the project root:
   ```bash
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Supabase Setup:**
   
   **Step 1: Create Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `raw-uploads`
   - Set it as **Private** (not public)
   
   **Step 2: Create Droplet_Notes Table**
   - Run the SQL script: `create_droplet_notes_table.sql` in your Supabase SQL Editor
   - This creates the table for storing notes
   - Structure:
     - `id` (BIGSERIAL PRIMARY KEY)
     - `filename` (TEXT NOT NULL, UNIQUE) - Links notes to data entry files
     - `notes` (TEXT) - The notes content
     - `device_name` (TEXT, DEFAULT 'Droplet') - Device identifier
     - `created_at` (TIMESTAMPTZ)
     - `updated_at` (TIMESTAMPTZ)
   
   **Step 3: Set Up Storage Policies (IMPORTANT)**
   - Run the SQL script: `supabase_storage_policies.sql` in your Supabase SQL Editor
   - This allows the app to upload files to the `raw-uploads` bucket
   - **Without this, you'll get "row-level security policy" errors**
   
   **Note**: The app stores Excel files in `raw-uploads/data-entry/` folder and notes in `Droplet_Notes` table. No metadata table is used.

### Features

- **Notes Sync**: Notes are automatically synced to Supabase when added or modified
- **Filename Updates**: When a filename is edited in the app, it's updated in Supabase
- **File Data Sync**: Complete file data (columns, rows, notes) is synced on save/export
- **Quality Report Sync**: Quality reports from ingestion are stored in Supabase metadata

### How It Works

1. **Notes**: When you type in the notes section, changes are automatically synced to Supabase in the `Droplet_Notes` table, linked by filename
2. **Filename**: When you edit the filename, the app updates both `Droplet_Notes.filename` and `metadata_sagar.original_filename` in Supabase
3. **File Save**: When you save or export a file, complete metadata is synced to Supabase (metadata in `metadata_sagar`, notes in `Droplet_Notes`)
4. **Ingestion**: After data ingestion, the quality report is stored in Supabase along with file metadata

**Note**: If Supabase is not configured, the app will continue to work normally with local storage only. All Supabase operations are non-blocking and won't interrupt the user experience if they fail.

## Data Ingestion Setup

To enable data ingestion and quality reporting:

1. **Start the DataProcessingEngine API**:
   ```bash
   cd ../DATA/DataProcessingEngine
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Configure API URL** (optional):
   - Create a `.env` file in the Droplet directory
   - Add: `REACT_APP_PROCESSING_API_URL=http://localhost:8000`
   - Default is `http://localhost:8000` if not specified

3. **Ingest Data**:
   - Enter data in the spreadsheet
   - Click the "Ingest" button in the toolbar
   - Data will be converted to CSV and sent to the processing engine
   - Quality report will be generated and attached to the entry
   - View quality reports from the dashboard

### Electron Desktop App (Optional)

To package as a desktop .exe file, you'll need to install Electron:

```bash
# If you have network/SSL issues, try:
npm install electron electron-is-dev concurrently wait-on --save-dev --ignore-scripts
npm install electron-builder --save-dev

# Then uncomment the code in main.js and add these scripts to package.json:
# "electron": "electron .",
# "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
# "build-electron": "npm run build && electron-builder"
```

**Note**: The app works perfectly as a web application and doesn't require Electron for basic functionality. For Alpine OS deployment, serve the built files using a lightweight web server.

### Alpine OS Deployment Guide

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Transfer to Alpine OS device:**
   ```bash
   scp -r build/* user@alpine-device:/var/www/localhost/htdocs/
   ```

3. **Configure web server (example with lighttpd):**
   ```bash
   # Install lighttpd on Alpine OS
   apk add lighttpd
   
   # Configure lighttpd
   echo 'server.document-root = "/var/www/localhost/htdocs"' >> /etc/lighttpd/lighttpd.conf
   
   # Start web server
   rc-service lighttpd start
   ```

4. **Configure browser for kiosk mode:**
   - Use Chromium or Firefox in fullscreen mode
   - Lock orientation to portrait
   - Disable address bar and navigation
   - Set as startup application

5. **Screen Configuration:**
   - Ensure display is set to landscape mode (width 14cm × height 10cm)
   - Resolution should match 14cm × 10cm physical dimensions
   - Touch calibration may be required for accurate input

## Usage

### Creating Columns

1. Click the **"➕ Add Column"** button in the toolbar
2. A new column will appear with a default name (e.g., "Column 2")
3. Click on the column header to rename it
4. Click the **✕** button on a column header to delete it

### Entering Data

1. Click on any cell to select it
2. Start typing to enter data
3. Press **Enter** to move to the next row
4. Press **Tab** to move to the next column
5. Use arrow keys to navigate between cells

### Managing Rows

1. Click **"➕ Add Row"** to add a new row
2. Click the **✕** button in the row number to delete a row

### Exporting Data

1. Click **"📊 Export Excel"** to save as .xlsx file
2. Click **"📄 Export CSV"** to save as .csv file
3. Files will be saved to your default download location

## Keyboard Shortcuts

- **Arrow Keys**: Navigate between cells
- **Enter**: Move to next row (creates new row if at bottom)
- **Tab**: Move to next column
- **Shift + Tab**: Move to previous column
- **Escape**: Cancel editing

## Tablet Features

- Large touch targets (minimum 44px)
- Touch-friendly interface
- Responsive design for different screen sizes
- Optimized for portrait and landscape orientations

## Project Structure

```
Droplet/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Spreadsheet.js  # Main spreadsheet component
│   │   ├── Spreadsheet.css # Spreadsheet styles
│   │   ├── DropletDesk.js  # AI assistant component
│   │   └── DropletDesk.css # DropletDesk styles
│   ├── App.js              # Main app component
│   ├── App.css             # App styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── main.js                 # Electron main process
├── preload.js              # Electron preload script
└── package.json            # Project configuration
```

## Building for Distribution

### Windows (.exe)

```bash
npm run build-electron
```

The executable will be created in the `dist` folder.

### Customization

You can customize the build configuration in `package.json` under the `build` section:

- Change app name: `productName`
- Change app ID: `appId`
- Add icons: Place icon files in `build/` folder
- Modify installer options in the `win` section

## Technologies Used

- **React**: UI framework
- **Electron**: Desktop application framework
- **XLSX**: Excel file generation
- **File-Saver**: File download functionality
- **React Data Grid**: Spreadsheet component (if needed)

## Troubleshooting

### App won't start
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be v16+)

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for any error messages in the console

### Export not working
- Make sure you have data entered in the spreadsheet
- Check browser/Electron console for errors

## License

MIT License

## Support

For issues or questions, please contact the development team.
