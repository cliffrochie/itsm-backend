import { relations } from "drizzle-orm";
import { users } from "./users";
import { offices } from "./offices";
import { designations } from "./designations";
import { clients } from "./clients";
import { serviceTickets } from "./serviceTickets";
import { serviceTicketHistories } from "./serviceTicketHistories";
import { notifications } from "./notifications";
import { actionLogs } from "./actionLogs";

export * from "./users";
export * from "./offices";
export * from "./designations";
export * from "./clients";
export * from "./serviceTickets";
export * from "./serviceTicketHistories";
export * from "./ticketCounters";
export * from "./notifications";
export * from "./actionLogs";

export const usersRelations = relations(users, ({ many, one }) => ({
  ticketsAssigned: many(serviceTickets, { relationName: "engineerTickets" }),
  ticketsCreated: many(serviceTickets, { relationName: "creatorTickets" }),
  notifications: many(notifications),
  actionLogs: many(actionLogs),
  clientProfile: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
}));

export const officesRelations = relations(offices, ({ many }) => ({
  clients: many(clients),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  office: one(offices, {
    fields: [clients.officeId],
    references: [offices.id],
  }),
  designation: one(designations, {
    fields: [clients.designationId],
    references: [designations.id],
  }),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  tickets: many(serviceTickets),
}));

export const serviceTicketsRelations = relations(serviceTickets, ({ one, many }) => ({
  client: one(clients, {
    fields: [serviceTickets.clientId],
    references: [clients.id],
  }),
  serviceEngineer: one(users, {
    fields: [serviceTickets.serviceEngineerId],
    references: [users.id],
    relationName: "engineerTickets",
  }),
  createdBy: one(users, {
    fields: [serviceTickets.createdById],
    references: [users.id],
    relationName: "creatorTickets",
  }),
  updatedBy: one(users, {
    fields: [serviceTickets.updatedById],
    references: [users.id],
  }),
  histories: many(serviceTicketHistories),
  notifications: many(notifications),
}));

export const serviceTicketHistoriesRelations = relations(serviceTicketHistories, ({ one }) => ({
  ticket: one(serviceTickets, {
    fields: [serviceTicketHistories.serviceTicketId],
    references: [serviceTickets.id],
  }),
  performedBy: one(users, {
    fields: [serviceTicketHistories.performedById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  ticket: one(serviceTickets, {
    fields: [notifications.ticketId],
    references: [serviceTickets.id],
  }),
}));

export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  user: one(users, {
    fields: [actionLogs.userId],
    references: [users.id],
  }),
}));
