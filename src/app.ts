import express, { Express } from 'express';
import { config } from './config';
import databaseConnection from './setupDatabase';
import { SociallyServer } from './setupServer';

class Application {
  public initialize(): void {
    databaseConnection();
    const app: Express = express();
    const server: SociallyServer = new SociallyServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const application: Application = new Application();
application.initialize();
