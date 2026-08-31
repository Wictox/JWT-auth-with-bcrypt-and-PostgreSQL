# 🔐 JWT Authentication API

A REST API implementing user authentication with JWT tokens —
signup, login, and middleware-protected routes.

![demo](docs/demo.gif)

## 🛠️ Tech
Node.js · Express · PostgreSQL (Docker) · bcrypt · jsonwebtoken

## ⚙️ How it works

Three pieces: a signup route that hashes passwords with bcrypt before
storing them, a login route that verifies the password and returns a
signed JWT, and a middleware that validates the token's signature on
protected routes.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/signup` | No | Create an account |
| POST | `/login` | No | Get a JWT |
| GET | `/protected` | Yes | Example protected route |

## 🚀 Running it

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
Or connect through pgAdmin (host `localhost`, port `5432`) and run
the contents of `schema.sql` in the query tool.

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

## 🧪 Testing

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

## 📝 Notes on building it

**Why JWT over server-side sessions.** JWTs are stateless — the server
stores nothing and only verifies the token's signature on each request.
Any instance can authenticate any request, which avoids needing a shared
session store when running multiple servers. The tradeoff is revocation:
a token stays valid until it expires, so there's no instant logout
without maintaining a blocklist. Short expiry times mitigate this.

**What's in the payload.** Only user id and email. The payload is
base64-encoded, not encrypted, so anyone holding the token can read it —
nothing sensitive goes in there.

**Parameters.** Tokens expire after one hour. Passwords are hashed with
bcrypt at 10 salt rounds.
