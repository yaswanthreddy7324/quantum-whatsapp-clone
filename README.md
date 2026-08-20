# Quantum WhatsApp Clone

A production-ready, real-time chat application with quantum cryptography integration using Qiskit and Docker.

## 🚀 Features

- **Real-time Messaging**: Instant bidirectional chat using WebSockets (Socket.IO)
- **Quantum Cryptography**: Message encryption using quantum-generated keys via IBM Quantum
- **BB84 Protocol**: Quantum key distribution implementation
- **JWT Authentication**: Secure user authentication
- **Dockerized**: Complete microservices architecture with Docker Compose
- **MongoDB**: Persistent message and user storage

## 💾 Stopping and Saving

To stop the project without losing your database messages:
```powershell
docker-compose stop
```

To fully remove the containers (but keep your database volume):
```powershell
docker-compose down
```

The database data is stored in a Docker volume named `mongodb-data`. It will persist even if you delete the containers.

---

## 🛠️ Maintenance

- **View Logs**: `docker-compose logs -f backend`
- **Database Shell**: `docker exec -it quantum-mongodb-1 mongosh`
- **Rebuild**: If you change the code, run `docker-compose up --build -d`

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│   Frontend  │◄────►│   Backend   │◄────►│ Quantum Service  │
│  (React)    │      │  (Node.js)  │      │  (Python+Qiskit) │
└─────────────┘      └──────┬──────┘      └──────────────────┘
                            │
                     ┌──────▼──────┐
                     │   MongoDB   │
                     └─────────────┘
```

## 📋 Prerequisites

- Docker & Docker Compose
- IBM Quantum account (free): https://quantum-computing.ibm.com/
- Git

## ⚡ Quick Start

### 1. Clone and Setup

```bash
cd d:\quantum
```

### 2. Configure IBM Quantum API Key

Create `quantum-service/.env`:

```env
IBM_QUANTUM_API_KEY=your_actual_api_key_here
```

Create `backend/.env`:

```env
MONGODB_URI=mongodb://mongodb:27017/quantum-chat
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
QUANTUM_SERVICE_URL=http://quantum-service:5000
PORT=5001
```

### 3. Start the Application

```bash
docker-compose up --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Quantum Service**: http://localhost:5000

## 🧪 Testing the System

### Register Users
1. Open http://localhost:3000
2. Register two users (e.g., Alice and Bob)

### Test Real-time Chat
1. Login as Alice in one browser/tab
2. Login as Bob in another browser/incognito tab
3. Send messages between users
4. Observe instant delivery

### Verify Quantum Encryption
Check the backend console logs:
```
[QUANTUM] Generating quantum key...
[QUANTUM] Key generated: qk_abc123 (256 bits)
[ENCRYPTED] alice → bob: 0x4a3f2e1d...
[SOCKET] Message delivered
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Messages
- `POST /api/messages` - Send message (requires auth)
- `GET /api/messages/:userId` - Get chat history (requires auth)

### Quantum Service
- `POST /generate-key` - Generate quantum encryption key

## 🔐 Security Features

- ✅ API keys stored in `.env` (gitignored)
- ✅ Passwords hashed with bcrypt
- ✅ JWT token authentication
- ✅ Quantum-generated encryption keys
- ✅ No sensitive data in logs

## 🧬 Quantum Cryptography

This project demonstrates quantum key generation using:

1. **Quantum Randomness**: True random number generation using quantum superposition
2. **BB84 Protocol**: Quantum key distribution protocol
3. **Qiskit Integration**: IBM's quantum computing SDK

### How It Works

1. User sends message
2. Backend requests quantum key from quantum service
3. Quantum service creates quantum circuit with Hadamard gates
4. Circuit executed on IBM Quantum simulator/hardware
5. Measurement results converted to encryption key
6. Message encrypted with quantum key
7. Encrypted message stored and transmitted

## 🐳 Docker Services

| Service | Port | Technology |
|---------|------|------------|
| Frontend | 3000 | React + Vite |
| Backend | 5001 | Node.js + Express + Socket.IO |
| Quantum Service | 5000 | Python + Flask + Qiskit |
| MongoDB | 27017 | MongoDB 6.0 |

## 🛠️ Development

### Run Individual Services

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm start
```

**Quantum Service:**
```bash
cd quantum-service
pip install -r requirements.txt
python app.py
```

## 📝 Project Structure

```
quantum-whatsapp-clone/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   └── App.jsx       # Main app
│   └── Dockerfile
├── backend/              # Node.js server
│   ├── src/
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── services/     # Quantum service client
│   └── Dockerfile
├── quantum-service/      # Python quantum service
│   ├── quantum/          # Quantum algorithms
│   │   ├── key_generator.py
│   │   └── bb84.py
│   ├── app.py
│   └── Dockerfile
└── docker-compose.yml    # Orchestration
```

## 🔧 Troubleshooting

### Containers won't start
```bash
docker-compose down -v
docker-compose up --build
```

### Quantum service errors
- Verify IBM Quantum API key in `quantum-service/.env`
- Check Qiskit version compatibility

### Messages not appearing
- Check browser console for Socket.IO connection
- Verify backend logs for errors

## 📚 Technologies Used

- **Frontend**: React, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO, Mongoose, JWT
- **Quantum**: Python, Flask, Qiskit, IBM Quantum Runtime
- **Database**: MongoDB
- **DevOps**: Docker, Docker Compose

## 🎓 Educational Purpose

This project demonstrates:
- Microservices architecture
- Real-time WebSocket communication
- Quantum computing integration
- Containerization best practices
- Full-stack development

## ⚠️ Production Considerations

For production deployment, consider:
- HTTPS/TLS encryption
- Rate limiting
- Input validation and sanitization
- Error handling improvements
- Horizontal scaling
- Key rotation policies
- Monitoring and logging

## 📄 License

MIT License - Educational and demonstration purposes

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment!

---

**Built with ❤️ and ⚛️ Quantum Computing**
