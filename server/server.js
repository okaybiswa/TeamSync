
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// 1. Check whether the backend is running
app.get("/", (req, res) => {
  res.send("TeamSync Backend is running 🚀");
});

// 2. Register a new user
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const users = await db.orm.public.User.all();

    if (users.some((user) => user.email === email)) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash =
      salt + ":" +
      crypto.scryptSync(password, salt, 64).toString("hex");

    const user = await db.orm.public.User.create({
      name,
      email,
      passwordHash,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

// 3. Log in an existing user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const users = await db.orm.public.User.all();
    const user = users.find((item) => item.email === email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const [salt, storedHash] = user.passwordHash.split(":");
    const suppliedHash = crypto.scryptSync(password, salt, 64);

    const storedBuffer = Buffer.from(storedHash, "hex");

    if (
      suppliedHash.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(suppliedHash, storedBuffer)
    ) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// 4. Create a workspace and make its creator the owner
app.post("/workspaces", async (req, res) => {
  try {
    const { name, description, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({
        error: "Workspace name and userId are required",
      });
    }

    const users = await db.orm.public.User.all();
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create the workspace and membership together.
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.orm.public.Workspace.create({
        name,
        description: description || null,
      });

      await tx.orm.public.WorkspaceMember.create({
        userId,
        workspaceId: workspace.id,
        role: "owner",
      });

      return workspace;
    });

    res.status(201).json({
      message: "Workspace created successfully",
      workspace: {
        id: result.id,
        name: result.name,
        description: result.description,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not create workspace",
    });
  }
});

// 5. Get all workspaces belonging to a user
app.get("/workspaces/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const memberships = await db.orm.public.WorkspaceMember.all();
    const workspaces = await db.orm.public.Workspace.all();

    const userWorkspaces = memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => {
        const workspace = workspaces.find(
          (item) => item.id === membership.workspaceId
        );

        if (!workspace) return null;

        return {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          role: membership.role,
        };
      })
      .filter(Boolean);

    res.json({ workspaces: userWorkspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not fetch workspaces",
    });
  }
});


app.post("/channels", async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({
        error: "Channel name and workspaceId are required",
      });
    }

    const workspaces = await db.orm.public.Workspace.all();
    const workspace = workspaces.find(
      (item) => item.id === workspaceId
    );

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    const channels = await db.orm.public.Channel.all();

    if (
      channels.some(
        (channel) =>
          channel.workspaceId === workspaceId &&
          channel.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      return res.status(409).json({
        error: "Channel already exists in this workspace",
      });
    }

    const channel = await db.orm.public.Channel.create({
      name: name.trim().replace(/^#/, ""),
      description: description || null,
      workspaceId,
    });

    res.status(201).json({
      message: "Channel created successfully",
      channel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not create channel",
    });
  }
});

app.get("/channels/workspace/:workspaceId", async (req, res) => {
  try {
    const channels = await db.orm.public.Channel.all();

    const workspaceChannels = channels.filter(
      (channel) => channel.workspaceId === req.params.workspaceId
    );

    res.json({ channels: workspaceChannels });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not fetch channels",
    });
  }
});

/* Send a message */
app.post("/messages", async (req, res) => {
  try {
    const { content, userId, channelId } = req.body;

    if (!content?.trim() || !userId || !channelId) {
      return res.status(400).json({
        error: "Message content, userId and channelId are required",
      });
    }

    const users = await db.orm.public.User.all();
    const channels = await db.orm.public.Channel.all();

    if (!users.some((user) => user.id === userId)) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!channels.some((channel) => channel.id === channelId)) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const message = await db.orm.public.Message.create({
      content: content.trim(),
      userId,
      channelId,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not send message" });
  }
});

/* Get messages in a channel */
app.get("/messages/channel/:channelId", async (req, res) => {
  try {
    const messages = await db.orm.public.Message.all();
    const users = await db.orm.public.User.all();

    const channelMessages = messages
      .filter((message) => message.channelId === req.params.channelId)
      .sort((a, b) =>
  String(a.createdAt).localeCompare(String(b.createdAt))
)
      .map((message) => {
        const user = users.find((item) => item.id === message.userId);

        return {
          id: message.id,
          content: message.content,
          userId: message.userId,
          userName: user?.name || "Unknown user",
          channelId: message.channelId,
          createdAt: message.createdAt,
        };
      });

    res.json({ messages: channelMessages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

/* Create a task */
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, workspaceId, status } = req.body;

    if (!title?.trim() || !workspaceId) {
      return res.status(400).json({
        error: "Task title and workspaceId are required",
      });
    }

    const workspaces = await db.orm.public.Workspace.all();
    const workspace = workspaces.find(
      (item) => item.id === workspaceId
    );

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    const taskStatus = status || "TODO";

    if (!allowedStatuses.includes(taskStatus)) {
      return res.status(400).json({
        error: "Invalid task status",
      });
    }

    const task = await db.orm.public.Task.create({
      title: title.trim(),
      description: description || null,
      workspaceId,
      status: taskStatus,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create task" });
  }
});

/* Get tasks for a workspace */
app.get("/tasks/workspace/:workspaceId", async (req, res) => {
  try {
    const tasks = await db.orm.public.Task.all();

    const workspaceTasks = tasks
      .filter((task) => task.workspaceId === req.params.workspaceId)
      .sort((a, b) =>
  String(b.createdAt).localeCompare(String(a.createdAt))
);

    res.json({ tasks: workspaceTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch tasks" });
  }
});

/* Update a task's status */

/* Update a task's status */


app.patch("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid task status" });
    }

    const updatedTask = await db.orm.public.Task
      .where({ id: taskId })
      .update({ status });

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Task update error:", error);
    res.status(500).json({ error: "Could not update task" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TeamSync backend running on port ${PORT}`);
});
