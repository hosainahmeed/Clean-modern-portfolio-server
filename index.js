require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookie.token;
    if (!token) {
      res.status(401).send({ message: "you dont have permisson for that" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_JWT, (err, decoded) => {
      if (err) {
        res.status(404).send({ message: "you dont have permisson for that" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(403).send({ message: "you dont have permisson for that" });
  }
};

async function run() {
  try {
    // await client.connect();
    console.log("Connected to MongoDB!");

    const allSkillsCollection = client.db("profileDb").collection("Skills");
    const aboutCollection = client.db("profileDb").collection("aboutMe");

    // Home route
    app.get("/", (req, res) => {
      res.send("Home page");
    });

    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_JWT, {
          expiresIn: "1d",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: false,
          })
          .send({ success: true, message: "JWT token issued" });
      } catch (error) {
        res.status(401).send({ message: "you dont have permisson for that" });
      }
    });

    // About route

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
        const result = await allSkillsCollection.deleteOne({
          _id: new ObjectId(skillId),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).send({ message: "Failed to delete skill" });
      }
    });

    app.put("/skill/:id", async (req, res) => {
      try {
        const skillId = req.params.id;
        const data = req.body;
        const id = { _id: new ObjectId(skillId) };
        const options = { upsert: true };
        const updateSkill = {
          $set: {
            name: data.name,
            proficiency: data.proficiency,
            experience_years: parseInt(data.experience_years),
            image: data.image,
            category: data.selectedSkillType,
            description: data.description,
          },
        };
        const result = await allSkillsCollection.updateOne(
          id,
          updateSkill,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).send({ message: "Failed to delete skill" });
      }
    });

    app.get("/about", async (req, res) => {
      try {
        const result = await aboutCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error retrieving data", error });
      }
    });

    // Gracefully handle application shutdown
    // process.on("SIGINT", async () => {
    //   await client.close();
    //   console.log("MongoDB connection closed.");
    //   process.exit(0);
    // });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run();

// Start server
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
