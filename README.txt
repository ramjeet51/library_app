# 📚 Library Management System – Kubernetes Deployment

A full-stack Library Management System built using:

- ⚡ FastAPI (Backend)
- ⚛ Next.js (Frontend)
- 🗄 MySQL
- 🐳 Docker
- ☸ Kubernetes (Minikube)
- 🔐 ConfigMap & Secrets
- 💾 Persistent Volume (PVC)

This project demonstrates a complete production-style 3-tier Kubernetes deployment.

---

# 🏗 Architecture

Browser  
↓  
Frontend (Next.js)  
↓  
Backend (FastAPI)  
↓  
MySQL Database  

### Kubernetes Components Used

- Deployments (Frontend, Backend, MySQL)
- Services (ClusterIP, LoadBalancer)
- ConfigMap (Non-sensitive configuration)
- Secret (Sensitive credentials)
- PersistentVolumeClaim (Database storage)
- Readiness & Liveness Probes

---

# 📁 Project Structure

library_app/

├── backend/  
│   ├── main.py  
│   ├── models.py  
│   ├── database.py  
│   ├── config.py  
│   ├── requirements.txt  
│   └── Dockerfile  

├── frontend/  
│   ├── app/  
│   ├── package.json  
│   ├── next.config.ts  
│   └── Dockerfile  

├── k8s/  
│   ├── namespace.yaml  
│   ├── configmap.yaml  
│   ├── secret.yaml  
│   ├── pvc.yaml  
│   ├── mysql.yaml  
│   ├── backend.yaml  
│   ├── frontend.yaml  
│   └── services.yaml  

└── README.md  

---

# 🚀 Features

- User Registration & Login (JWT Authentication)
- Book Issue & Return
- Fine Calculation
- Student History API
- Secure Environment Variables
- Production-level Kubernetes setup

---

# 🐳 Docker Build Instructions

## Backend

```bash
cd backend
docker build -t <your-dockerhub-username>/library_app-backend:v1 .
docker push <your-dockerhub-username>/library_app-backend:v1
```

## Frontend

```bash
cd frontend
docker build -t <your-dockerhub-username>/library_app-frontend:v1 .
docker push <your-dockerhub-username>/library_app-frontend:v1
```

---

# ☸ Kubernetes Deployment (Minikube)

## 1️⃣ Start Minikube

```bash
minikube start
```

---

## 2️⃣ Create Namespace

```bash
kubectl create namespace library
```

---

## 3️⃣ Apply Kubernetes Files

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f mysql.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f services.yaml
```

---

## 4️⃣ Enable LoadBalancer Access

Run this command (keep terminal running):

```bash
minikube tunnel
```

---

## 5️⃣ Access Application

Frontend:

http://localhost:3000

Backend Swagger:

http://localhost:8000/docs

If backend is ClusterIP, use port-forward:

```bash
kubectl port-forward svc/backend 8000:8000 -n library
```

---

# 🔐 Environment Variables

### ConfigMap

- DB_HOST
- DB_PORT
- MYSQL_DATABASE
- MYSQL_USER
- JWT_EXPIRE_MIN

### Secret

- MYSQL_PASSWORD
- JWT_SECRET

---

# 🛠 Troubleshooting

### Image Pull Error

```bash
docker push <your-image>:tag
```

---

### CrashLoopBackOff

```bash
kubectl logs <pod-name> -n library --previous
```

---

### CORS Error

Ensure FastAPI CORS middleware is enabled:

```python
from fastapi.middleware.cors import CORSMiddleware
```

---

# 📈 Future Improvements

- Add Ingress Controller
- Enable HTTPS (cert-manager)
- Implement HPA (Horizontal Pod Autoscaler)
- Setup CI/CD with GitHub Actions
- Deploy on AWS EKS

---

# 👨‍💻 Author

Ramjeet Prajapati  
DevOps Engineer  

---

# 🏆 Project Highlights

✔ Full-stack containerization  
✔ Production-style Kubernetes deployment  
✔ Secure configuration using Secrets  
✔ Persistent database storage  
✔ Real-world debugging experience  
✔ DevOps best practices implementation  

