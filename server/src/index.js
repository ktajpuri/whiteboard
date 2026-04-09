require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
require('./config/passport')

const authRoutes = require('./routes/auth')
const deckRoutes = require('./routes/decks')
const slideRoutes = require('./routes/slides')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(passport.initialize())

app.use('/auth', authRoutes)
app.use('/api/decks', deckRoutes)
app.use('/api/decks', slideRoutes)
app.use(errorHandler)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
