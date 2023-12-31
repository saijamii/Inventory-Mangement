const express = require("express");
const fs = require("fs");
const parse = require("csv-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://saijami:EcUpT3Et6dpojJz3@atlascluster.iotmmxp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const dataBase = client.db("royal");
const collection = dataBase.collection("products");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`API is Running on port ${PORT}`);
});

app.get("/inventoryProducts", async (req, res) => {
  const products = await getInventory();
  res.status(200).json(products);
});

const getInventory = async () => {
  try {
    const result = await collection.find().toArray();
    return result.slice(0, 100);
  } catch (error) {
    console.log(`ERROR : ${error}`);
  }
};

app.get("/getProductDetail/:id", async (req, res) => {
  const user = await getUserById(req.params.id);
  res.status(200).json(user);
});

async function getUserById(id) {
  const user = await collection.findOne({ _id: new ObjectId(id) });
  return user;
}

app.post("/addInventory", (req, res) => {
  console.log(req.body);
  let dataJson = JSON.parse(JSON.stringify(req.body));
  console.log(dataJson, "dataJson");
  addProducts(dataJson);
  res.status(200).json(dataJson);
});

const addProducts = async (dataJson) => {
  try {
    const result = await collection.insertOne(dataJson);
    console.log(`Saved response with ID: ${result.insertedId}`);
  } catch (error) {
    console.error(`Error : ${error}`);
  }
};

app.delete("/deleteProduct/:id", async (req, res) => {
  const id = req.params.id;
  const success = await deleteProductById(id);
  if (success) {
    res.json({ message: "User Deleted Successfully" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

const deleteProductById = async (id) => {
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

const readCSVFile = (filePath) => {
  const data = [];
  const finalData = [];
  fs.createReadStream(filePath)
    .pipe(parse())
    .on("row", (row) => {
      data.push({
        sku: row[0],
        productName: row[1],
        description: row[2],
        brand: row[3],
        category: row[4],
        finish: row[5],
        cost: row[6],
        price: row[7],
        qty: row[8],
        discontinued: row[9],
      });
    })
    .on("data", async (query) => {
      finalData.push(query);
    })
    .on("end", async () => {
      console.log(finalData, "data");
      // await collection.insertMany(finalData);
      // console.log(
      //   "CSV file successfully processed and data inserted into MongoDB"
      // );
    })
    .on("error", (error) => {
      console.log(`Error reading CSV file: ${error}`);
    });
};

const csvFilePath = "../CSV/BL_Inventory_Products.csv";
readCSVFile(csvFilePath);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
