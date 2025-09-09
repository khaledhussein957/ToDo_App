# ToDo App — Mobile (Expo) + Backend (Express)

## Description
A cross-platform task management app where users can register/login, create and categorize tasks, upload attachments and profile photos, receive notifications, and view productivity analytics. The mobile app (Expo/React Native) communicates with the Express/MongoDB backend secured by JWT, with file handling via Multer and Cloudinary. Designed for a clean UX with file-based routing and state management using Redux Toolkit and RTK Query.

A full-stack ToDo application consisting of:
- `apk`: React Native app built with Expo Router, Redux Toolkit, RTK Query, and Zod.
- `backend`: Node.js/Express API with MongoDB, JWT auth, file uploads (Multer + Cloudinary), and validation.

## Project Structure

```
ToDo/
  apk/        # Expo app (React Native)
  backend/    # Express REST API (TypeScript)
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB database (Atlas or local)
- Optional: Android Studio/iOS Xcode for emulators; a physical device with Expo Go

## Backend

Location: `backend`

- Tech: Express 5, TypeScript, Mongoose, JWT, Multer, Cloudinary, Joi
- Entry: `src/index.ts`
- Scripts:
  - `npm run dev` — Start with Nodemon + ts-node
  - `npm run build` — Compile TypeScript
  - `npm start` — Run compiled server (`dist/index.js`)

### Environment Variables
Create a `.env` file inside `backend` with:

```
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Install & Run

```
cd backend
npm install
npm run dev
```
The API will start on `http://localhost:5000` (or the `PORT` you set). Static uploads are served from `/uploads`.

## Mobile App (Expo)

Location: `apk`

- Tech: Expo 53, React Native 0.79, Expo Router, Redux Toolkit/RTK Query, Zod
- Notable directories:
  - `app/` — file-based routes (auth, tabs: todos, analytics, notifications, profile)
  - `store/Api/` — RTK Query services (`authApi`, `taskApi`, etc.) and `BaseUrl.ts`
  - `assets/` — images, fonts, styles
  - `components/` — shared UI components

### Configure API Base URL
Update `apk/store/Api/BaseUrl.ts` to point to your backend:

```ts
// apk/store/Api/BaseUrl.ts
export const BaseUrl = "http://YOUR_BACKEND_HOST:5000"; // no trailing slash
```

For Android emulator, you may need `http://10.0.2.2:5000`.

### Install & Run

```
cd apk
npm install
npx expo start
```
Use the Expo CLI to open in Android, iOS, web, or scan the QR code in Expo Go.

### Permissions & Features

- Notifications: uses `expo-notifications` and `expo-device` — allow permissions on device
- File/image uploads: uses document/image pickers; backend handles uploads and stores to Cloudinary/local `/uploads`

## Development Tips

- Start backend first, then the app, so the app can reach the API
- If requests fail, confirm `BaseUrl` and device/emulator networking rules
- JWT auth flows are implemented in `backend/src/routes/auth.route.ts` and `apk/store/slices/authSlice.ts`

## Troubleshooting

- CORS issues: backend enables CORS via `cors()`; adjust origin if deploying
- Mongo connection: verify `MONGO_URI` and network access
- Android emulator host: prefer `10.0.2.2` instead of `localhost`

## License

This project is provided as-is for learning and development.
