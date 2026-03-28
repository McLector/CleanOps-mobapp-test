import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // In-memory Database
  const users: any[] = [
    { id: "1", email: "customer@cleanops.com", password: "password", role: "customer", name: "Alice Customer", balance: 500, lat: 40.7128, lng: -74.0060 },
    { id: "2", email: "employee@cleanops.com", password: "password", role: "employee", name: "Bob Cleaner", balance: 0, lat: 40.7130, lng: -74.0065 },
  ];
  const jobs: any[] = [];
  const messages: any[] = [];
  const notifications: any[] = [];

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, role } = req.body;
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const newUser = {
      id: Math.random().toString(36).substring(7),
      email,
      password,
      name,
      role,
      balance: role === "customer" ? 500 : 0,
      lat: 40.7128,
      lng: -74.0060,
    };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/users/:id", (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/jobs", (req, res) => {
    const { customerId, location, lat, lng, tasks, urgency, price } = req.body;
    const newJob = {
      id: Math.random().toString(36).substring(7),
      customerId,
      employeeId: null,
      status: "OPEN",
      location,
      lat,
      lng,
      tasks,
      urgency,
      price,
      createdAt: new Date().toISOString(),
    };
    jobs.push(newJob);
    
    // Notify employees
    io.emit("new_job", newJob);
    
    res.json(newJob);
  });

  app.get("/api/jobs", (req, res) => {
    const { userId, role } = req.query;
    let userJobs = [];
    if (role === "customer") {
      userJobs = jobs.filter((j) => j.customerId === userId);
    } else if (role === "employee") {
      userJobs = jobs.filter((j) => j.employeeId === userId);
    }
    res.json(userJobs);
  });

  app.get("/api/jobs/feed", (req, res) => {
    // Return open jobs, sorted by urgency (HIGH first)
    const openJobs = jobs.filter((j) => j.status === "OPEN");
    openJobs.sort((a, b) => {
      const urgencyScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (urgencyScore[b.urgency as keyof typeof urgencyScore] || 0) - (urgencyScore[a.urgency as keyof typeof urgencyScore] || 0);
    });
    res.json(openJobs);
  });

  app.get("/api/jobs/:id", (req, res) => {
    const job = jobs.find((j) => j.id === req.params.id);
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  });

  app.post("/api/jobs/:id/claim", (req, res) => {
    const { employeeId } = req.body;
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== "OPEN") return res.status(400).json({ error: "Job is not open" });

    job.employeeId = employeeId;
    job.status = "IN_PROGRESS";
    
    io.to(`job_${job.id}`).emit("job_status_updated", job);
    
    // Notify customer
    const notification = {
      id: Math.random().toString(36).substring(7),
      userId: job.customerId,
      type: "JOB_ASSIGNED",
      message: "A cleaner has claimed your job.",
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    io.to(`user_${job.customerId}`).emit("notification", notification);

    res.json(job);
  });

  app.post("/api/jobs/:id/status", (req, res) => {
    const { status } = req.body;
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    job.status = status;
    io.to(`job_${job.id}`).emit("job_status_updated", job);

    if (status === "PENDING_REVIEW") {
      const notification = {
        id: Math.random().toString(36).substring(7),
        userId: job.customerId,
        type: "JOB_REVIEW",
        message: "Your job is ready for review.",
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifications.push(notification);
      io.to(`user_${job.customerId}`).emit("notification", notification);
    }

    res.json(job);
  });

  app.post("/api/jobs/:id/approve", (req, res) => {
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== "PENDING_REVIEW") return res.status(400).json({ error: "Job is not pending review" });

    job.status = "COMPLETED";
    
    // Mock payment
    const customer = users.find(u => u.id === job.customerId);
    const employee = users.find(u => u.id === job.employeeId);
    
    if (customer && employee) {
      customer.balance -= job.price;
      employee.balance += job.price;
    }

    io.to(`job_${job.id}`).emit("job_status_updated", job);

    const notification = {
      id: Math.random().toString(36).substring(7),
      userId: job.employeeId,
      type: "JOB_COMPLETED",
      message: "Your job was approved and payment has been sent.",
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    io.to(`user_${job.employeeId}`).emit("notification", notification);

    res.json(job);
  });

  app.get("/api/jobs/:id/messages", (req, res) => {
    const jobMessages = messages.filter((m) => m.jobId === req.params.id);
    res.json(jobMessages);
  });

  app.get("/api/notifications", (req, res) => {
    const { userId } = req.query;
    const userNotifications = notifications.filter((n) => n.userId === userId);
    res.json(userNotifications);
  });

  // Socket.IO
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_user", (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on("join_job", (jobId) => {
      socket.join(`job_${jobId}`);
    });

    socket.on("send_message", (data) => {
      const message = {
        id: Math.random().toString(36).substring(7),
        jobId: data.jobId,
        senderId: data.senderId,
        text: data.text,
        createdAt: new Date().toISOString(),
      };
      messages.push(message);
      io.to(`job_${data.jobId}`).emit("new_message", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
