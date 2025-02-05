import { Router } from "express";
import auth from "../middlewares/auth";
import { createOffice, getOffice, getOffices, removeOffice, updateOffice } from "../controllers/officeController";


const router = Router()

router.get('/', auth, getOffices)
router.get('/:officeId', auth, getOffice)
router.post('/', auth, createOffice)
router.put('/:officeId', auth, updateOffice)
router.delete('/:officeId', auth, removeOffice)

// router.get('/', getOffices)
// router.get('/:officeId', getOffice)
// router.post('/', createOffice)
// router.put('/:officeId', updateOffice)
// router.delete('/:officeId', removeOffice)

export default router