# TWA Bonus Application

## Overview
The TWA Bonus Application is a web-based platform built with React, TypeScript, and Vite. It provides users with an interactive interface to participate in events, view rewards, and manage their profiles. The application is designed to be fast, responsive, and user-friendly.

## Features
- **Event Participation**: Users can view and participate in ongoing and available events.
- **Rewards Management**: Users can track rewards they have won and view detailed information about them.
- **Profile Management**: Users can update and manage their personal profiles.
- **Privacy Policy**: A dedicated page to inform users about the application's privacy practices.

## Technologies Used
- **React**: For building the user interface.
- **TypeScript**: For type-safe development.
- **Vite**: For fast and efficient development and build processes.
- **Tailwind CSS**: For styling the application.

## Project Structure
```
public/
  - Static assets like images and fonts.
src/
  - assets/: Contains additional assets like SVGs.
  - components/: Reusable UI components such as Header and Footer.
  - context/: Context API for managing global state (e.g., UserContext).
  - pages/: Individual pages of the application (e.g., AvailableEvents, Profile).
  - types/: Type definitions for TypeScript.
```

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/HARIOM-JHA01/twa-bonus.git
   ```
2. Navigate to the project directory:
   ```bash
   cd twa-bonus
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Application
To start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`.

### Building for Production
To create a production build:
```bash
npm run build
# or
yarn build
```

The build output will be located in the `dist/` directory.

### Linting and Formatting
To run ESLint:
```bash
npm run lint
# or
yarn lint
```

To format code with Prettier:
```bash
npm run format
# or
yarn format
```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push the branch.
4. Open a pull request.

## License
This project is proprietary and intended for educational purposes only. You may view and learn from the code, but any commercial use, distribution, or modification is strictly prohibited without explicit written permission from the copyright holder. See the LICENSE file for more details.

## Acknowledgments
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
