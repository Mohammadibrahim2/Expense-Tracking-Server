const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
const formidableMiddleware = require('express-formidable');
const port = process.env.PORT || 5000;

const dotenv = require("dotenv")

require('dotenv').config()


//mohammadibrahim6454
//uAGAki3EfhMku2MW
// // 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const moment = require('moment')

const uri = "mongodb+srv://mohammadibrahim6454:uAGAki3EfhMku2MW@cluster0.vgxho.mongodb.net/tasks";
const client = new MongoClient(uri, (err) => {
    if (!err) {
        console.log("db connected successfully")
    }
    console.log(err)
}, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        const categoryCollection = client.db("categories").collection("categoryCollection");
        const expanseCollection = client.db("expanse").collection("expanseCollection");
        const monthlyLimitCollection = client.db("monthlyLimit").collection("monthlyLimitCollection");

        //set monthly limits:
        app.post('/api/monthlyLimit', async (req, res) => {

            const { monthlyLimit } = req.body;
          
            const newMonthlyLimit = parseFloat(monthlyLimit);

            if (isNaN(newMonthlyLimit)) {
                return res.status(400).send({ error: "Invalid monthly limit valuer." })
            }

            // Find the existing data
            const existingData = await monthlyLimitCollection.findOne({});

            if (existingData) {
                // Convert the stored `monthlyLimit` to a number
                const existingLimit = parseFloat(existingData.monthlyLimit || 0);

                if (isNaN(existingLimit)) {
                    return res.status(400).send({ error: "Stored monthly limit value is not a valid number." })
                }

                const updatedMonthlyLimit = existingLimit + newMonthlyLimit;

                // Update the document in the database
                await monthlyLimitCollection.updateOne(
                    {},
                    { $set: { monthlyLimit: updatedMonthlyLimit } }
                );

                res.status(200).send({
                    success: `Successfully updated monthly limit to ${updatedMonthlyLimit}!`
                });
            } else {

                await monthlyLimitCollection.insertOne({ monthlyLimit: newMonthlyLimit });

                res.status(200).send({
                    success: `Successfully added monthly limit data: ${newMonthlyLimit}`
                });
            }
        });

        app.get("/api/monthlyLimit", async (req, res) => {
            try {
                // Fetch the first document from the collection
                const existingData = await monthlyLimitCollection.findOne({});
        
                if (existingData) {
                    // console.log("Raw data from DB:", existingData);  
                    
                   
                    let monthlyLimit = parseFloat(existingData.monthlyLimit);
                    let value = parseFloat(existingData.value);
        
                    // Check if the `monthlyLimit` or `value` are invalid (NaN)
                    if (isNaN(monthlyLimit)) {
                        console.log("Invalid monthlyLimit:", existingData.monthlyLimit);
                        monthlyLimit = 0;  
                    }
                    if (isNaN(value)) {
                        // console.log("Invalid value:", existingData.value);
                        value = 0;  
                    }
        
                    
                    res.status(200).send({
                        _id: existingData._id,
                        monthlyLimit: monthlyLimit,
                        value: value
                    });
                } else {
                    // If no data is found
                    res.status(404).send({ message: "No monthly limit data found." });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                res.status(500).send({ error: "An error occurred while fetching the data." });
            }
        });
        

        //create expenses:-

        app.post('/api/tasks', async (req, res) => {
            const task = req.body;
            // console.log(task);

            const result = await expanseCollection.insertOne(task);
            res.status(200).send({

                success: "successfully added an expens data!"

            })
        });

        //tasks getting:-
        app.get("/tasks", async (req, res) => {

            const groupByDate = (data) => {
                const groupedData = data.reduce((result, record) => {
                    // Normalize the date (remove time)
                    const dateOnly = new Date(record.expansesDate).toDateString();

                    // Initialize group if not present
                    if (!result[dateOnly]) {
                        result[dateOnly] = { count: 0, records: [] };
                    }

                    // Add record to group and increment count
                    result[dateOnly].count += 1;
                    result[dateOnly].records.push(record);

                    return result;
                }, {});


                return groupedData;
            };


            const query = {};

            const results = await expanseCollection.find(query).toArray();
            // Calculate Total Expenses
            const calculateTotalExpenses = (data) => {
                let totalExpenses = 0;

                // Loop through each day's records
                for (const date in data) {
                    const records = data[date].records;
                    records.forEach(record => {
                        totalExpenses += parseFloat(record.value);
                    });
                }

                return totalExpenses;
            };



            const groupedExpenses = groupByDate(results);
            // Run the Calculation
            const total = calculateTotalExpenses(groupedExpenses);
            // console.log("Total Expenses:", total);
            res.send(groupedExpenses);

        });
        app.get("/api/queryByCategory", async (req, res) => {
            const query = {};
            const results = await expanseCollection.find(query).toArray()
            res.send(results)
        })
        //tasks delete:-

        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id


            const query = { _id: new ObjectId(id) }


            const result = await tasksCollection.deleteOne(query)

            res.send({
                message: "successfully deleted", result
            });
        });

        //tasks updated:-

        app.put('/tasks/:id', async (req, res) => {
            const task = req.body
            const id = req.params.id

            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    name: task.name,
                    value: task.value,

                }
            }
            const result = await tasksCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        });

        //create category and set it's limit
        app.post('/api/category', async (req, res) => {
            const { limit, category } = req.body;
            const newcatgory={limit,category}
            console.log(newcatgory);

            const result = await categoryCollection.insertOne(newcatgory);
            res.status(200).send({
                success: "successfully created a category !"
            })
        })
        //get the categories:
        app.get('/api/category', async (req, res) => {
            const query = {};
            const results = await categoryCollection.find(query).toArray()
            res.status(200).send({
                results
            })
        })

    }
    finally {

    }
}
run().catch(console.dir)







app.listen(port, () => {
    console.log("Server is okey! ", port)
})