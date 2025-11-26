Project Structure Rules:
Use jsx extension for React components
Use PascalCase for component file names
Use kebab-case for folder names
Use camelCase for store files
Use Javascript for all files
Use named exports for components
use axios for API calls

1. Components Organization:
   - All components must be in the /components directory
   - Group related components in subdirectories based on features/modules
   - Example structure:
     /components
       /dashboard
         Dashboard.jsx
         DashboardHeader.jsx
         DashboardSidebar.jsx
       /auth
         Login.jsx
         Register.jsx
       /shared
         Button.jsx
         Card.jsx

2. Pages Organization:
   - All pages must be in the /pages directory
   - Follow Next.js/React Router naming conventions
   - Use index.jsx for main route pages
   - Example structure:
     /pages
       /dashboard
         index.jsx
         settings.jsx
         profile.jsx
       /auth
         login.jsx
         register.jsx

3. Store Organization:
   - All store files must be in the /store directory
   - Separate files for different features/modules
   - Include API endpoints in respective store files
   - Use useContext for storage
   - Example structure:
     /store
       userStore.js
       dashboardStore.js
       authStore.js

4. Naming Conventions:
   - Components: PascalCase (e.g., DashboardHeader.jsx)
   - Pages: kebab-case for folders, PascalCase for components
   - Store files: camelCase

5. Code Organization:
   - Each component should have its own file
   - Keep components focused and single-responsibility
   - Shared components go in /components/shared
   - Use useContext for state management

6. Import/Export Rules:
   - Use named exports for components
   - Create index.js files for easier imports
   - Group related exports in feature folders

7. State Management:
   - Use useContext for state management
   - Store API endpoints in respective store files
   - Keep store logic separate from components