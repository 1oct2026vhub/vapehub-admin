# Premium Email Editor - Integration Guide

This guide details how to integrate the **Premium Email Editor** module into another React application. The editor is designed as a self-contained module but requires specific dependencies and valid routing contexts to function correctly.

## 1. Prerequisites

Before integrating, ensure your target project meets these requirements:
- **React**: v16.8+ (Hooks support required)
- **Framework**: Vite, Create React App, or Next.js (client-side only)
- **Node.js**: v14+

## 2. Installation & Dependencies

The editor relies on several libraries for drag-and-drop mechanics, styling, and icons.

### Step 2.1: Install Required Packages

Run the following command in your target project's root directory to install all necessary dependencies:

```bash
npm install @dnd-kit/core @dnd-kit/sortable react-icons styled-components prop-types react-router-dom react-easy-crop flowbite-react
```

### Step 2.2: Dependency Reference List

Refer to this table to check for version compatibility or when updating your packages.

| Package | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **@dnd-kit/core** | `^6.3.0` | Core drag-and-drop mechanics |
| **@dnd-kit/sortable** | `^10.0.0` | Sortable lists and grids for blocks |
| **react-icons** | `^5.5.0` | Icons used in toolbars and settings |
| **styled-components** | `^6.3.8` | Scoped styling for complex components |
| **prop-types** | `^15.8.1` | Runtime type checking |
| **react-router-dom** | `^7.12.0` (or `^6.x`) | Handling navigation within the editor |
| **react-easy-crop** | `^5.5.6` | Image cropping tool for uploads |
| **flowbite-react** | `^0.12.16` | UI components for modals and inputs |

### Step 2.3: Tailwind CSS Configuration

This module uses **Tailwind CSS** for layout and styling. If your project doesn't have Tailwind installed, follow the [official Tailwind CSS installation guide](https://tailwindcss.com/docs/installation).

**Important**: Ensure your `tailwind.config.js` (or v4 CSS import) includes the path to the editor files so styles are applied correctly.

```javascript
// tailwind.config.js (Example for v3)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Add the path to where you place the EmailEditor
    "./src/pages/EmailEditor/**/*.{js,jsx}" 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

If you are using **Tailwind v4**, ensure your CSS entry point imports tailwind:
```css
/* index.css or App.css */
@import "tailwindcss";
```

## 3. Project Structure Setup

To keep the application modular, copy the entire `EmailEditor` directory into your project's `pages` or `components` folder.

```text
src/
├── components/
├── pages/
│   └── EmailEditor/       <-- Copy this entire folder
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       ├── index.jsx
│       ├── theme.js
│       └── ...
└── App.jsx
```

## 4. Integration & Routing

The `EmailEditor` uses `react-router-dom` hooks (`useNavigate`, `useParams`, `useLocation`) for state management and navigation. It **must** be rendered inside a `<BrowserRouter>` (or equivalent router provider).

### Step 4.1: Add Route
In your main application entry (e.g., `App.jsx` or `main.jsx`), define a route for the editor.

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EmailEditor from './pages/EmailEditor'; // Adjust path as needed

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route for creating a new template (optional usage) */}
        <Route path="/email-editor" element={<EmailEditor />} />
        
        {/* Route for editing a specific template by ID */}
        <Route path="/email-editor/:id" element={<EmailEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Step 4.2: Navigation & Passing Data
You can navigate to the editor with or without initial data.

**Option A: Open Empty/Default Editor**
```jsx
<Link to="/email-editor/new">Create New Email</Link>
```

**Option B: Open with Existing Template Data**
Pass the template data via the router `state`. The editor looks for `state.template`.

```jsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleEdit = (template) => {
    navigate(`/email-editor/${template.id}`, {
      state: {
        template: {
          id: template.id,
          subject: template.subject,
          blocks: template.blocks // Array of block objects
        }
      }
    });
  };

  return <button onClick={() => handleEdit(myTemplate)}>Edit Template</button>;
};
```

## 5. Saving & Exporting

Currently, the `handleSave` function in `EmailEditor/index.jsx` logs the output to the console. You will likely want to connect this to your own API.

### Customizing the Save Action

1.  Open `src/pages/EmailEditor/index.jsx`.
2.  Locate the `handleSave` function.
3.  Replace the console logs with your API call.

```javascript
// src/pages/EmailEditor/index.jsx

const handleSave = async () => {
    const outputJSON = {
        subject: subject,
        blocks: page.blocks
    };
    
    // Generate HTML for email clients
    const outputHTML = generateHtml(subject, page.blocks);

    try {
        // Example: Send to your backend
        await myApiService.saveTemplate({
            id: id, // from useParams
            json: outputJSON,
            html: outputHTML
        });
        alert('Template Saved Successfully!');
    } catch (error) {
        console.error('Failed to save:', error);
    }
};
```

## 6. HTML Generation (Sending Emails)

The editor includes a utility to convert the JSON design into renderable HTML.
- **File**: `utils/jsonToHtml.js`
- **Usage**:
  ```javascript
  import { generateHtml } from './utils/jsonToHtml';
  const htmlEmail = generateHtml(subject, blocks);
  ```
- Use this `htmlEmail` string as the body of your email when sending via services like SendGrid, AWS SES, or Nodemailer.

## 7. Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Styling looks broken** | Ensure Tailwind is configured to scan the `EmailEditor` folder structure in `content` configuration. |
| **"useNavigate() may be used only in..."** | Ensure `EmailEditor` is wrapped in a `<BrowserRouter>` provider at the root of your app. |
| **Drag and Drop not working** | Check dependencies. Ensure `@dnd-kit/core` and `@dnd-kit/sortable` versions match the requirements. |
| **Icons missing** | Ensure `react-icons` is installed. |
| **Missing components** | Verify standard naming conventions if you are moving files manually. |

## 8. Theme Customization

The editor uses a `theme.js` file for consistent colors. You can modify `src/pages/EmailEditor/theme.js` to match your application's branding colors (primary, secondary, borders, etc.) without hunting through CSS files.
