import { Router } from "express";
import { userController } from "../../controllers/user.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  toggleStatusSchema,
} from "../../validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(userQuerySchema, "query"), (req, res, next) => {
  userController.index(req, res, next);
});

router.post("/", validate(createUserSchema, "body"), (req, res, next) => {
  userController.store(req, res, next);
});

router.get("/:id", (req, res, next) => {
  userController.show(req, res, next);
});

router.put("/:id", validate(updateUserSchema, "body"), (req, res, next) => {
  userController.update(req, res, next);
});

router.patch("/:id/status", validate(toggleStatusSchema, "body"), (req, res, next) => {
  userController.toggleStatus(req, res, next);
});

router.delete("/:id", (req, res, next) => {
  userController.destroy(req, res, next);
});

export default router;
