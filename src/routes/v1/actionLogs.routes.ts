import { Router } from "express";
import { actionLogService } from "../../services/actionLog.service";
import { authenticate } from "../../middlewares/authenticate";
import { formatPaginated } from "../../responses/envelope";
import { ForbiddenError } from "../../types/errors";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ForbiddenError("Admin access required.");
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const result = await actionLogService.listLogs(page, limit);
    res.status(200).json(
      formatPaginated(
        result.logs,
        {
          currentPage: result.page,
          lastPage: result.lastPage,
          perPage: result.limit,
          total: result.total,
        },
        "Action logs retrieved successfully."
      )
    );
  } catch (error) {
    next(error);
  }
});

export default router;
