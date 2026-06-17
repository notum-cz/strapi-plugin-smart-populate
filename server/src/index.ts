/**
 * Application methods
 */
import bootstrap from './bootstrap';
import destroy from './destroy';

/**
 * Plugin server methods
 */
import config from './config';
import controllers from './controllers';
import middlewares from './middlewares';
import routes from './routes';

export default {
  bootstrap,
  destroy,
  config,
  controllers,
  middlewares,
  routes,
};
