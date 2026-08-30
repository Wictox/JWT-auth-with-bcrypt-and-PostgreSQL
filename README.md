# JWT Authentication API

A REST API implementing user authentication with JWT tokens, built with Node.js, Express, and PostgreSQL.

## Features
- User signup with bcrypt password hashing
- Login endpoint issuing signed JWTs
- Middleware-protected routes

## Stack
Node.js, Express, PostgreSQL (Docker), bcrypt, jsonwebtoken

## Setup

**1. Start PostgreSQL**
```bash
docker run --name auth-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql \
  -d postgres
```

**2. Create the table**
```bash
docker exec -i auth-postgres psql -U postgres < schema.sql
```
Or connect to the server through pgAdmin (host `localhost`, port `5432`) and run the contents of `schema.sql` in the query tool.

**3. Install dependencies**
```bash
npm install
```

**4. Configure environment**
```bash
cp .env.example .env   # then fill in your values
```

**5. Run**
```bash
node server.js
```

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/signup` | No | Create an account |
| POST | `/login` | No | Get a JWT |
| GET | `/protected` | Yes | Example protected route |

## Testing

```bash
# Sign up
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"test123"}'

# Log in — returns a token
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"test123"}'

# Access the protected route with the token
curl http://localhost:3000/protected \
  -H "Authorization: Bearer <paste_token_here>"

# Without a token — should return 401
curl http://localhost:3000/protected
```

## Notes

Tokens expire after one hour. Passwords are hashed with bcrypt using 10 salt rounds. The JWT payload contains only the user id and email — nothing sensitive, since the payload is base64-encoded and readable by anyone holding the token.

JWT was chosen over server-side sessions because it is stateless: the server stores nothing and only verifies the token's signature on each request. This means any instance can authenticate any request, which avoids needing a shared session store when running multiple servers. The tradeoff is revocation — a token stays valid until it expires, so there is no instant logout without maintaining a blocklist. Short expiry times mitigate this.