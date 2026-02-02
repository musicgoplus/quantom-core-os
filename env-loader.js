// Environment Variables Loader
// This loads .env file and makes variables available globally

class EnvLoader {
    constructor() {
        this.env = {};
    }

    async load() {
        try {
            const response = await fetch('.env');
            const text = await response.text();
            this.parseEnv(text);
        } catch (error) {
            console.warn('Could not load .env file. Using fallback values if available.');
        }
    }

    parseEnv(envText) {
        const lines = envText.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                this.env[key.trim()] = value;
            }
        });
    }

    get(key, defaultValue = null) {
        return this.env[key] || defaultValue;
    }

    getAll() {
        return { ...this.env };
    }
}

// Create a global instance
const envLoader = new EnvLoader();

// Auto-load on script initialization
(async () => {
    await envLoader.load();
    console.log('Environment variables loaded successfully');
})();
