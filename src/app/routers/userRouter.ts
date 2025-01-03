import { Router } from "express";
import auth from "../middlewares/auth";
import { getCurrentUser, getUser, getUsers, updateUser, userSignIn, userSignUp } from "../controllers/userController";


const router = Router()

// router.get('/', auth, getUsers)
// router.get('/current-user', auth, getCurrentUser)
// router.get('/:id', auth, getUser)
// router.put('/:id', auth, updateUser)
// router.post('/signup', userSignUp)
// router.post('/signin', userSignIn)

router.get('/', getUsers)
router.get('/current-user', getCurrentUser)
router.get('/:id', getUser)
router.put('/:id', updateUser)
router.post('/signup', userSignUp)
router.post('/signin', userSignIn)

export default router