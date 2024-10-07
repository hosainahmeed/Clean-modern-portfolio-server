require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const allSkillsCollection = client.db("profileDb").collection("Skills");

    // Home route
    app.get("/", (req, res) => {
      res.send("Home page");
    });

    // Get all skills
    app.get("/skill", async (req, res) => {
      try {
        const result = await allSkillsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).send({ message: "Failed to fetch skills." });
      }
    });

    // Add a new skill
    app.post("/skill", async (req, res) => {
      try {
        const result = await allSkillsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.error("Error adding skill:", error);
        res.status(500).send({ message: "Failed to add skill" });
      }
    });
    

    app.delete("/skill/:id", async (req, res) => {
      try {
        const skillId = req.params.id;
        console.log(skillId);
        const result = await allSkillsCollection.deleteOne({ _id: new ObjectId(skillId) });
        res.send(result);
      } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).send({ message: "Failed to delete skill" });
      }
    });
    // Gracefully handle application shutdown
    process.on("SIGINT", async () => {
      await client.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });

  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run();

// Start server
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
