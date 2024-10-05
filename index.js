require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // Import ObjectId

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;
let skillsCollection; // Declare this so we can initialize it after connecting to MongoDB

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Function to generate unique IDs
function generateUniqueId() {
  return new ObjectId().toString(); // Use ObjectId to generate a unique ID
}

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    skillsCollection = client.db("profileDb").collection("skills");

    // Home route
    app.get("/", (req, res) => {
      res.send("Home page");
    });

    // Get all skills
    app.get("/skills", async (req, res) => {
      try {
        const cursor = skillsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).send({ message: "Failed to fetch skills." });
      }
    });

    // Post a new skill
    app.patch("/skills/:id", async (req, res) => {
      try {
        const { id } = req.params; // Get the document ID from the request parameters
        const skillData = req.body; // Get the skill data from the request body

        // Validate data
        if (!skillData || !Object.keys(skillData).length) {
          return res.status(400).send({ message: "Invalid skill data" });
        }

        // Extract the selected skill type
        const selectedSkillType = Object.keys(skillData)[0]; // Get the first key from skillData

        // Use $push to add the new skill into the appropriate array
        const result = await skillsCollection.updateOne(
          { _id: new ObjectId(id) }, // Find the document by ID
          {
            $push: {
              [selectedSkillType]: { // Use the selected skill type here
                _id: generateUniqueId(),
                ...skillData[selectedSkillType], // Spread the skill data for the specific skill type
              },
            },
          }
        );

        // Check if the update was successful
        if (result.modifiedCount === 0) {
          return res.status(404).send({ message: "Skill not found or already added" });
        }

        res.status(200).send({ message: "Skill added successfully", result });
      } catch (error) {
        console.error("Error adding skill:", error);
        res.status(500).send({ message: "Failed to add skill" });
      }
    });

    // Gracefully handle application shutdown to close the MongoDB connection
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
