import { Router } from "express";
import { designationController } from "../../controllers/designation.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { createDesignationSchema, updateDesignationSchema } from "../../validators/designation.validator";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  designationController.index(req, res, next);
});

router.post("/", validate(createDesignationSchema, "body"), (req, res, next) => {
  designationController.store(req, res, next);
});

router.get("/:id", (req, res, next) => {
  designationController.show(req, res, next);
});

router.put("/:id", validate(updateDesignationSchema, "body"), (req, res, next) => {
  designationController.update(req, res, next);
});

router.delete("/:id", (req, res, next) => {
  designationController.destroy(req, res, next);
});

export default router;
