export interface DatabaseHealthCheck {
  ping(): Promise<void>;
}

export type HealthReport = {
  status: "ok" | "degraded";
  database: "up" | "down";
};

export class HealthService {
  private readonly databaseHealthCheck: DatabaseHealthCheck;

  constructor({ databaseHealthCheck }: { databaseHealthCheck: DatabaseHealthCheck }) {
    this.databaseHealthCheck = databaseHealthCheck;
  }

  async check(): Promise<HealthReport> {
    try {
      await this.databaseHealthCheck.ping();
      return { status: "ok", database: "up" };
    } catch {
      return { status: "degraded", database: "down" };
    }
  }
}
