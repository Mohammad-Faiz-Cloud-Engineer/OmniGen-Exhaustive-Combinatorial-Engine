const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
let pythonProcess = null;
let intervalId = null;

app.use(express.static('public'));

// Serve generated files for download
app.get('/download/:type', (req, res) => {
    const type = req.params.type;
    const fileMap = {
        'txt': 'output.txt',
        'md': 'output.md',
        'pdf': 'output.pdf'
    };

    if (fileMap[type]) {
        const filePath = path.join(__dirname, fileMap[type]);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found');
        }
    } else {
        res.status(400).send('Invalid file type');
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('start-generation', (config) => {
        if (pythonProcess) {
            socket.emit('error', 'Generation already in progress');
            return;
        }

        const { charset, min, max } = config;

        // Reset files if they exist (optional, mostly handled by 'w' mode in python)

        console.log(`Starting generation: charset=${charset} min=${min} max=${max}`);

        pythonProcess = spawn('python3', [
            '-u', // Unbuffered output
            'generator.py',
            '--charset', charset,
            '--min', min.toString(),
            '--max', max.toString()
        ]);

        socket.emit('status', { state: 'running' });

        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            // Check if output is a number (count)
            if (!isNaN(output)) {
                io.emit('progress', { count: parseInt(output) });
            } else {
                console.log(`Python: ${output}`);
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
            socket.emit('error', data.toString());
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            clearInterval(intervalId);
            pythonProcess = null;
            io.emit('status', { state: 'stopped' });
            io.emit('download-ready', true);
        });

        // Monitor file sizes
        intervalId = setInterval(() => {
            try {
                const sizes = {
                    txt: getFileSize('output.txt'),
                    md: getFileSize('output.md'),
                    pdf: getFileSize('output.pdf')
                };
                io.emit('file-sizes', sizes);
            } catch (e) {
                console.error("Error reading file sizes", e);
            }
        }, 500);
    });

    socket.on('stop-generation', () => {
        if (pythonProcess) {
            console.log('Stopping generation...');
            pythonProcess.kill('SIGTERM');
            // 'close' event will handle the rest
        }
    });

    socket.on('disconnect', () => {
        // Optional: stop process if client disconnects? 
        // For now, let's keep it running unless explicitly stopped.
    });
});

function getFileSize(filename) {
    try {
        const stats = fs.statSync(path.join(__dirname, filename));
        return formatBytes(stats.size);
    } catch (err) {
        return '0 B';
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
