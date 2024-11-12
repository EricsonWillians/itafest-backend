# 🎉 Itafest Backend

A modern event and local business discovery platform for Itajubá, MG, Brazil. Built with Deno and Firebase.

## 📋 Overview

Itafest serves as a central hub for local businesses to publish events and promotional content, allowing the community to discover what's happening in Itajubá. The platform features a freemium model where basic listings are free, but businesses can pay for enhanced visibility and promotional features.

### 🎯 Key Features

- **Event Management**: Local businesses can create and manage events
- **Business Profiles**: Detailed business listings with contact information
- **Advertisement System**: Promotional content management
- **Analytics**: Track views, engagement, and user interactions
- **Authentication**: Secure business account management

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.37 or higher
- [Firebase](https://firebase.google.com/) project
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/itafest-backend.git
cd itafest-backend
```

2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your Firebase credentials:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
...
```

3. Install dependencies
```bash
deno cache --reload src/app.ts
```

### Development

Start the development server:
```bash
deno task dev
```

The server will start at `http://localhost:8000`

## 🏗️ Project Structure

```
📁 itafest/
├── 📁 src/
│   ├── 📁 api/
│   │   ├── 📁 controllers/    # Request handlers
│   │   ├── 📁 middlewares/    # Custom middlewares
│   │   └── 📁 routes/         # API route definitions
│   ├── 📁 services/           # Business logic
│   ├── 📁 types/             # TypeScript interfaces
│   ├── 📁 utils/             # Helper functions
│   ├── 📁 config/            # Configuration files
│   └── app.ts                # Application entry point
├── 📁 firebase/              # Firebase configuration
├── 📁 scripts/               # Utility scripts
├── 📁 public/                # Static files
└── configuration files
```

## 🔐 Security

- Firebase Authentication for secure access
- Firestore security rules for data protection
- Storage rules for secure file uploads
- Rate limiting on API endpoints

## 📦 API Endpoints

### Events
- `GET /events` - List events
- `POST /events` - Create event
- `GET /events/:id` - Get event details
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Businesses
- `GET /businesses` - List businesses
- `POST /businesses` - Register business
- `GET /businesses/:id` - Get business details
- `PUT /businesses/:id` - Update business
- `DELETE /businesses/:id` - Delete business

### Advertisements
- `GET /ads` - List advertisements
- `POST /ads` - Create advertisement
- `GET /ads/:id` - Get ad details
- `PUT /ads/:id` - Update ad
- `DELETE /ads/:id` - Delete ad

## 💻 Development

### Scripts

- `deno task dev` - Start development server
- `deno task start` - Start production server
- `deno task test` - Run tests

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 API Documentation

Detailed API documentation is available in [API.md](./API.md)

## 🚀 Deployment

1. Configure Firebase project
```bash
firebase init
```

2. Deploy Firebase configuration
```bash
firebase deploy
```

3. Deploy Deno application (example using Deno Deploy):
```bash
deno task deploy
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_API_KEY` | Firebase API Key | Yes |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `PORT` | Server Port | No (default: 8000) |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 👥 Contact

- Developer - [Your Name](mailto:your.email@example.com)
- Project Link: [https://github.com/yourusername/itafest-backend](https://github.com/yourusername/itafest-backend)

## 🙏 Acknowledgments

- [Deno](https://deno.land/)
- [Firebase](https://firebase.google.com/)
- [Oak](https://oakserver.github.io/oak/)