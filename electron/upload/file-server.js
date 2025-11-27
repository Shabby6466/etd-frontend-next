const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3005;

// Enable CORS for localhost:3004
app.use(cors({
    origin: 'http://localhost:3004',
    credentials: true
}));

app.use(express.json());

// Get the xml_draft directory path
const getXmlDraftPath = () => {
    return path.join(os.homedir(), 'AppData', 'Local', 'xml_draft');
};

// Get list of XML files
app.get('/api/files', (req, res) => {
    try {
        const draftDir = getXmlDraftPath();

        if (!fs.existsSync(draftDir)) {
            return res.json({ success: true, files: [], count: 0 });
        }

        const files = fs.readdirSync(draftDir)
            .filter(file => file.endsWith('.xml'))
            .map(filename => ({
                filename,
                path: path.join(draftDir, filename)
            }));

        res.json({ success: true, files, count: files.length });
    } catch (error) {
        console.error('Error reading files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get content of a specific XML file
app.get('/api/files/:filename', (req, res) => {
    try {
        const draftDir = getXmlDraftPath();
        const filepath = path.join(draftDir, req.params.filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        const content = fs.readFileSync(filepath, 'utf8');
        res.json({ success: true, content, filename: req.params.filename });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Move file to completed folder
app.post('/api/files/:filename/complete', (req, res) => {
    try {
        const draftDir = getXmlDraftPath();
        const completeDir = path.join(os.homedir(), 'AppData', 'Local', 'xml_complete');

        // Ensure complete directory exists
        if (!fs.existsSync(completeDir)) {
            fs.mkdirSync(completeDir, { recursive: true });
        }

        const sourcePath = path.join(draftDir, req.params.filename);
        const destPath = path.join(completeDir, req.params.filename);

        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        fs.renameSync(sourcePath, destPath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete file
app.delete('/api/files/:filename', (req, res) => {
    try {
        const draftDir = getXmlDraftPath();
        const filepath = path.join(draftDir, req.params.filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        fs.unlinkSync(filepath);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`File server running on http://localhost:${PORT}`);
});
