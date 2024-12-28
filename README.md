# 🎉 Itafest Backend

A modern event and local business discovery platform for Itajubá, MG, Brazil. Built with Deno and Firebase.

## 📋 Overview

Itafest is a comprehensive platform that serves as a central hub for local businesses to publish events, promotional content, and engage with the community. It allows users to discover what's happening in Itajubá, interact with businesses, and participate in local events. The platform features a freemium model where basic listings are free, but businesses can pay for enhanced visibility and promotional features.

### 🎯 Key Features

- **Event Management**: Create, manage, and schedule events with support for recurring occurrences.  
- **Business Profiles**: Detailed business listings with contact information, media galleries, and promotions.  
- **Advertisement System**: Promotional content management with various placement options.  
- **Analytics**: Track views, engagement, and user interactions with comprehensive analytics.  
- **Authentication & Authorization**: Secure account management with role-based access control.  
- **User Interaction**: Users can comment, review, and message businesses.  
- **Notifications**: Real-time notifications for events, messages, and system alerts.  
- **Payment Integration**: Secure payment processing for premium features and subscriptions.  
- **Feedback & Reporting**: Users can provide feedback and report inappropriate content.  
- **Favorites & Bookmarks**: Users can save events and businesses for later.  

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.37 or higher
- [Firebase](https://firebase.google.com/) project with Admin SDK credentials
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ericsonwillians/itafest-backend.git
   cd itafest-backend
   ```

2. **Set up Firebase Admin SDK credentials**

   - Go to your Firebase Console > **Project Settings** > **Service Accounts**  
   - Click **"Generate New Private Key"** to download your service account JSON file  
   - Save the file securely (**do not commit** this file to version control)  
   - Set the environment variable to point to your service account file:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
     ```
   - In some deployment environments (e.g., CI/CD, cloud hosting), you might set this through a provider-specific secure store, rather than an `export`.

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit your `.env` file to include Firebase config and other environment variables:
   ```env
   # Application Settings
   DENO_ENV=development   # or "production"
   PORT=8000
   SKIP_AUTH=false        # set to true if you want to skip auth in development

   # Firebase Configuration (Web credentials)
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Payment Gateway (optional)
   PAYMENT_GATEWAY_KEY=your_payment_key
   ```

4. **Install dependencies**

   ```bash
   deno cache --reload src/app.ts
   ```

### Development

Start the development server:

```bash
deno task dev
```

The server will start at `http://localhost:8000`.

### Production

For production deployment:

```bash
deno task prod
```

### Important Security Notes

- **Never commit** your service account JSON file to version control.  
- Store the `GOOGLE_APPLICATION_CREDENTIALS` environment variable securely in your production environment.  
- Ensure proper Firebase Security Rules are configured for your Firestore and Storage.  
- Review the Firebase Admin SDK initialization in `src/utils/firebase-admin.ts` (or equivalent file) for environment-specific configurations.  

## 🏗️ Project Structure

```
📁 itafest/
├── 📁 src/
│   ├── 📁 api/
│   │   ├── 📁 controllers/    # Request handlers
│   │   │   ├── ad.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── business.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── feedback.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   └── media.controller.ts
│   │   ├── 📁 middlewares/    # Custom middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   └── 📁 routes/         # API route definitions
│   │       ├── ad.routes.ts
│   │       ├── analytics.routes.ts
│   │       ├── auth.routes.ts
│   │       ├── business.routes.ts
│   │       ├── event.routes.ts
│   │       ├── notification.routes.ts
│   │       ├── payment.routes.ts
│   │       ├── subscription.routes.ts
│   │       ├── user.routes.ts
│   │       ├── feedback.routes.ts
│   │       ├── report.routes.ts
│   │       └── media.routes.ts
│   ├── 📁 services/           # Business logic
│   │   ├── ad.service.ts
│   │   ├── analytics.service.ts
│   │   ├── auth.service.ts
│   │   ├── business.service.ts
│   │   ├── event.service.ts
│   │   ├── notification.service.ts
│   │   ├── payment.service.ts
│   │   ├── subscription.service.ts
│   │   ├── user.service.ts
│   │   ├── feedback.service.ts
│   │   ├── report.service.ts
│   │   └── media.service.ts
│   ├── 📁 types/              # TypeScript interfaces
│   │   ├── ad.types.ts
│   │   ├── analytics.types.ts
│   │   ├── business.types.ts
│   │   ├── event.types.ts
│   │   ├── notification.types.ts
│   │   ├── payment.types.ts
│   │   ├── subscription.types.ts
│   │   ├── user.types.ts
│   │   ├── feedback.types.ts
│   │   ├── report.types.ts
│   │   ├── media.types.ts
│   │   ├── comment.types.ts
│   │   ├── role.types.ts
│   │   ├── error.types.ts
│   │   └── session.types.ts
│   ├── 📁 utils/              # Helper functions
│   │   ├── constants.ts
│   │   ├── logger.ts
│   │   ├── validator.ts
│   │   ├── firebase-admin.ts  # Firebase Admin initialization
│   │   └── error-handler.ts
│   ├── 📁 config/             # Configuration files
│   │   ├── env.config.ts
│   │   └── firebase.config.ts
│   └── app.ts                 # Application entry point
├── 📁 firebase/               # Firebase configuration
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
├── 📁 scripts/                # Utility scripts
│   ├── deploy.ts
│   ├── seed-data.ts
│   └── backup.ts
├── 📁 public/                 # Static files
│   └── assets
├── .env.example               # Environment variable example
├── deno.json                  # Deno configuration
├── deno.lock                  # Dependency lock file
├── import_map.json            # Import map for module aliases
├── firebase.json              # Firebase project configuration
├── README.md                  # Project documentation
├── LICENSE                    # License information
└── other configuration files
```

## 🔐 Security

- **Authentication & Authorization**: Firebase Authentication with role-based access control.  
- **Firestore Security Rules**: Granular access control for each collection and document.  
- **Storage Rules**: Secure media file uploads with proper permissions.  
- **Rate Limiting**: Implemented on API endpoints to prevent abuse.  
- **Data Encryption**: Sensitive data is encrypted both in transit and at rest.  
- **Audit Logging**: All critical actions are logged for security audits.  

## 📦 API Endpoints

### **Authentication**

- `POST /auth/register` - Register a new user  
- `POST /auth/login` - Login user  
- `POST /auth/logout` - Logout user  
- `POST /auth/refresh` - Refresh authentication tokens  

### **Users**

- `GET /users` - List users (admin only)  
- `GET /users/:id` - Get user profile  
- `PUT /users/:id` - Update user profile  
- `DELETE /users/:id` - Delete user account  

### **Businesses**

- `GET /businesses` - List businesses  
- `POST /businesses` - Register business  
- `GET /businesses/:id` - Get business details  
- `PUT /businesses/:id` - Update business  
- `DELETE /businesses/:id` - Delete business  
- `GET /businesses/:id/events` - Get events by business  
- `GET /businesses/:id/reviews` - Get reviews for a business  

### **Events**

- `GET /events` - List events  
- `POST /events` - Create event  
- `GET /events/:id` - Get event details  
- `PUT /events/:id` - Update event  
- `DELETE /events/:id` - Delete event  
- `GET /events/:id/comments` - Get comments for an event  

### **Advertisements**

- `GET /ads` - List advertisements  
- `POST /ads` - Create advertisement  
- `GET /ads/:id` - Get ad details  
- `PUT /ads/:id` - Update ad  
- `DELETE /ads/:id` - Delete ad  

### **Analytics**

- `GET /analytics` - Get analytics data (admin/business owner)  
- `GET /analytics/:entityType/:entityId` - Get analytics for a specific entity  

### **Notifications**

- `GET /notifications` - Get user notifications  
- `POST /notifications` - Send a notification (admin only)  
- `PUT /notifications/:id/read` - Mark notification as read  

### **Payments**

- `POST /payments` - Process a payment  
- `GET /payments/history` - Get payment history  

### **Subscriptions**

- `GET /subscriptions` - List subscription plans  
- `POST /subscriptions` - Subscribe to a plan  
- `PUT /subscriptions/:id` - Update subscription  
- `DELETE /subscriptions/:id` - Cancel subscription  

### **Feedback**

- `POST /feedback` - Submit feedback  
- `GET /feedback` - List feedback (admin only)  

### **Reports**

- `POST /reports` - Report inappropriate content  
- `GET /reports` - List reports (admin only)  
- `PUT /reports/:id` - Update report status  

### **Media**

- `POST /media/upload` - Upload media file  
- `GET /media/:id` - Get media file  
- `DELETE /media/:id` - Delete media file  

### **Comments & Reviews**

- `POST /comments` - Add a comment or review  
- `GET /comments/:entityType/:entityId` - Get comments or reviews for an entity  
- `DELETE /comments/:id` - Delete a comment or review  

### **Categories & Tags**

- `GET /categories` - List categories  
- `POST /categories` - Create category (admin only)  
- `GET /tags` - List tags  
- `POST /tags` - Create tag (admin only)  

## 💻 Development

### Scripts

- `deno task dev` - Start development server  
- `deno task start` - Start production server  
- `deno task test` - Run tests  
- `deno task lint` - Run linter  
- `deno task format` - Format code  

### Contributing

1. **Fork the repository**  
2. **Create your feature branch**  
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**  
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**  
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**  

## 📄 API Documentation

Detailed API documentation is available in [API.md](./API.md) and interactive documentation can be accessed via Swagger UI at `http://localhost:8000/docs`.

## 🚀 Deployment

### Firebase Configuration

1. **Initialize Firebase project**
   ```bash
   firebase init
   ```
2. **Deploy Firebase resources**
   ```bash
   firebase deploy
   ```

### Deploying the Deno Application

1. **Build the application**
   ```bash
   deno task build
   ```
2. **Deploy to Deno Deploy**
   ```bash
   deno task deploy
   ```
   _Ensure you have set up your Deno Deploy project and have the necessary credentials._

### Environment Variables

Make sure to set all required environment variables in your production environment (including `GOOGLE_APPLICATION_CREDENTIALS`).

## ⚙️ Configuration

### Environment Variables

| Variable                             | Description                                           | Required | Default            |
| ------------------------------------ | ----------------------------------------------------- | -------- | ------------------ |
| `GOOGLE_APPLICATION_CREDENTIALS`     | Path to Firebase Admin SDK service account JSON       | **Yes**  | -                  |
| `DENO_ENV`                           | Environment ("development" or "production")           | No       | `"development"`    |
| `PORT`                               | Server Port                                           | No       | `8000`             |
| `SKIP_AUTH`                          | Skip authentication (for development only)            | No       | `false`            |
| `FIREBASE_API_KEY`                   | Firebase Web API Key                                  | **Yes**  | -                  |
| `FIREBASE_AUTH_DOMAIN`               | Firebase Auth Domain                                  | **Yes**  | -                  |
| `FIREBASE_PROJECT_ID`                | Firebase Project ID                                   | **Yes**  | -                  |
| `FIREBASE_STORAGE_BUCKET`            | Firebase Storage Bucket                               | **Yes**  | -                  |
| `FIREBASE_MESSAGING_SENDER_ID`       | Firebase Messaging Sender ID                          | **Yes**  | -                  |
| `FIREBASE_APP_ID`                    | Firebase App ID                                       | **Yes**  | -                  |
| `FIREBASE_MEASUREMENT_ID`            | Firebase Measurement ID                               | No       | -                  |
| `PAYMENT_GATEWAY_KEY`               | API key for payment gateway                           | Yes (if using payments) | -       |
| `LOG_LEVEL`                          | Logging level (`error`, `warn`, `info`, `debug`)      | No       | `info`             |

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contact

- **Developer**: [Your Name](mailto:your.email@example.com)  
- **Project Link**: [https://github.com/ericsonwillians/itafest-backend](https://github.com/ericsonwillians/itafest-backend)  

## 🙏 Acknowledgments

- [Deno](https://deno.land/)  
- [Firebase](https://firebase.google.com/)  
- [Oak](https://oakserver.github.io/oak/)  
- [Swagger](https://swagger.io/)  
- [Stripe](https://stripe.com/) (or your chosen payment gateway)  
- All contributors and community members  

## 📚 Additional Documentation

- **API Reference**: Detailed documentation of all API endpoints.  
- **Database Schema**: Diagrams and explanations of the database structure.  
- **Security Guidelines**: Best practices and security measures implemented.  
- **Contributing Guide**: Guidelines for contributing to the project.  
- **Code of Conduct**: Rules and guidelines for community engagement.  

## 🚧 Roadmap

- **User Interface**: Develop a frontend application for users and businesses.  
- **Mobile App**: Create a mobile application for Android and iOS.  
- **Internationalization**: Support multiple languages and locales.  
- **AI Recommendations**: Implement AI to recommend events and businesses to users.  
- **Offline Support**: Allow certain features to work without an internet connection.  
- **Integration with Social Media**: Enable sharing of events and businesses on social platforms.  

## 🛠️ Technologies Used

- **Deno**: A modern runtime for JavaScript and TypeScript.  
- **TypeScript**: Typed superset of JavaScript.  
- **Firebase**: Backend-as-a-Service for authentication, database, and storage.  
- **Oak**: Middleware framework for Deno's HTTP server.  
- **Swagger**: API documentation and testing.  
- **Stripe/PayPal**: Payment processing solutions.  

## 🧪 Testing

- **Unit Tests**: Located in `tests/unit/`, run with `deno task test:unit`.  
- **Integration Tests**: Located in `tests/integration/`, run with `deno task test:integration`.  
- **End-to-End Tests**: Located in `tests/e2e/`, run with `deno task test:e2e`.  

## 🌐 Internationalization (i18n)

- **Languages Supported**: Portuguese (Brazil), English.  
- **Localization Files**: Located in `src/locales/`.  

## 📈 Analytics & Monitoring

- **Analytics Service**: Custom service to track user interactions.  
- **Monitoring Tools**: Integration with tools like Sentry for error tracking.  
- **Logging**: Centralized logging with different levels and outputs.  

## 🏦 Payment Integration

- **Payment Gateways Supported**: Stripe, PayPal.  
- **Subscription Management**: Automated billing cycles and notifications.  
- **Security Compliance**: Adherence to PCI DSS standards.  

## 🛡️ Compliance

- **Data Protection**: Compliance with LGPD (Lei Geral de Proteção de Dados) in Brazil.  
- **Privacy Policy**: Transparent data usage policies.  
- **Terms of Service**: Clear terms governing the use of the platform.  

## 📢 Marketing & SEO

- **SEO Optimization**: For better search engine ranking.  
- **Social Media Integration**: Easy sharing of content.  
- **Email Campaigns**: Tools for businesses to send promotional emails.  

## 🔄 Continuous Integration/Continuous Deployment (CI/CD)

- **CI/CD Pipeline**: Automated testing and deployment using GitHub Actions.  
- **Deployment Environments**: Staging and Production.  

## 📌 Versioning

- **Semantic Versioning**: Follows [SemVer](https://semver.org/) for releases.  
- **API Versioning**: API endpoints include versioning for backward compatibility.  

## 🤝 Sponsorship

- **Sponsorship Opportunities**: Businesses can sponsor features or sections.  
- **Acknowledgment**: Sponsors are highlighted within the platform.  

## 📬 Contact & Support

- **Support Email**: [support@itafest.com](mailto:support@itafest.com)  
- **Issue Tracker**: [GitHub Issues](https://github.com/ericsonwillians/itafest-backend/issues)  
- **Community Forum**: [Community Discussions](https://github.com/ericsonwillians/itafest-backend/discussions)  