# Quantum WhatsApp Clone - Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Get Your IBM Quantum API Key

1. Go to https://quantum-computing.ibm.com/
2. Create a free account or login
3. Navigate to your account settings
4. Copy your API token

### Step 2: Configure Environment Variables

Create `quantum-service/.env` file with your API key:

```bash
IBM_QUANTUM_API_KEY=your_actual_api_key_here
```

**IMPORTANT**: Replace `your_actual_api_key_here` with your real IBM Quantum API key!

### Step 3: Start the Application

Run the following command in the project root directory:

```bash
docker-compose up --build
```

This will:
- Build all 4 Docker containers (frontend, backend, quantum-service, mongodb)
- Start all services
- Connect them via Docker network

### Step 4: Access the Application

Once all containers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Quantum Service**: http://localhost:5000

### Step 5: Test the System

1. **Register Users**:
   - Open http://localhost:3000
   - Click "Need an account? Register"
   - Create user "Alice"
   - In another browser/incognito tab, create user "Bob"

2. **Start Chatting**:
   - Login as Alice
   - Select Bob from the user list
   - Send a message
   - Switch to Bob's tab and see the message appear instantly!

3. **Check Backend Console**:
   - Look at the Docker logs to see quantum encryption in action:
   ```bash
   docker-compose logs -f backend
   ```

   You should see:
   ```
   [MESSAGE] Alice → Bob
   [QUANTUM] Requesting quantum key...
   [QUANTUM] Key generated: qk_bb84_...
   [ENCRYPTED] Message: 4a3f2e1d...
   [SOCKET] Message delivered ✓
   ```

## 🔧 Troubleshooting

### Issue: Containers won't start

**Solution**:
```bash
docker-compose down -v
docker-compose up --build
```

### Issue: "Failed to connect to quantum service"

**Solution**:
1. Check if quantum service container is running: `docker ps`
2. Verify your IBM API key is set in `quantum-service/.env`
3. Check quantum service logs: `docker-compose logs quantum-service`

### Issue: Messages not appearing in real-time

**Solution**:
1. Check browser console for Socket.IO connection errors
2. Verify backend is running: `docker-compose logs backend`
3. Make sure both users are logged in

### Issue: MongoDB connection error

**Solution**:
```bash
docker-compose down -v
docker volume rm quantum_mongodb-data
docker-compose up --build
```

## 📝 Environment Variables Reference

### Backend (.env)
```env
MONGODB_URI=mongodb://mongodb:27017/quantum-chat
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
QUANTUM_SERVICE_URL=http://quantum-service:5000
PORT=5001
```

### Quantum Service (.env)
```env
IBM_QUANTUM_API_KEY=your_ibm_quantum_api_key_here
```

## 🧪 Testing Quantum Features

### Test Quantum Key Generation

```bash
curl -X POST http://localhost:5000/generate-key \
  -H "Content-Type: application/json" \
  -d '{"length": 256, "protocol": "bb84"}'
```

Expected response:
```json
{
  "success": true,
  "key": "a1b2c3d4...",
  "key_id": "qk_bb84_20231223...",
  "metadata": {
    "length": 256,
    "protocol": "BB84",
    "qber": 0.0,
    "matching_rate": 0.5
  }
}
```

## 🎯 What to Expect

### Real-time Messaging
- Messages appear **instantly** in both sender and receiver UI
- No page refresh needed
- Typing indicators show when someone is typing

### Quantum Encryption
- Every message gets a unique quantum-generated key
- BB84 protocol ensures quantum security
- Backend console shows encryption process

### Backend Console Output
```
[SOCKET] User connected: Alice (507f1f77bcf86cd799439011)
[MESSAGE] Alice → Bob
[MESSAGE] Content: "Hello from the quantum realm!"
[QUANTUM] Requesting quantum key...
[QUANTUM] Key generated: qk_bb84_20231223104530123456
[QUANTUM] Protocol: BB84
[QUANTUM] QBER: 0.0000
[ENCRYPTED] Sender: Alice | Receiver: Bob
[ENCRYPTED] Message: 4a3f2e1d8c9b7a6f...
[ENCRYPTED] Key ID: qk_bb84_20231223104530123456
[DATABASE] Message saved
[SOCKET] Message delivered to Bob
[SOCKET] Message flow completed ✓
```

## 🛑 Stopping the Application

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## 📚 Additional Resources

- **IBM Quantum**: https://quantum-computing.ibm.com/
- **Qiskit Documentation**: https://qiskit.org/documentation/
- **BB84 Protocol**: https://en.wikipedia.org/wiki/BB84
- **Socket.IO**: https://socket.io/docs/

## ✅ Success Checklist

- [ ] IBM Quantum API key configured in `quantum-service/.env`
- [ ] All 4 containers running (`docker ps` shows 4 containers)
- [ ] Frontend accessible at http://localhost:3000
- [ ] Can register and login users
- [ ] Messages send and receive in real-time
- [ ] Backend console shows quantum encryption logs
- [ ] No errors in `docker-compose logs`

---

**Congratulations! You now have a fully functional Quantum-Secured WhatsApp Clone! 🎉⚛️**
