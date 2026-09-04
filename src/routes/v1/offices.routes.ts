import { Router } from "express";
import { officeController } from "../../controllers/office.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { createOfficeSchema, updateOfficeSchema } from "../../validators/office.validator";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  officeController.index(req, res, next);
});

router.post("/", validate(createOfficeSchema, "body"), (req, res, next) => {
  officeController.store(req, res, next);
});

router.get("/:id", (req, res, next) => {
  officeController.show(req, res, next);
});

router.put("/:id", validate(updateOfficeSchema, "body"), (req, res, next) => {
  officeController.update(req, res, next);
});

router.delete("/:id", (req, res, next) => {
  officeController.destroy(req, res, next);
});

export default router;
