
### Storing API Request Methods
Stores are primarily used to define API request methods. This is where you define Axios functions for sending fetch requests.

---

### Installing Components from ShadCN
To install a component using ShadCN, run the following command:  
```bash
pnpm dlx shadcn@latest add [component-name]
```

After installing the component, update the `cn` import in the file to:  
```javascript
import { cn } from '../../lib/utils/cn';
```

---

### Technologies Used in This Project
This project utilizes the following libraries and tools:
- **Zustand**: For state management.
- **React Query**: For handling requests and API calls.
- **React Hook Form**: For building and managing forms.
- **ShadCN**: For UI components.

---

### Creating UI with ShadCN
To create UI components using ShadCN, visit [ShadCN UI Builder](https://v0.dev/).  

1. Upload your Figma design image to the site.  
2. Add `with jsx` to every prompt for better results.

---

### Using Composer for the First Time
When using Composer for the first time:
1. Use `@src` to ensure files are added to the correct paths.
2. Select the `agent` option in the Composer window for better output and improved results.

