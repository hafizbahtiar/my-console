module.exports = {
    apps: [
        {
            name: 'my-console',
            script: './node_modules/.bin/next',
            args: 'start',
            cwd: './',
            instances: 1, // Set to 'max' for cluster mode, or number for specific instances
            exec_mode: 'fork', // Use 'cluster' for load balancing
            watch: false, // Set to true for development auto-reload
            max_memory_restart: '1G', // Restart if memory exceeds 1GB
            env: {
                NODE_ENV: 'production',
                PORT: 8850,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 8855,
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_file: './logs/pm2-combined.log',
            time: true, // Add timestamp to logs
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,
            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        },
    ],
};

