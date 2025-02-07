require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create necessary directories and files
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}
if (!fs.existsSync('data/users.json')) {
    fs.writeFileSync('data/users.json', '[]');
}
if (!fs.existsSync('data/wallpapers.json')) {
    fs.writeFileSync('data/wallpapers.json', '[]');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper functions
const readJsonFile = (filename) => {
    const data = fs.readFileSync(`data/${filename}.json`);
    return JSON.parse(data);
};

const writeJsonFile = (filename, data) => {
    fs.writeFileSync(`data/${filename}.json`, JSON.stringify(data, null, 2));
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Auth Routes
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        let users = readJsonFile('users');
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        writeJsonFile('users', users);

        const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, accessToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = readJsonFile('users');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, accessToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Discord OAuth Routes
app.get('/auth/discord', (req, res) => {
    const scope = 'identify email';
    const state = Math.random().toString(36).substring(7);
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}&state=${state}`);
});

app.get('/auth/discord/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        // Exchange code for token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: DISCORD_REDIRECT_URI,
                scope: 'identify email',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        // Get user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`,
            },
        });

        const discordUser = userResponse.data;
        let users = readJsonFile('users');
        let user = users.find(u => u.discordId === discordUser.id);

        if (!user) {
            user = {
                id: uuidv4(),
                discordId: discordUser.id,
                email: discordUser.email,
                name: discordUser.username,
                avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
                createdAt: new Date().toISOString()
            };
            users.push(user);
            writeJsonFile('users', users);
        }

        const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        
        // Redirect to frontend with token in hash
        res.redirect(`http://localhost:5500/frontend/index.html#token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
        console.error('Discord auth error:', error);
        res.redirect(`http://localhost:5500/frontend/index.html#error=${encodeURIComponent('Authentication failed')}`);
    }
});

// Add profile endpoint
app.get('/profile/:username', (req, res) => {
    try {
        const users = readJsonFile('users');
        const user = users.find(u => u.name.toLowerCase() === req.params.username.toLowerCase());
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const wallpapers = readJsonFile('wallpapers')
            .filter(w => w.userId === user.id);
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            user: userWithoutPassword, 
            wallpapers,
            stats: {
                totalWallpapers: wallpapers.length,
                totalDownloads: wallpapers.reduce((acc, w) => acc + (w.downloads || 0), 0),
                joinedDate: user.createdAt
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update wallpaper endpoint to include category and downloads
app.post('/wallpapers', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const { name, description, category } = req.body;
        const wallpapers = readJsonFile('wallpapers');
        
        const newWallpaper = {
            id: uuidv4(),
            name,
            description,
            category,
            imagePath: `/uploads/${req.file.filename}`,
            userId: req.user.id,
            downloads: 0,
            createdAt: new Date().toISOString()
        };
        
        wallpapers.push(newWallpaper);
        writeJsonFile('wallpapers', wallpapers);
        
        res.json(newWallpaper);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add download endpoint
app.post('/wallpapers/:id/download', async (req, res) => {
    try {
        const wallpapers = readJsonFile('wallpapers');
        const wallpaper = wallpapers.find(w => w.id === req.params.id);
        
        if (!wallpaper) {
            return res.status(404).json({ error: 'Wallpaper not found' });
        }

        wallpaper.downloads = (wallpaper.downloads || 0) + 1;
        writeJsonFile('wallpapers', wallpapers);
        
        res.json({ success: true, downloads: wallpaper.downloads });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/wallpapers', (req, res) => {
    try {
        const { sort, userId } = req.query;
        let wallpapers = readJsonFile('wallpapers');
        
        if (userId) {
            wallpapers = wallpapers.filter(w => w.userId === userId);
        }
        
        if (sort === 'recent') {
            wallpapers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'name') {
            wallpapers.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        res.json(wallpapers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/users/:userId', (req, res) => {
    try {
        const users = readJsonFile('users');
        const user = users.find(u => u.id === req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const wallpapers = readJsonFile('wallpapers')
            .filter(w => w.userId === user.id);
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, wallpapers });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 