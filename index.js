require("dotenv").config()
const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const { connectDB } = require("./config/db")
const mongoose = require('mongoose');


// routes
const announcements = require("./routes/announcements")
const auth = require("./routes/auth")
const product = require("./routes/product")
const orders = require("./routes/orders")
const messages = require("./routes/messages")
const testimonials = require("./routes/testimonials")
const users = require("./routes/users")
const public = require("./routes/public")

const { APP_URL, APP_URL_1, PORT = 8000 } = process.env
connectDB();
const app = express()
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// app.use(cors({
    //     origin: '*',
    //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }))

app.use(morgan("dev"))
app.use(bodyParser.json())

app.get('/cors-test', (req, res) => {
    res.json({ message: "CORS test passed!" });
});

app.get("/", (req, res) => {
    res.send("Server is running ")
})

app.get('/db-test', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    
    res.json({
        message: "DB connection check",
        state: states[state],
        code: state
    });
});

app.use("/announcements", announcements)
app.use("/auth", auth)
app.use("/product", product)
app.use("/orders", orders);
app.use("/messages", messages)
app.use("/testimonials", testimonials)
app.use("/users", users)
app.use("/public", public)


// sendSimpleMessage()
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("")

async function sendSimpleMessage() {
    const msg = {
        to: 'zaiddev60gb@gmail.com',
        from: 'zaidali60gb@gmail.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'hyper colab invited you as a admin',
        html: '<strong>hyper colab invited you as a admin</strong>',
    }

    try {
        await sgMail.send(msg)
        console.log('Email sent successfully')
    } catch (error) {
        console.error(error)
    }
}
// sendSimpleMessage()

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
}).on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try closing the process using it or change the port.`);
        process.exit(1);
    } else {
        console.error('🚨 Server error:', err);
    }
});
