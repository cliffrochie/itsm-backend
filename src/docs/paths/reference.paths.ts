import { z } from "zod";
import {
  registry,
  bearerAuth,
  successEnvelope,
  errorResponses,
  jsonBody,
  okResponse,
  idParam,
} from "../registry";
import { createOfficeSchema, updateOfficeSchema } from "../../validators/office.validator";
import {
  createDesignationSchema,
  updateDesignationSchema,
} from "../../validators/designation.validator";
import { officeSchema, designationSchema } from "../schemas";

const security = [{ [bearerAuth.name]: [] }];

/**
 * Offices and designations are lookup tables with identical rules: readable by
 * any authenticated user so the clients can populate select inputs, writable by
 * administrators only.
 */
function registerReferenceDomain(config: {
  tag: string;
  path: string;
  noun: string;
  entity: z.ZodType;
  createSchema: z.ZodType;
  updateSchema: z.ZodType;
}) {
  const tags = [config.tag];
  const { path, noun, entity } = config;

  registry.registerPath({
    method: "get",
    path: `/api/v1/${path}`,
    tags,
    security,
    summary: `List ${path}`,
    responses: {
      200: okResponse(
        successEnvelope(z.array(entity), `${config.tag} retrieved successfully.`),
        `All ${path}.`
      ),
      ...errorResponses(),
    },
  });

  registry.registerPath({
    method: "post",
    path: `/api/v1/${path}`,
    tags,
    security,
    summary: `Create ${noun}`,
    description: "Administrators only.",
    request: jsonBody(config.createSchema),
    responses: {
      201: okResponse(successEnvelope(entity, `${noun} created successfully.`), "Created."),
      ...errorResponses({ validation: true, forbidden: true }),
    },
  });

  registry.registerPath({
    method: "get",
    path: `/api/v1/${path}/{id}`,
    tags,
    security,
    summary: `Get ${noun}`,
    request: { params: idParam },
    responses: {
      200: okResponse(successEnvelope(entity, `${noun} retrieved successfully.`), `The ${noun}.`),
      ...errorResponses({ notFound: true }),
    },
  });

  registry.registerPath({
    method: "put",
    path: `/api/v1/${path}/{id}`,
    tags,
    security,
    summary: `Update ${noun}`,
    description: "Administrators only.",
    request: { params: idParam, ...jsonBody(config.updateSchema) },
    responses: {
      200: okResponse(successEnvelope(entity, `${noun} updated successfully.`), "Updated."),
      ...errorResponses({ validation: true, forbidden: true, notFound: true }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: `/api/v1/${path}/{id}`,
    tags,
    security,
    summary: `Delete ${noun}`,
    description: "Administrators only.",
    request: { params: idParam },
    responses: {
      200: okResponse(successEnvelope(z.null(), `${noun} deleted successfully.`), "Deleted."),
      ...errorResponses({ forbidden: true, notFound: true }),
    },
  });
}

registerReferenceDomain({
  tag: "Offices",
  path: "offices",
  noun: "an office",
  entity: officeSchema,
  createSchema: createOfficeSchema,
  updateSchema: updateOfficeSchema,
});

registerReferenceDomain({
  tag: "Designations",
  path: "designations",
  noun: "a designation",
  entity: designationSchema,
  createSchema: createDesignationSchema,
  updateSchema: updateDesignationSchema,
});
