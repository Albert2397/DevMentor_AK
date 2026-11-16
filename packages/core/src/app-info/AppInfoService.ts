export type AppConfig = {
  name: string;
  description: string;
};

export type AppMetadata = {
  title: string;
  description: string;
};

export class AppInfoService {
  private readonly appConfig: AppConfig;

  constructor({ appConfig }: { appConfig: AppConfig }) {
    this.appConfig = appConfig;
  }

  getMetadata(): AppMetadata {
    return { title: this.appConfig.name, description: this.appConfig.description };
  }
}
