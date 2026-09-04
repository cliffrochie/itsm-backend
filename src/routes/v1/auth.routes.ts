import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { loginSchema } from "../../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginSchema, "body"), (req, res, next) => {
  authController.login(req, res, next);
});

router.get("/me", authenticate, (req, res, next) => {
  authController.me(req, res, next);
});

router.delete("/logout", authenticate, (req, res, next) => {
  authController.logout(req, res, next);
});

export default router;
