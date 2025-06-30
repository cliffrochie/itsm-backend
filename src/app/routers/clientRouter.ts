import { Router } from "express";
import auth from "../middlewares/auth";
import {
  createClient,
  getClient,
  getClients,
  removeClient,
  updateClient,
} from "../controllers/clientController";

const router = Router();

router.get("/", auth, getClients);
router.get("/:clientId", auth, getClient);
router.post("/", auth, createClient);
router.put("/:clientId", auth, updateClient);
router.delete("/:clientId", auth, removeClient);

// router.get('/', getClients)
// router.get('/:clientId', getClient)
// router.post('/', createClient)
// router.put('/:clientId', updateClient)
// router.delete('/:clientId', removeClient)

export default router;
