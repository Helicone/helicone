# SessionManager Feature - Helicone Session Token Authentication

This feature allows users to generate temporary session tokens using the Helicone SDK, which can be used for authentication instead of the main API key. This is useful for secure, temporary access scenarios.

## Overview

The SessionManager feature consists of:

1. **TypeScript SDK SessionManager** - Client-side token generation
2. **Worker Session Token Authentication** - Token validation in the proxy
3. **Jawn API Endpoints** - Backend token creation and validation

## Usage

### 1. TypeScript SDK Usage

```typescript
import { SessionManager } from "@helicone/helpers";

const sessionManager = new SessionManager({
  apiKey: process.env.HELICONE_API_KEY,
  // baseUrl: "https://api.helicone.ai" // Optional, defaults to production
});

const sessionToken = await sessionManager.newSessionToken({
  sessionId: "12412312",
  sessionName: "HelloWorld", 
  sessionPath: "blah/blah",
  userId: "123123",
  customProperties: {}, // Optional
  ttl: 3600 // Optional, default 1 hour
});

console.log("Session Token:", sessionToken.sessionToken);
console.log("Expires At:", sessionToken.expiresAt);
```

### 2. Using Session Token with OpenAI

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer session:${sessionToken.sessionToken}` // Note the 'session:' prefix
  }
});

const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }]
});
```

## Authentication Flow

1. **Token Generation**: Client uses Helicone API key to generate session token
2. **Token Usage**: Session token is used instead of API key for proxy requests
3. **Token Validation**: Worker validates session token and extracts organization/user info
4. **Request Processing**: Request is processed with session context

## Implementation Details

### Session Token Format

Session tokens are JWT tokens containing:

```json
{
  "sessionId": "user-provided-session-id",
  "sessionName": "user-provided-session-name", 
  "sessionPath": "user-provided-session-path",
  "userId": "user-provided-user-id",
  "customProperties": {},
  "orgId": "organization-id-from-api-key",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Worker Authentication Types

The worker now supports a new authentication type:

```typescript
type SessionTokenAuth = {
  _type: "sessionToken";
  token: string;
  payload: {
    sessionId: string;
    sessionName: string;
    sessionPath: string;
    userId: string;
    customProperties: Record<string, any>;
    orgId: string;
    iat: number;
    exp: number;
  };
};
```

### Header Processing

The worker recognizes session tokens by the format:
- `Helicone-Auth: Bearer session:{jwt-token}`
- `Authorization: Bearer session:{jwt-token}`

## API Endpoints

### Create Session Token

**POST** `/v1/session/token`

**Request Body:**
```json
{
  "sessionId": "string",
  "sessionName": "string", 
  "sessionPath": "string",
  "userId": "string",
  "customProperties": {}, // optional
  "ttl": 3600 // optional, seconds
}
```

**Response:**
```json
{
  "data": {
    "sessionToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "error": null
}
```

### Validate Session Token

**POST** `/v1/session/token/validate`

**Request Body:**
```json
{
  "sessionToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "payload": {
      "sessionId": "12412312",
      "sessionName": "HelloWorld",
      "sessionPath": "blah/blah", 
      "userId": "123123",
      "customProperties": {},
      "orgId": "org-123",
      "iat": 1234567890,
      "exp": 1234571490
    }
  },
  "error": null
}
```

## Environment Variables

Set the JWT secret for session token signing:

```bash
# Primary option
JWT_SECRET=your-super-secret-key

# Alternative option
HELICONE_SESSION_SECRET=your-super-secret-key

# Fallback (not recommended for production)
# Uses: 'helicone-default-session-secret'
```

## Security Considerations

1. **Token Expiration**: Session tokens expire after the specified TTL (default 1 hour)
2. **Organization Isolation**: Tokens are scoped to the organization that created them
3. **JWT Signing**: Tokens are cryptographically signed to prevent tampering
4. **Header Validation**: Worker validates token format and signature before use

## Benefits

1. **Temporary Access**: Generate short-lived tokens for temporary integrations
2. **User Context**: Include user information in requests without exposing main API key
3. **Session Tracking**: Built-in session context for better observability
4. **Custom Properties**: Include additional metadata in tokens

## File Changes

### SDK Changes
- `sdk/typescript/helpers/session_manager/SessionManager.ts` - Main SessionManager class
- `sdk/typescript/helpers/session_manager/types.ts` - TypeScript interfaces
- `sdk/typescript/helpers/index.ts` - Export SessionManager

### Worker Changes  
- `worker/src/lib/db/DBWrapper.ts` - Added SessionTokenAuth type and validation
- `worker/src/lib/models/HeliconeHeaders.ts` - Added session token parsing
- `worker/src/lib/RequestWrapper.ts` - Added session token auth handling

### Backend Changes
- `valhalla/jawn/src/controllers/public/sessionController.ts` - Added token endpoints
- `valhalla/jawn/package.json` - Added jsonwebtoken dependency

## Testing

### Manual Testing

1. **Generate Token:**
```bash
curl -X POST https://api.helicone.ai/v1/session/token \
  -H "Authorization: Bearer YOUR_HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "sessionName": "Test Session", 
    "sessionPath": "/test",
    "userId": "test-user",
    "ttl": 3600
  }'
```

2. **Use Token:**
```bash
curl -X POST https://oai.helicone.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -H "Helicone-Auth: Bearer session:YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

3. **Validate Token:**
```bash
curl -X POST https://api.helicone.ai/v1/session/token/validate \
  -H "Authorization: Bearer YOUR_HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "YOUR_SESSION_TOKEN"
  }'
```

## Future Enhancements

1. **Token Refresh**: Implement token refresh functionality
2. **Rate Limiting**: Add rate limiting per session token
3. **Audit Logging**: Enhanced logging for session token usage
4. **Token Revocation**: Ability to revoke active session tokens
5. **Multiple Sessions**: Support for multiple concurrent sessions per user

## Troubleshooting

### Common Issues

1. **Invalid Token Format**
   - Ensure token is prefixed with `session:` in headers
   - Verify JWT format (3 parts separated by dots)

2. **Token Expired**
   - Check token expiration time
   - Generate new token if expired

3. **Organization Mismatch**
   - Verify token was created by the same organization
   - Check API key organization permissions

4. **Missing Dependencies**
   - Ensure jsonwebtoken is installed: `npm install jsonwebtoken @types/jsonwebtoken`
   - Verify JWT_SECRET environment variable is set