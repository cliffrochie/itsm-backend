import { Router } from "express";
import auth from "../middlewares/auth";
import { createDesignation, getDesignation, getDesignations, removeDesignation, updateDesignation } from "../controllers/designationController";


const router = Router()

// router.get('/', auth, getDesignations)
// router.get('/:designationId', auth, getDesignation)
// router.post('/', auth, createDesignation)
// router.put('/:designationId', auth, updateDesignation)
// router.delete('/:designationId', auth, removeDesignation)

router.get('/', getDesignations)
router.get('/:designationId', getDesignation)
router.post('/', createDesignation)
router.put('/:designationId', updateDesignation)
router.delete('/:designationId', removeDesignation)

export default router