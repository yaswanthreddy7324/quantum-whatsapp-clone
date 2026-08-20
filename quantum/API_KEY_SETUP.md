# 🔑 IMPORTANT: Configure Your IBM Quantum API Key

## ⚠️ REQUIRED STEP BEFORE RUNNING

You **MUST** configure your IBM Quantum API key for the quantum service to work.

---

## Option 1: Use the Quick Start Script (Recommended)

Run the PowerShell script which will guide you through setup:

```powershell
cd d:\quantum
.\start.ps1
```

The script will:
- Check if Docker is installed
- Prompt you to enter your IBM Quantum API key
- Create the `.env` file automatically
- Start all Docker containers
- Verify all services are running

---

## Option 2: Manual Configuration

### Step 1: Get Your API Key

1. Go to https://quantum-computing.ibm.com/
2. Login or create a free account
3. Click on your profile → Account Settings
4. Copy your **API Token**

### Step 2: Create the .env File

Create a file at `d:\quantum\quantum-service\.env` with this content:

```env
IBM_QUANTUM_API_KEY=your_actual_api_key_here
```

**Replace** `your_actual_api_key_here` with your actual API token from IBM Quantum.

### Step 3: Start the Application

```powershell
cd d:\quantum
docker-compose up --build
```

---

## ✅ Verification

Once started, you should see:

```
quantum-service_1  | 🔬 QUANTUM KEY GENERATION SERVICE
quantum-service_1  | Backend: AerSimulator('aer_simulator')
quantum-service_1  | API Key configured: True
```

If you see `API Key configured: False`, the `.env` file is not set up correctly.

---

## 🚀 After Setup

1. Open http://localhost:3000
2. Register two users (Alice and Bob)
3. Start chatting!
4. Watch the backend console for quantum encryption logs:
   ```powershell
   docker-compose logs -f backend
   ```

---

## 🔒 Security Note

The `.env` file is **gitignored** and will never be committed to version control. Your API key is safe!

---

## 📞 Need Help?

If you encounter issues:

1. **Check Docker is running**: `docker --version`
2. **Verify .env file exists**: `ls quantum-service\.env`
3. **Check file content**: `cat quantum-service\.env`
4. **View logs**: `docker-compose logs quantum-service`

---

**Ready to experience quantum-secured messaging! 🎉⚛️**
