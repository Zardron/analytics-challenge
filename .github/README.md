# CI/CD Setup for Vercel

This repository includes GitHub Actions workflows for CI/CD with Vercel deployment.

## Available Workflows

### 1. `ci.yml` - Full CI/CD with Vercel Deployment
This workflow includes:
- Running tests on every push and pull request
- Building the project to catch build errors
- Automatic deployment to Vercel production on pushes to `main` or `master`

### 2. `ci-simple.yml` - CI Only (Recommended if using Vercel Git Integration)
This workflow includes:
- Running tests on every push and pull request
- Building the project to catch build errors
- No deployment (uses Vercel's native Git integration instead)

## Setup Instructions

### Option 1: Using Vercel's Native Git Integration (Recommended)

This is the simplest approach. Vercel will automatically deploy when you push to your connected branch.

1. **Use the simple CI workflow:**
   - The `ci-simple.yml` workflow runs tests and builds without deploying
   - Rename `ci-simple.yml` to `ci.yml` (or delete the full `ci.yml` if you prefer)

2. **Connect your repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel's dashboard
   - Vercel will automatically deploy on every push

### Option 2: Using GitHub Actions for Deployment

If you want full control over the deployment process:

1. **Required GitHub Secrets:**
   Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):
   ```
   VERCEL_TOKEN           # Required - Get from vercel.com/account/tokens
   VERCEL_PROJECT_ID      # Required - Get from your Vercel project settings or .vercel/project.json
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

   **Optional (if not using linked project):**
   ```
   VERCEL_ORG_ID          # Optional - Only needed if project isn't linked locally
   ```

2. **How to get Vercel tokens/IDs:**
   - **VERCEL_TOKEN**: Go to https://vercel.com/account/tokens and create a new token
   - **VERCEL_PROJECT_ID**: 
     - **Easiest method**: Run `vercel link` locally in your project directory. This creates a `.vercel/project.json` file with your `projectId` and `orgId`.
     - Then either:
       - Option A: Copy the `projectId` from `.vercel/project.json` to GitHub Secrets (recommended)
       - Option B: Remove `.vercel` from `.gitignore` and commit `.vercel/project.json` (then PROJECT_ID secret not needed)
     - **Alternative**: Go to your Vercel project settings > General tab > scroll to find Project ID
   
   **Note**: The workflow works without `VERCEL_ORG_ID` if:
   - You commit the `.vercel` directory (by removing it from `.gitignore`), OR
   - You run `vercel link` locally once to create the `.vercel` directory structure
   
   If you still need `VERCEL_ORG_ID`, get it from `.vercel/project.json` after running `vercel link` locally.

3. **Environment Variables:**
   - Set the Supabase environment variables in GitHub Secrets (for CI builds)
   - Also set them in Vercel dashboard for deployments

## Workflow Triggers

Workflows run on:
- Push to `main`, `master`, or `develop` branches
- Pull requests targeting `main`, `master`, or `develop` branches

## Customization

You can customize the workflows by:
- Adding more branches to trigger on
- Adding additional test commands
- Modifying the Node.js version
- Adding code quality checks (linting, formatting, etc.)
- Adding deployment to preview/staging environments

