# Stack Auth Integration in Shipkit

This document provides a comprehensive guide for using Stack Auth as an authentication provider in your Shipkit application.

## Overview

Shipkit now supports Stack Auth as a modern, feature-rich authentication provider alongside the existing Auth.js implementation. Stack Auth provides:

- Built-in user management and authentication flows
- Advanced permission and role management
- Modern UI components and hosted authentication pages
- Developer-friendly APIs and SDKs

## Environment Variables

To enable Stack Auth in your Shipkit application, configure the following environment variables:

### Required Variables

```bash
# Stack Auth Configuration
STACK_PROJECT_ID=your_stack_project_id
STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_client_key
STACK_SECRET_SERVER_KEY=your_secret_server_key

# Feature Flag (automatically set based on above variables)
NEXT_PUBLIC_FEATURE_STACK_AUTH_ENABLED=true
```

### How to Get Stack Auth Credentials

1. Sign up for a Stack Auth account at [stack-auth.com](https://stack-auth.com)
2. Create a new project in your Stack Auth dashboard
3. Navigate to your project settings to find:
   - **Project ID**: Your unique project identifier
   - **Publishable Client Key**: Safe to use in client-side code
   - **Secret Server Key**: Keep this secure, only use server-side

## Feature Detection

Shipkit automatically detects Stack Auth availability based on your environment variables:

- If all Stack Auth variables are present and valid, Stack Auth is enabled
- If Stack Auth is not configured, the application gracefully falls back to Auth.js
- If no authentication providers are configured, guest mode is available

## Architecture

### Authentication Flow Priority

1. **Stack Auth (if configured)**: Primary authentication provider
2. **Auth.js (fallback)**: Traditional OAuth and credential providers
3. **Guest Mode (fallback)**: Limited functionality without authentication

### Database Integration

The Shipkit database schema has been extended to support Stack Auth:

- `users.stackAuthId`: Stores the Stack Auth user identifier
- User data is synchronized between Stack Auth and Shipkit databases
- Existing Auth.js users can be migrated to Stack Auth

### Session Management

- Stack Auth handles its own session management and token storage
- Sessions are synchronized with Shipkit's user system
- Session data is compatible between Stack Auth and Auth.js

## Implementation Details

### Server-Side Components

#### Stack Auth Configuration (`src/server/stack-auth.config.ts`)
- Initializes Stack Auth server app
- Provides configuration helpers
- Handles environment variable validation

#### Stack Auth Service (`src/server/services/stack-auth-service.ts`)
- User authentication and session management
- User synchronization between Stack Auth and Shipkit
- Permission checking and profile management

#### Unified Auth Layer (`src/server/auth.ts`)
- Routes between Stack Auth and Auth.js based on configuration
- Provides consistent authentication interface
- Handles graceful fallbacks

### Client-Side Components

#### Stack Auth Provider (`src/app/(app)/(authentication)/_components/stack-auth-provider.tsx`)
- Renders Stack Auth sign-in buttons
- Integrates with existing authentication UI
- Handles Stack Auth SDK interactions

#### OAuth Buttons Integration
- Stack Auth buttons appear alongside existing OAuth providers
- Conditional rendering based on Stack Auth availability
- Consistent styling with Shipkit design system

### API Routes

#### Configuration Endpoint (`/api/stack-auth/config`)
- Provides client-side configuration data
- Only returns configuration if Stack Auth is properly enabled
- Used by client components to determine Stack Auth availability

#### Session Endpoint (`/api/stack-auth/session`)
- Handles Stack Auth session information
- Synchronizes user data between systems
- Provides Shipkit-compatible session objects

### Middleware Integration

The Next.js middleware (`middleware.ts`) has been updated to support Stack Auth:

- Routes authentication checks to appropriate provider
- Handles protected route redirects
- Maintains compatibility with existing Auth.js flows

## Migration Guide

### From Auth.js to Stack Auth

1. **Set up Stack Auth project** and obtain credentials
2. **Configure environment variables** as described above
3. **Test in development** to ensure proper integration
4. **Deploy configuration** to production environment
5. **Monitor user authentication** during transition period

### User Data Migration

- Existing users continue to work with Auth.js
- New users automatically use Stack Auth if configured
- User data is synchronized automatically
- No manual migration is required

## Usage Examples

### Basic Setup

1. Configure environment variables:
```bash
STACK_PROJECT_ID=st_proj_your_project_id
STACK_PUBLISHABLE_CLIENT_KEY=st_pub_your_publishable_key
STACK_SECRET_SERVER_KEY=st_sec_your_secret_key
```

2. Restart your application - Stack Auth will be automatically detected and enabled

### Custom Stack Auth Integration

```typescript
import { StackAuthService } from '@/server/services/stack-auth-service';

// Check if Stack Auth is available
if (StackAuthService.isAvailable()) {
  // Get current user
  const user = await StackAuthService.getCurrentUser();
  
  // Get user profile
  const profile = await StackAuthService.getUserProfile();
  
  // Check permissions
  const hasPermission = await StackAuthService.hasPermission('admin');
}
```

### Using Stack Auth in Components

```tsx
import { useStackAuthEnabled } from '@/components/providers/stack-auth-client-provider';

export function AuthComponent() {
  const { isEnabled, isLoaded } = useStackAuthEnabled();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  return (
    <div>
      {isEnabled ? (
        <div>Stack Auth is enabled</div>
      ) : (
        <div>Using Auth.js fallback</div>
      )}
    </div>
  );
}
```

## Development and Testing

### Local Development

1. Create a Stack Auth development project
2. Configure environment variables in `.env.local`
3. Start the development server: `pnpm run dev`
4. Test authentication flows in your browser

### Testing Authentication Flows

- **Sign In**: Navigate to `/auth/sign-in` and test Stack Auth buttons
- **Sign Out**: Test sign-out functionality
- **Protected Routes**: Ensure middleware properly redirects
- **Fallback**: Disable Stack Auth to test Auth.js fallback

### Environment Variable Testing

Test different configurations:

```bash
# Stack Auth enabled
STACK_PROJECT_ID=st_proj_test
STACK_PUBLISHABLE_CLIENT_KEY=st_pub_test
STACK_SECRET_SERVER_KEY=st_sec_test

# Stack Auth disabled (Auth.js fallback)
# STACK_PROJECT_ID=
# STACK_PUBLISHABLE_CLIENT_KEY=
# STACK_SECRET_SERVER_KEY=
```

## Troubleshooting

### Common Issues

#### Stack Auth Not Appearing
- Check environment variables are properly set
- Verify Stack Auth credentials are valid
- Check browser console for configuration errors

#### Authentication Failures
- Verify Stack Auth project configuration
- Check allowed origins in Stack Auth dashboard
- Ensure proper redirect URLs are configured

#### Session Issues
- Clear browser cookies and local storage
- Check for conflicting authentication tokens
- Verify database connectivity

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Support

For Stack Auth-specific issues:
- Stack Auth Documentation: [docs.stack-auth.com](https://docs.stack-auth.com)
- Stack Auth Support: Contact through their dashboard

For Shipkit integration issues:
- Check the implementation in `src/server/services/stack-auth-service.ts`
- Review middleware configuration in `middleware.ts`
- Verify database schema includes `stackAuthId` field

## Security Considerations

- **Never expose** `STACK_SECRET_SERVER_KEY` in client-side code
- **Use HTTPS** in production environments
- **Configure CORS** properly in Stack Auth dashboard
- **Review permissions** regularly in Stack Auth project settings

## Performance Notes

- Stack Auth adds minimal overhead to authentication flows
- Client-side SDK is loaded only when Stack Auth is configured
- Session synchronization is optimized with caching
- Fallback to Auth.js is seamless and fast

## Future Enhancements

Planned improvements for Stack Auth integration:

- [ ] Advanced permission mapping between Stack Auth and Shipkit
- [ ] Bulk user migration tools
- [ ] Enhanced monitoring and analytics
- [ ] Custom Stack Auth UI themes matching Shipkit design
- [ ] Multi-tenant support with Stack Auth organizations

## Contributing

When contributing to Stack Auth integration:

1. Follow existing code patterns in `src/server/services/stack-auth-service.ts`
2. Ensure graceful fallback to Auth.js
3. Add appropriate error handling and logging
4. Update this documentation for any new features
5. Test both Stack Auth and Auth.js flows

## License

This Stack Auth integration is part of Shipkit and follows the same license terms.