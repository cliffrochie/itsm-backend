import { Router } from "express";
import { clientController } from "../../controllers/client.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
} from "../../validators/client.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(clientQuerySchema, "query"), (req, res, next) => {
  clientController.index(req, res, next);
});

router.post("/", validate(createClientSchema, "body"), (req, res, next) => {
  clientController.store(req, res, next);
});

router.get("/:id", (req, res, next) => {
  clientController.show(req, res, next);
});

router.put("/:id", validate(updateClientSchema, "body"), (req, res, next) => {
  clientController.update(req, res, next);
});

router.delete("/:id", (req, res, next) => {
  clientController.destroy(req, res, next);
});

export default router;
