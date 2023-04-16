import { config } from '@root/config';
import databaseConnection from '@root/setupDatabase';
import { SociallyServer } from '@root/setupServer';
import express, { Express } from 'express';

class Application {
  public initialize(): void {
    databaseConnection();
    const app: Express = express();
    const server: SociallyServer = new SociallyServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

const application: Application = new Application();
application.initialize();
