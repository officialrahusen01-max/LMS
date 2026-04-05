import config from './configuration/config.js';
import app from './app.js';

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});