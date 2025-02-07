# Wallpaper4Free 🖼️

A modern, feature-rich wallpaper sharing platform built with JavaScript and Node.js. Users can upload, download, and manage high-quality wallpapers with a sleek and responsive interface.

## 🌟 Features

- **User Authentication**
  - Email/Password registration and login
  - Discord OAuth integration
  - JWT-based authentication

- **Wallpaper Management**
  - Upload wallpapers with drag-and-drop support
  - Categorize wallpapers
  - Add descriptions and metadata
  - Track download statistics

- **User Profiles**
  - Customizable user profiles
  - Upload profile pictures
  - View upload history
  - Track download statistics

- **Search & Filter**
  - Search wallpapers by name
  - Filter by category
  - Sort by recent, popular, or name
  - Real-time search results

- **Interactive UI**
  - Responsive grid layout
  - Preview modal with download options
  - Smooth animations and transitions
  - Toast notifications

## 🛠️ Technology Stack

- **Frontend**
  - HTML5
  - CSS3 (Tailwind CSS)
  - JavaScript (Vanilla)
  - Font Awesome Icons

- **Backend**
  - Node.js
  - Express.js
  - JWT Authentication
  - Multer (File uploads)
  - CORS

- **Storage**
  - Local JSON storage
  - File system for wallpapers

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/QuizySolution/wallpaper4free.git
   cd wallpaper4free
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies (if any)
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   - Edit `.env` file in the backend directory
   - Edit the following variables:
     ```
     PORT=3001
     JWT_SECRET=your_jwt_secret
     DISCORD_CLIENT_ID=your_discord_client_id
     DISCORD_CLIENT_SECRET=your_discord_client_secret
     DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
     ```

4. **Start the servers**
   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend server
   cd ../frontend
   npm start
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

## 📸 Screenshots

[Add your application screenshots here]

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- File upload validation
- CORS protection
- Input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**403_FORBIDDEN** - [QuizySolution](https://github.com/Quizy-Solutions)

## 🙏 Acknowledgments

- Font Awesome for icons
- Tailwind CSS for styling
- Discord for OAuth integration
- The open-source community

---
⭐️ Star this repo if you find it helpful!
