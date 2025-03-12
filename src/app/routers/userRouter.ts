import { Router } from "express";
import auth from "../middlewares/auth";
import { 
  getCurrentUser, 
  getUser, 
  getUsers, 
  updateUser, 
  userSignIn, 
  userSignUp, 
  userSignOut, 
  getTotalUserRoles, 
  getClientDetails, 
  changePassword} from "../controllers/userController";


const router = Router()

router.get('/', auth, getUsers)
router.get('/current-user', auth, getCurrentUser)
router.get('/client-details', auth, getClientDetails)
router.get('/total-user-role', auth, getTotalUserRoles)
router.get('/:id', auth, getUser)
router.post('/signout', userSignOut)
router.post('/signup', userSignUp)
router.post('/signin', userSignIn)
router.put('/:id', auth, updateUser)
router.patch('/:id/change-password', auth, changePassword)


// router.get('/', getUsers)
// router.get('/current-user', getCurrentUser)
// router.get('/:id', getUser)
// router.put('/:id', updateUser)
// router.post('/signup', userSignUp)
// router.post('/signin', userSignIn)

export default router