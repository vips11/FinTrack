require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const authMiddleware = require('./middleware/auth')
const transactionsRouter = require('./routes/transactions')
const categoriesRouter = require('./routes/categories')
const recurringRouter = require('./routes/recurring')
const settingsRouter = require('./routes/settings')

const app = express()
app.use(cors())
app.use(express.json())

// Webhook route — no auth (called by Plaid directly)
app.use('/api/webhook', require('./routes/webhook'))

// All other routes require auth
app.use(authMiddleware)

app.use('/api/transactions', transactionsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/recurring', recurringRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/plaid', require('./routes/plaid'))

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`))
  })
  .catch((err) => console.error('MongoDB connection error:', err))
