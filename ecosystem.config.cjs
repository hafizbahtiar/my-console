module.exports = {
    apps: [
        {
            name: 'my-console',
            cwd: '/var/www/my-console',
            script: './node_modules/.bin/next',
            args: 'start',
            interpreter: 'node',
            exec_mode: 'fork',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                PORT: 8850
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 8855
            },
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
    ]
};

