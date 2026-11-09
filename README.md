# PNG Skills Exchange

PNG Skills Exchange is a community mobile app for Papua New Guinea that connects people who have skills with people who need them. Users post skill listings, browse what others offer, send service requests to providers, and get a push notification when a provider responds. It is built with React Native, Expo and Supabase.

**Student** Ruth Paruru Eludeme  
| **Student no.** | 23201054  
| **Unit** | IS325 Mobile Application Development, PNG University of Technology |
| **Version** | 1.0.0

## Features

- Register, log in, log out, reset password; the session persists after the app is closed
- Skills: create, browse, view details, edit and delete (owner only, delete asks for confirmation)
- Service requests: send a request for a skill, see Sent and Received lists, view details
- Providers accept, decline or complete a request; requesters can cancel a pending one
- Push notification to the requester when a provider accepts, declines or completes a request
- Profile with account details and activity counts; Home screen with a short how-to-use guide
- Row Level Security so users can only change their own data
- Map of skills with distance from your position; saves a position on a skill with one tap

## Tech stack

| Technology                                     | Purpose                                     |
| ---------------------------------------------- | ------------------------------------------- |
| React Native + Expo (SDK 58, managed workflow) | Mobile app                                  |
| TypeScript                                     | Typed code                                  |
| Expo Router                                    | File-based navigation (tabs + stack)        |
| Supabase                                       | Authentication, PostgreSQL database, RLS    |
| expo-notifications                             | Push notification registration and handling |
| Firebase Cloud Messaging (V1)                  | Android push delivery                       |
| EAS Build                                      | Signed APK and AAB                          |

## Getting started

Requirements: Node.js LTS, Git, a Supabase project, and an Android phone.

```bash
git clone https://github.com/Rupel07/png-skills-exchange.git
cd png-skills-exchange
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

1. Open your Supabase project, go to **SQL Editor**, and run `database/schema.sql`. This creates the tables, Row Level Security policies, the `push_tokens` table and the notification trigger.
2. Fill in `.env` with your own Supabase values (see below).
3. Start the app:

```bash
npx expo start
```

Scan the QR code with Expo Go. If the terminal says it is using a development build, press `s` to switch to Expo Go. If your phone cannot connect, use `npx expo start --tunnel`.

Remote push notifications do not work in Expo Go on Android (SDK 53 and later). Everything else runs in Expo Go. To test push, install the APK from a preview build (see Building).

## Environment variables

| Name                            | Description                          |
| ------------------------------- | ------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL            |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon / publishable key |

Only the publishable key is used in the app. The service role key is never used or stored. The real `.env` is git-ignored; `.env.example` lists the names with dummy values.

## External APIs and services

| Service                                    | Used for                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Supabase Auth                              | Registration, login, password reset, session persistence                    |
| Supabase PostgreSQL + RLS                  | Skills, service requests, push tokens                                       |
| Expo Push Service                          | Sends the notification when a request status changes                        |
| Firebase Cloud Messaging                   | Delivers Expo push messages to Android devices                              |
| OpenStreetMap tiles (Leaflet in a WebView) | Shows the map of skills                                                     |
| Expo Location                              | Gets the user's position, distances, and the place name when saving a skill |

A database trigger (`notify_request_response`, using `pg_net`) calls the Expo Push API when a request changes to accepted, declined or completed.

## Building the APK and AAB

Build profiles are defined in `eas.json`.

| Profile       | Output         | Command                                              |
| ------------- | -------------- | ---------------------------------------------------- |
| `preview`     | APK            | `eas build --platform android --profile preview`     |
| `production`  | AAB            | `eas build --platform android --profile production`  |
| `development` | Dev client APK | `eas build --platform android --profile development` |

```bash
npm install -g eas-cli
eas login
eas init
```

Cloud builds do not read the local `.env`, so the Supabase variables are stored in EAS for each environment:

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "<url>" --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<publishable key>" --environment preview --visibility plaintext
```

Repeat with `--environment production` for the AAB build.

- Android package: `com.rupel07.pngskillsexchange`
- Push notifications also need a Firebase project, `google-services.json`, and an FCM V1 service account key uploaded with `eas credentials`. The private key file is never committed.

## Project structure

```
src/
  app/          Expo Router screens: (auth), (tabs), skills/, requests/
  components/   Reusable UI components
  context/      AuthContext
  hooks/        Custom hooks (push notifications)
  lib/          Supabase client
  services/     Database and notification access (no UI)
  types/        Shared TypeScript types
database/
  schema.sql    Tables, RLS policies, notification trigger
```

## Known limitations

- Remote push notifications need the installed APK or a development build; they do not work in Expo Go.
- Push is sent to the requester only. Providers are not notified when a new request arrives.
- Request status changes are enforced by the app, but the database policy lets either party update a request.
- Not built (scope reduction): search, category filters, favourites, ratings and reviews, messaging, rankings.

## AI assistance

I used Claude (Anthropic) as a coding assistant for: planning the order of the build, drafting React Native and TypeScript screens and service code, writing the Supabase SQL (tables, Row Level Security policies and the notification trigger), walking through the EAS, Firebase and Expo push setup, and diagnosing error messages. I ran, tested and adapted the code in my own project and can explain it.

## Credits

Built with Expo, React Native, Expo Router, Supabase, expo-notifications, expo-device, expo-constants and @expo/vector-icons.
