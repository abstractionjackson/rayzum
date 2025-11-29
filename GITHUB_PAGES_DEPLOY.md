# Deploy to GitHub Pages

This application has been converted to a static site using browser localStorage for data persistence. It can be deployed to GitHub Pages.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/abstractionjackson/rayzum`
2. Click on **Settings** tab
3. In the left sidebar, click on **Pages**
4. Under **Build and deployment**:
   - Source: Select "GitHub Actions"

### 2. Push the Workflow

The GitHub Actions workflow is already configured in `.github/workflows/deploy.yml`.

When you push to the `main` branch, the workflow will automatically:
- Install dependencies
- Build the static site
- Deploy to GitHub Pages

### 3. Access Your Site

After the first successful deployment, your site will be available at:
```
https://abstractionjackson.github.io/rayzum/
```

## Manual Deployment (Optional)

If you prefer to deploy manually:

```bash
# Build the static site
pnpm build

# The output will be in the `out/` directory
# You can deploy this directory to any static hosting service
```

## Important Notes

### Base Path
The application is configured with basePath `/rayzum` for GitHub Pages. This matches your repository name.

If you rename the repository, update `basePath` in `next.config.js`:
```javascript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

### Local Storage
All data is stored in the browser's localStorage under the key `'rayzum_db'`. This means:
- Data persists only in the browser where it was created
- Data is not synced across devices
- Clearing browser data will delete all resumes/templates

### Dynamic Routes
The app uses client-side routing for dynamic resume pages (`/edit/[id]` and `/preview/[id]`). A placeholder page is generated during build, but actual routing happens in the browser.

## Workflow Permissions

The GitHub Actions workflow needs specific permissions that are automatically granted when using GitHub Pages with Actions as the source. No manual configuration is needed.

## Troubleshooting

### Build Fails
- Ensure all dependencies are in `package.json`
- Check that `pnpm build` works locally
- Review the Actions logs in the **Actions** tab

### 404 Errors
- Verify the `basePath` matches your repository name
- Ensure GitHub Pages is enabled and set to use GitHub Actions
- Check that the deployment completed successfully

### Data Not Persisting
- localStorage is browser-specific and domain-specific
- Data will only persist on the same browser/device
- Use browser DevTools → Application → Local Storage to inspect data

## Development

To run locally:
```bash
pnpm install
pnpm dev
```

Local development runs without the basePath, so use `http://localhost:3000/` (not `/rayzum`).
